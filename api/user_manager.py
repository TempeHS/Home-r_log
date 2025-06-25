from flask import session, Blueprint, jsonify, request
from datetime import datetime, timedelta
from models import User, LogEntry, ForumTopic, ForumReply, Comment, db
from .data_manager import DataManager
from flask_login import login_required, current_user
import bcrypt
import hashlib

# Create API blueprint for user activity
user_activity_bp = Blueprint('user_activity', __name__)

@user_activity_bp.route('/forum-posts')
@login_required
def get_user_forum_posts():
    """get current user's forum posts/topics"""
    try:
        # Get topics created by the current user
        topics = ForumTopic.query.filter_by(author_id=current_user.developer_tag)\
                                .order_by(ForumTopic.created_at.desc())\
                                .all()
        
        result = []
        for topic in topics:
            # Determine forum type and URL
            category = topic.category
            if category.project_name:
                # Project forum
                forum_url = f"/projects/{category.project_name}#forum"
                forum_name = f"{category.project_name} - {category.name.title()}"
            else:
                # Language forum
                language_name = category.language_tag.name if category.language_tag else "General"
                forum_url = f"/forums/{language_name}/{category.name}"
                forum_name = f"{language_name.title()} - {category.name.title()}"
            
            result.append({
                'id': topic.id,
                'title': topic.title,
                'content': topic.content[:200] + ('...' if len(topic.content) > 200 else ''),
                'created_at': topic.created_at.isoformat(),
                'updated_at': topic.updated_at.isoformat(),
                'replies_count': topic.replies.count(),
                'forum_name': forum_name,
                'forum_url': forum_url,
                'topic_url': f"{forum_url.split('#')[0]}/topic/{topic.id}"
            })
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_activity_bp.route('/forum-comments')
@login_required
def get_user_forum_comments():
    """get current user's forum replies/comments"""
    try:
        # Get forum replies by the current user
        replies = ForumReply.query.filter_by(author_id=current_user.developer_tag)\
                                 .order_by(ForumReply.created_at.desc())\
                                 .all()
        
        result = []
        for reply in replies:
            topic = reply.topic
            category = topic.category
            
            # Determine forum type and URL
            if category.project_name:
                # Project forum
                forum_url = f"/projects/{category.project_name}#forum"
                forum_name = f"{category.project_name} - {category.name.title()}"
            else:
                # Language forum
                language_name = category.language_tag.name if category.language_tag else "General"
                forum_url = f"/forums/{language_name}/{category.name}"
                forum_name = f"{language_name.title()} - {category.name.title()}"
            
            result.append({
                'id': reply.id,
                'content': reply.content[:150] + ('...' if len(reply.content) > 150 else ''),
                'created_at': reply.created_at.isoformat(),
                'topic_id': topic.id,
                'topic_title': topic.title,
                'forum_name': forum_name,
                'topic_url': f"{forum_url.split('#')[0]}/topic/{topic.id}#{reply.id}"
            })
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_activity_bp.route('/entry-comments')
@login_required  
def get_user_entry_comments():
    """get current user's comments on log entries"""
    try:
        # Get comments by the current user
        comments = Comment.query.filter_by(user_id=current_user.developer_tag)\
                               .order_by(Comment.timestamp.desc())\
                               .all()
        
        result = []
        for comment in comments:
            entry = comment.entry
            result.append({
                'id': comment.id,
                'content': comment.content[:150] + ('...' if len(comment.content) > 150 else ''),
                'timestamp': comment.timestamp.isoformat(),
                'entry_id': entry.id,
                'entry_title': entry.title,
                'project_name': entry.project_name,
                'entry_url': f"/entry/{entry.id}#comment-{comment.id}",
                'parent_id': comment.parent_id
            })
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# user authentication and session management

class UserManager:
    # handles login checks and session management
    SESSION_TIMEOUT = timedelta(hours=24)  

    @staticmethod
    def authenticate(email, password):
        print(f"Authentication attempt for email: {email}")
        email = DataManager.sanitize_email(email)
        
        # During transition, check both hashed and unhashed emails
        # First try to find by email hash
        email_hash = hashlib.sha256(email.encode()).hexdigest()
        user = User.query.filter_by(email_hash=email_hash).first()
        
        # Fallback to temporary email field during migration
        if not user:
            user = User.query.filter_by(_temp_email=email).first()
            
        print(f"User found: {user}")
        
        if user and user.check_password(password):
            print("Password check passed")
            return user

        print("Authentication failed")
        return None

    @staticmethod
    def authenticate_by_api_key(api_key):
        """Authenticate user by API key"""
        if not api_key:
            return None
            
        # Hash the provided API key and find matching user
        api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        user = User.query.filter_by(api_key_hash=api_key_hash, api_enabled=True).first()
        return user

    @staticmethod
    def create_user(email, password, developer_tag):
        email = DataManager.sanitize_email(email)
        developer_tag = DataManager.sanitize_developer_tag(developer_tag)
        
        # Check if email already exists (check both hash and temp field during migration)
        email_hash = hashlib.sha256(email.encode()).hexdigest()
        if User.query.filter_by(email_hash=email_hash).first() or User.query.filter_by(_temp_email=email).first():
            raise ValueError("Email already registered")
        if User.query.filter_by(developer_tag=developer_tag).first():
            raise ValueError("Developer tag already taken")
        
        user = User(developer_tag=developer_tag)
        user.set_email(email)  # This sets both email_hash and _temp_email
        user.set_password(password)
        db.session.add(user)
        return user

#check if session is legit and not expired
    @staticmethod
    def check_session():
        if 'user_id' not in session:
            return False
        if 'last_active' not in session:
            return False
        
        last_active = datetime.fromisoformat(session.get('last_active'))
        if datetime.utcnow() - last_active > UserManager.SESSION_TIMEOUT:
            session.clear()
            return False
            
        # Update last active time
        session['last_active'] = datetime.utcnow().isoformat()
        session.modified = True  # Important for Flask-Session
        return True

    @staticmethod
    def get_current_user():
        if not UserManager.check_session():
            return None
        return User.query.get(session['user_id'])

    @staticmethod
    def download_user_data(user):
        entries = LogEntry.query.filter_by(developer_tag=user.developer_tag).all()
        return {
            'user': {
                'email': user.get_email(),  # Use getter method for email
                'developer_tag': user.developer_tag
            },
            'entries': [entry.to_dict() for entry in entries]
        }

    @staticmethod
    def delete_user_account(user):
        LogEntry.query.filter_by(developer_tag=user.developer_tag).delete()
        db.session.delete(user)
        db.session.commit()
