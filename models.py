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

    def to_dict(self):
        return {
            'name': self.name,
            'description': self.description,
            'repository_url': self.repository_url,
            'created_at': self.created_at.isoformat(),
            'created_by': self.created_by,
            'team_members': [member.developer_tag for member in self.team_members],
            'entry_count': self.entries.count()
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
    time_worked = db.Column(db.Integer, nullable=False)  # in minutes

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
            'time_worked': self.time_worked
        }