from flask import Flask, render_template, request, session, redirect, url_for, jsonify, flash
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect
from flask_login import LoginManager, login_required, current_user
import logging
from models import db, User, Project, LogEntry
from api.data_manager import DataManager
from api.user_manager import UserManager
from api import api
import os
from config import Config
from flask_mail import Mail
from flask_migrate import Migrate
from api.gogitter import GoGitter 

# Configure logging
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

# CSRF Configuration
app.config['WTF_CSRF_CHECK_DEFAULT'] = False
app.config['WTF_CSRF_HEADERS'] = ['X-CSRF-TOKEN']

db.init_app(app)
app.register_blueprint(api, url_prefix='/api')

# Initialize migrations
migrate = Migrate(app, db)

print("Available routes:", [str(rule) for rule in app.url_map.iter_rules()])

# more logging
@app.before_request
def log_request():
    log_request_info()

@app.errorhandler(Exception)
def handle_error(error):
    logger.error(f"Error occurred: {str(error)}", exc_info=True)
    return jsonify({"error": str(error)}), 500

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
def view_entry(entry_id):
    if not check_auth():
        return redirect(url_for('login'))
    return render_template('entry_veiw.html')

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
        project = Project.query.filter_by(name=project_name).first_or_404()
        entries = LogEntry.query.filter_by(project_name=project.name).order_by(LogEntry.timestamp.desc()).all()
        
        # Fetch GitHub commit history using GoGitter
        github = GoGitter()
        commits = github.get_commit_history(project.repository_url)
        repo_info = github.get_repo_info(project.repository_url)
        
        logger.info(f"Viewing project {project_name} with {len(entries)} entries and {len(commits)} commits")
        return render_template('project.html', 
                             project=project, 
                             entries=entries, 
                             commits=commits,
                             repo_info=repo_info)
    except Exception as e:
        logger.error(f"Error viewing project {project_name}: {str(e)}", exc_info=True)
        flash('Error viewing project', 'error')
        return redirect(url_for('projects'))

@app.route('/projects/new', methods=['GET', 'POST'])
@login_required
def new_project():
    logger.info("New project creation attempt")
    try:
        if request.method == 'POST':
            name = request.form.get('name')
            description = request.form.get('description')
            repository_url = request.form.get('repository_url')
            team_members = request.form.getlist('team_members')
            
            logger.info(f"Attempting to create project with name: {name}, repo: {repository_url}")
            
            # Basic validation first
            if not all([name, description, repository_url]):
                raise ValueError("All fields are required")
            
            # Validate repository URL
            repository_url = DataManager.sanitize_repository_url(repository_url)
            
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
    return render_template('newproject.html', users=users)

#HAVE THIS AT THE END!!!!
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True) 
    #turn to True for logs