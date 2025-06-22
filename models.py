from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_login import UserMixin
import bcrypt
import secrets

db = SQLAlchemy()

# Updated association table to use project name instead of id
project_members = db.Table('project_members',
    db.Column('project_name', db.String(100), db.ForeignKey('project.name')),
    db.Column('user_id', db.String(50), db.ForeignKey('user.developer_tag'))
)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.LargeBinary)
    developer_tag = db.Column(db.String(50), unique=True, nullable=False)
    two_fa_enabled = db.Column(db.Boolean, default=False)
    two_fa_verified = db.Column(db.Boolean, default=False)
    api_key = db.Column(db.String(40), unique=True)
    api_enabled = db.Column(db.Boolean, default=False)

    def set_password(self, password):
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt)

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash)

    def generate_api_key(self):
        self.api_key = f"dvlg_{secrets.token_hex(16)}"
        self.api_enabled = True
        return self.api_key

class Project(db.Model):
    name = db.Column(db.String(100), primary_key=True)
    description = db.Column(db.Text, nullable=False)
    repository_url = db.Column(db.String(500), nullable=False)  # Make repository required
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.String(50), db.ForeignKey('user.developer_tag'), nullable=False)
    
    # Relationships
    team_members = db.relationship('User', secondary=project_members,
                                 backref=db.backref('projects', lazy='dynamic'))
    entries = db.relationship('LogEntry', backref='project', lazy='dynamic')
    tags = db.relationship('LanguageTag', secondary='project_tags', back_populates='projects')
    forums = db.relationship('ForumCategory', backref='project', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'name': self.name,
            'description': self.description,
            'repository_url': self.repository_url,
            'created_at': self.created_at,  # Keep as datetime object
            'created_by': self.created_by,
            'team_members': [member.developer_tag for member in self.team_members]
        }

class LogEntry(db.Model):
    __tablename__ = 'log_entry'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    project_name = db.Column(db.String(100), db.ForeignKey('project.name'), nullable=False)
    developer_tag = db.Column(db.String(50), db.ForeignKey('user.developer_tag'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    time_worked = db.Column(db.Integer, nullable=False)  
    commit_sha = db.Column(db.String(40))  
    
    # Add relationships for reactions and comments
    reactions = db.relationship('EntryReaction', backref='entry', lazy='dynamic',
                              cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='entry', lazy='dynamic',
                             cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'project_name': self.project_name,
            'developer_tag': self.developer_tag,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'time_worked': self.time_worked,
            'commit_sha': self.commit_sha,
            'likes_count': self.reactions.filter_by(reaction_type='like').count(),
            'dislikes_count': self.reactions.filter_by(reaction_type='dislike').count(),
            'comments_count': self.comments.count()
        }

    def get_user_reaction(self, user_id):
        """get the reaction of a specific user for this entry"""
        reaction = self.reactions.filter_by(user_id=user_id).first()
        return reaction.reaction_type if reaction else None

    def toggle_reaction(self, user_id, reaction_type):
        """toggle a user's reaction (like/dislike) for this entry"""
        existing_reaction = self.reactions.filter_by(user_id=user_id).first()
        
        if existing_reaction:
            # If same type, just remove it
            if existing_reaction.reaction_type == reaction_type:
                db.session.delete(existing_reaction)
                db.session.flush()  # Flush to ensure the unique constraint is cleared
            # If different type, remove old one and add new one
            else:
                db.session.delete(existing_reaction)
                db.session.flush()  # Flush to ensure the unique constraint is cleared
                new_reaction = EntryReaction(
                    entry_id=self.id,
                    user_id=user_id,
                    reaction_type=reaction_type,
                    project_name=self.project_name
                )
                db.session.add(new_reaction)
        else:
            # No existing reaction, just add the new one
            new_reaction = EntryReaction(
                entry_id=self.id,
                user_id=user_id,
                reaction_type=reaction_type,
                project_name=self.project_name
            )
            db.session.add(new_reaction)

class EntryReaction(db.Model):
    __tablename__ = 'entry_reaction'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(50), db.ForeignKey('user.developer_tag'), nullable=False)
    entry_id = db.Column(db.Integer, db.ForeignKey('log_entry.id', ondelete='CASCADE'), nullable=False)
    reaction_type = db.Column(db.String(10), nullable=False)  # 'like' or 'dislike'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    project_name = db.Column(db.String(100), db.ForeignKey('project.name'), nullable=False)

    # Ensure a user can only react once per entry
    __table_args__ = (
        db.UniqueConstraint('user_id', 'entry_id', name='unique_user_entry_reaction'),
    )

class Comment(db.Model):
    __tablename__ = 'comment'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    entry_id = db.Column(db.Integer, db.ForeignKey('log_entry.id'), nullable=False)
    user_id = db.Column(db.String(50), db.ForeignKey('user.developer_tag'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    parent_id = db.Column(db.Integer, db.ForeignKey('comment.id'), nullable=True)  # For nested comments

    # Relationships
    replies = db.relationship('Comment', backref=db.backref('parent', remote_side=[id]),
                            cascade='all, delete-orphan')
    author = db.relationship('User', backref='comments')

    def to_dict(self):
        return {
            'id': self.id,
            'entry_id': self.entry_id,
            'user_id': self.user_id,
            'content': self.content,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'parent_id': self.parent_id,
            'replies': [reply.to_dict() for reply in self.replies]
        }

class LanguageTag(db.Model):
    __tablename__ = 'language_tags'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    projects = db.relationship('Project', secondary='project_tags', back_populates='tags')
    forums = db.relationship('ForumCategory', backref='language_tag', lazy='dynamic')
    
    def get_icon_path(self):
        """get the path to the language icon"""
        # Map some common language variations to consistent names
        icon_map = {
            'c++': 'cpp',
            'c#': 'csharp',
            'javascript': 'js',
            'typescript': 'ts'
        }
        icon_name = icon_map.get(self.name.lower(), self.name.lower())
        return f'images/{icon_name}.png'
    
    def has_default_forums(self):
        """check if this language has default general and help forums"""
        return self.forums.filter_by(project_name=None).count() >= 2
    
    def __repr__(self):
        return f'<LanguageTag {self.name}>'

# Association table for Project-Tag many-to-many relationship
project_tags = db.Table('project_tags',
    db.Column('project_name', db.String(100), db.ForeignKey('project.name')),
    db.Column('tag_id', db.Integer, db.ForeignKey('language_tags.id'))
)

class ForumCategory(db.Model):
    __tablename__ = 'forum_categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)  # 'general' or 'help'
    language_tag_id = db.Column(db.Integer, db.ForeignKey('language_tags.id'), nullable=True)
    project_name = db.Column(db.String(100), db.ForeignKey('project.name'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    topics = db.relationship('ForumTopic', backref='category', lazy='dynamic', cascade='all, delete-orphan')
    
    def is_project_forum(self):
        """check if this is a project-specific forum"""
        return self.project_name is not None
    
    def is_language_forum(self):
        """check if this is a language-specific forum"""
        return self.language_tag_id is not None and self.project_name is None

class ForumTopic(db.Model):
    __tablename__ = 'forum_topics'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    category_id = db.Column(db.Integer, db.ForeignKey('forum_categories.id'))
    author_id = db.Column(db.String(50), db.ForeignKey('user.developer_tag'))
    project_name = db.Column(db.String(100), db.ForeignKey('project.name'), nullable=True)
    
    replies = db.relationship('ForumReply', backref='topic', lazy='dynamic', cascade='all, delete-orphan')
    author = db.relationship('User', backref='topics')

class ForumReply(db.Model):
    __tablename__ = 'forum_replies'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    topic_id = db.Column(db.Integer, db.ForeignKey('forum_topics.id'))
    author_id = db.Column(db.String(50), db.ForeignKey('user.developer_tag'))
    project_name = db.Column(db.String(100), db.ForeignKey('project.name'), nullable=True)
    
    author = db.relationship('User', backref='replies')

