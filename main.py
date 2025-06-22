from flask import Flask, render_template, request, session, redirect, url_for, jsonify, flash, current_app
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect
from flask_login import LoginManager, login_required, current_user
import logging
from models import db, User, Project, LogEntry, LanguageTag, ForumCategory
from api.data_manager import DataManager
from api.user_manager import UserManager
from api import api
import os
from config import Config
from flask_mail import Mail
from flask_migrate import Migrate
from api.gogitter import GoGitter 
from datetime import datetime
from flask_session import Session 
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.exceptions import HTTPException  
import tempfile
from datetime import timedelta
from api.forums import forums_bp

# configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def log_request_info():
    logger.info(f"""
Request Details:
  Method: {request.method}
  Path: {request.path}
  Headers: {dict(request.headers)}
  Args: {dict(request.args)}
  Form Data: {dict(request.form)}
  JSON: {request.get_json(silent=True)}
""")

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config.from_object(Config)
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production
app.config['SESSION_TYPE'] = 'filesystem'

# update session configuration
app.config.update(
    SESSION_FILE_DIR=os.path.join(tempfile.gettempdir(), 'flask_session'),
    SESSION_FILE_THRESHOLD=500,  # Number of files before cleanup
    SESSION_PERMANENT=True,  # Make sessions permanent
    PERMANENT_SESSION_LIFETIME=timedelta(hours=24)  # Session lifetime
)

Session(app)  # Initialize Flask-Session

# add this after app creation in main.py
app.wsgi_app = ProxyFix(
    app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1
)

# initialize mail
mail = Mail()
mail.init_app(app)

# initialize CSRF protection
csrf = CSRFProtect()
csrf.init_app(app)

# initialize LoginManager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# database setup
basedir = os.path.abspath(os.path.dirname(__file__))
os.makedirs('.databaseFiles', exist_ok=True)
db_path = os.path.join(basedir, '.databaseFiles', 'devlog.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# cSRF Configuration
app.config['WTF_CSRF_CHECK_DEFAULT'] = False
app.config['WTF_CSRF_HEADERS'] = ['X-CSRF-TOKEN']
app.config['WTF_CSRF_SSL_STRICT'] = True  

db.init_app(app)

# register blueprints
app.register_blueprint(api, url_prefix='/api')
app.register_blueprint(forums_bp, url_prefix='/forums')

# initialize migrations
migrate = Migrate(app, db)

print("Available routes:", [str(rule) for rule in app.url_map.iter_rules()])

# more logging
@app.before_request
def log_request():
    log_request_info()

@app.errorhandler(Exception)
def handle_error(error):
    logger.error(f"Error occurred: {str(error)}", exc_info=True)
    
    if isinstance(error, HTTPException):
        return jsonify({'error': str(error)}), error.code
    
    return jsonify({'error': 'Internal Server Error'}), 500

def check_auth():
    return 'user_id' in session

@app.route('/')
@login_required  # Add login requirement
def index():
    project_name = request.args.get('project_name')
    projects = current_user.projects.all()  # Now safe to access projects
    return render_template('index.html', projects=projects, project_name=project_name)

@app.route('/signup')
def signup():
    return render_template('signup.html', hide_nav=True)

@app.route('/login')
def login():
    return render_template('login.html', hide_nav=True)

@app.route('/search')
def search():
    if not check_auth():
        return redirect(url_for('login'))
    return render_template('search.html')

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


@app.route('/privacy')
def privacy():
    if not check_auth():
        return redirect(url_for('login'))
    return render_template('privacy.html')

@app.route('/home')
def home():
    if not check_auth():
        return redirect(url_for('login'))
    return render_template('home.html')

@app.route('/entry/<int:entry_id>')
@login_required
def view_entry(entry_id):
    try:
        entry = LogEntry.query.get_or_404(entry_id)
        entry_data = entry.to_dict()
        entry_data['user_reaction'] = entry.get_user_reaction(current_user.developer_tag)
        entry_data['likes_count'] = entry.reactions.filter_by(reaction_type='like').count()
        entry_data['dislikes_count'] = entry.reactions.filter_by(reaction_type='dislike').count()
        
        app.logger.debug(f"Entry data: {entry_data}")
        return render_template('entry_veiw.html',
                            entry=entry_data,
                            show_message_box=True)
    except Exception as e:
        app.logger.error(f"Error viewing entry: {str(e)}", exc_info=True)
        flash('Error loading entry', 'error')
        return redirect(url_for('index'))

@app.route('/profile')
def profile():
    if not check_auth():
        return redirect(url_for('login'))
    return render_template('profile.html')


@app.route('/projects')
@login_required
def projects():
    projects = Project.query.all()
    return render_template('projects.html', projects=projects)

@app.route('/projects/<string:project_name>')
@login_required
def view_project(project_name):
    try:
        project = Project.query.get_or_404(project_name)
        entries = LogEntry.query.filter_by(project_name=project_name)\
                              .order_by(LogEntry.timestamp.desc())\
                              .all()
                              
        # Get forum categories for this project
        forums = ForumCategory.query.filter_by(project_name=project_name).all()
        
        # Get commits from GitHub
        gogitter = GoGitter()
        commits_data = gogitter.get_commit_history(project.repository_url)
        
        # Format commits for template with related entries
        commits = []
        for commit in commits_data:
            # Find entries related to this commit
            related_entries = LogEntry.query.filter_by(
                project_name=project_name, 
                commit_sha=commit.sha
            ).all()
            
            commits.append({
                'sha': commit.sha,
                'message': commit.commit.message,
                'author': commit.commit.author.name,
                'date': commit.commit.author.date,
                'url': commit.html_url,
                'related_entries': [{'id': entry.id, 'title': entry.title} for entry in related_entries]
            })
        
        entries_json = [entry.to_dict() for entry in entries]
        logger.info(f"Entries JSON: {entries_json}")
        logger.info(f"Commits with related entries: {[(c['sha'][:7], len(c['related_entries'])) for c in commits]}")
        
        return render_template('project.html',
                             project=project,
                             entries=entries,
                             entries_json=entries_json,
                             commits=commits,
                             forums=forums)
                             
    except Exception as e:
        logger.error(f"Error viewing project: {str(e)}", exc_info=True)
        flash('Error loading project', 'error')
        return redirect(url_for('projects'))

@app.route('/projects/new', methods=['GET', 'POST'])
@login_required
def new_project():
    logger.info("New project creation attempt")
    try:
        if request.method == 'POST':
            # Get form data
            name = request.form.get('name')
            description = request.form.get('description')
            repository_url = request.form.get('repository_url')
            team_members = request.form.getlist('team_members')
            
            logger.info(f"Attempting to create project with name: {name}, repo: {repository_url}")
            
            # Basic validation
            if not all([name, description, repository_url]):
                raise ValueError("All fields are required")
            
            # Validate repository URL
            if not repository_url.startswith('https://github.com/'):
                raise ValueError("Invalid GitHub repository URL")
            
            # Create project
            project = Project(
                name=name,
                description=description,
                repository_url=repository_url,
                created_by=current_user.developer_tag
            )
            
            # Add team members
            if team_members:
                users = User.query.filter(User.developer_tag.in_(team_members)).all()
                project.team_members.extend(users)
                logger.info(f"Added {len(users)} team members to project")
            
            # Always add creator as team member
            if current_user not in project.team_members:
                project.team_members.append(current_user)
            
            # Get languages from GitHub and create tags
            gogitter = GoGitter()
            languages = gogitter.get_repository_languages(repository_url)
            
            for lang in languages:
                # Check if tag exists, create if not
                tag = LanguageTag.query.filter_by(name=lang.lower()).first()
                if not tag:
                    tag = LanguageTag(name=lang.lower())
                    db.session.add(tag)
                project.tags.append(tag)
            
            # Create forum categories for the project
            for category in ['general', 'help']:
                forum = ForumCategory(
                    name=category,
                    project_name=project.name
                )
                db.session.add(forum)
            
            db.session.add(project)
            db.session.commit()
            
            logger.info(f"Successfully created project: {name}")
            flash(f'Project {name} created successfully', 'success')
            return redirect(url_for('view_project', project_name=project.name))
            
    except ValueError as e:
        logger.error(f"Validation error in project creation: {str(e)}")
        flash(str(e), 'error')
        return redirect(url_for('new_project'))
    except Exception as e:
        logger.error(f"Error creating project: {str(e)}", exc_info=True)
        db.session.rollback()
        flash('Error creating project', 'error')
        
    users = User.query.all()
    return render_template('new_project.html', users=users)

@app.route('/entry/new/<string:project_name>', methods=['GET', 'POST'])
@login_required
def new_entry(project_name):
    try:
        project = Project.query.filter_by(name=project_name).first_or_404()
        
        if request.method == 'POST':
            commit_data = json.loads(request.form.get('commit', '{}'))
            
            entry = LogEntry(
                title=request.form['title'],
                content=request.form['content'],
                project_name=project_name,
                developer_tag=current_user.developer_tag,
                start_time=datetime.fromisoformat(request.form['start_time']),
                end_time=datetime.fromisoformat(request.form['end_time']),
                time_worked=int(request.form['time_worked']),
                commit_sha=commit_data.get('sha'),
                commit_url=commit_data.get('url')
            )
            
            db.session.add(entry)
            db.session.commit()
            
            logger.info(f"Created new entry for project {project_name}")
            return redirect(url_for('view_project', project_name=project_name))
            
    except Exception as e:
        logger.error(f"Error creating entry: {str(e)}")
        flash('Error creating entry', 'error')
        
    return render_template('form.html', project_name=project_name)

@app.route('/api/projects/<string:project_name>/commits', methods=['GET'])
@login_required
def get_project_commits(project_name):
    try:
        project = Project.query.filter_by(name=project_name).first_or_404()
        github = GoGitter()
        commits = github.get_commit_history(project.repository_url)
        return jsonify(commits)
    except Exception as e:
        logger.error(f"Error fetching commits: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.template_filter('format_date')
def format_date(value, format='%Y-%m-%d %H:%M'):
    if not value:
        return ''
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value)
        except ValueError:
            return value
    if isinstance(value, datetime):
        return value.strftime(format)
    return str(value)

@app.template_filter('datetime')
def format_datetime(value):
    if isinstance(value, str):
        value = datetime.fromisoformat(value.replace('Z', '+00:00'))
    return value.strftime('%Y-%m-%d %H:%M:%S')

#HAVE THIS AT THE END!!!!
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True) 
    #turn to True for logs