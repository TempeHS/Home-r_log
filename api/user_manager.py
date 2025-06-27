from flask import session, Blueprint, jsonify, request
from datetime import datetime, timedelta
from models import User, LogEntry, ForumTopic, ForumReply, Comment, db
from .data_manager import DataManager
from flask_login import login_required, current_user
import bcrypt
import hashlib
import logging

logger = logging.getLogger(__name__)

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
        # Get all user data
        entries = LogEntry.query.filter_by(developer_tag=user.developer_tag).all()
        forum_topics = ForumTopic.query.filter_by(author_id=user.developer_tag).all()
        forum_replies = ForumReply.query.filter_by(author_id=user.developer_tag).all()
        entry_comments = Comment.query.filter_by(user_id=user.developer_tag).all()
        
        return {
            'user': {
                'email': user.get_email(),  # Use getter method for email
                'developer_tag': user.developer_tag,
                'created_at': user.id,  # Using id as a proxy since we don't have created_at
                'two_fa_enabled': user.two_fa_enabled,
                'api_enabled': user.api_enabled
            },
            'entries': [entry.to_dict() for entry in entries],
            'forum_posts': [
                {
                    'id': topic.id,
                    'title': topic.title,
                    'content': topic.content,
                    'created_at': topic.created_at.isoformat(),
                    'updated_at': topic.updated_at.isoformat(),
                    'category_id': topic.category_id,
                    'project_name': topic.project_name
                } for topic in forum_topics
            ],
            'forum_replies': [
                {
                    'id': reply.id,
                    'content': reply.content,
                    'created_at': reply.created_at.isoformat(),
                    'topic_id': reply.topic_id,
                    'project_name': reply.project_name
                } for reply in forum_replies
            ],
            'entry_comments': [
                {
                    'id': comment.id,
                    'content': comment.content,
                    'timestamp': comment.timestamp.isoformat(),
                    'entry_id': comment.entry_id,
                    'parent_id': comment.parent_id
                } for comment in entry_comments
            ],
            'projects': [project.to_dict() for project in user.projects],
            'export_date': datetime.utcnow().isoformat()
        }

    @staticmethod
    def delete_user_account(user):
        try:
            # Delete all user-related data in proper order (child records first)
            
            # Delete entry reactions
            from models import EntryReaction
            EntryReaction.query.filter_by(user_id=user.developer_tag).delete()
            
            # Delete comments on entries
            Comment.query.filter_by(user_id=user.developer_tag).delete()
            
            # Delete forum replies
            ForumReply.query.filter_by(author_id=user.developer_tag).delete()
            
            # Delete forum topics
            ForumTopic.query.filter_by(author_id=user.developer_tag).delete()
            
            # Delete log entries
            LogEntry.query.filter_by(developer_tag=user.developer_tag).delete()
            
            # Remove user from project memberships by deleting from association table
            from models import project_members
            db.session.execute(
                project_members.delete().where(
                    project_members.c.user_id == user.developer_tag
                )
            )
            
            # Delete the user account
            db.session.delete(user)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error deleting user account: {str(e)}")
            return False

@user_activity_bp.route('/data', methods=['GET'])
@login_required
def download_user_data():
    """Download all user data as JSON"""
    try:
        user_data = UserManager.download_user_data(current_user)
        return jsonify(user_data)
    except Exception as e:
        logger.error(f"Error downloading user data: {str(e)}")
        return jsonify({'error': 'Failed to download user data'}), 500

@user_activity_bp.route('/data', methods=['DELETE'])
@login_required
def delete_user_account():
    """Delete user account and all associated data"""
    try:
        if UserManager.delete_user_account(current_user):
            # Clear the session
            session.clear()
            return jsonify({'message': 'Account deleted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to delete account'}), 500
    except Exception as e:
        logger.error(f"Error deleting user account: {str(e)}")
        return jsonify({'error': 'Failed to delete account'}), 500
