import re
from datetime import datetime
import bcrypt

class DataManager:
    @staticmethod
    def sanitize_repository_url(url):
        if not url:
            return None
        url = url.strip()
        # Only allow GitHub URLs
        url_pattern = r'^https?:\/\/github\.com\/[\w\-\.\/]+'
        if not re.match(url_pattern, url):
            raise ValueError("URL must be a valid GitHub repository URL")
        return url

    @staticmethod
    def validate_timestamps(start_time, end_time):
        try:
            start = datetime.fromisoformat(start_time)
            end = datetime.fromisoformat(end_time)
            if end <= start:
                raise ValueError("end time must be after start time")
            return start, end
        except ValueError as e:
            raise ValueError(f"invalid timestamp format: {str(e)}")

    @staticmethod
    def calculate_time_worked(start_time, end_time):
        """Calculate time worked in minutes"""
        if not isinstance(start_time, datetime) or not isinstance(end_time, datetime):
            raise ValueError("Invalid timestamp format")
            
        time_diff = end_time - start_time
        minutes = time_diff.total_seconds() / 60
        
        if minutes < 0:
            raise ValueError("End time cannot be before start time")
            
        return round(minutes)

    @staticmethod
    def sanitize_email(email):
        if not email or not isinstance(email, str):
            raise ValueError("Invalid email format")
        email = email.strip().lower()
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            raise ValueError("Invalid email format")
        return email

    @staticmethod
    def sanitize_developer_tag(developer_tag):
        return developer_tag.strip().lower()

    @staticmethod
    def sanitize_project(project):
        if not project or not isinstance(project, str):
            raise ValueError("Invalid project name")
        project = project.strip()
        if len(project) > 100:
            raise ValueError("Project name must be less than 100 characters")
        if not re.match(r'^[a-zA-Z0-9][a-zA-Z0-9\s_-]*$', project):
            raise ValueError("Project name must start with alphanumeric and contain only letters, numbers, spaces, underscores, or hyphens")
        return project[:100]

    @staticmethod
    def sanitize_content(content):
        if not content or not isinstance(content, str):
            raise ValueError("Content cannot be empty")
        content = content.strip()
        if len(content) > 10000:
            raise ValueError("Content exceeds maximum length of 10000 characters")
        return content

    @staticmethod
    def sanitize_search_params(params):
        clean_params = {}
        if 'project' in params:
            clean_params['project'] = DataManager.sanitize_project(params['project'])
        if 'developer_tag' in params:
            clean_params['developer_tag'] = DataManager.sanitize_developer_tag(params['developer_tag'])
        if 'date' in params:
            try:
                datetime.strptime(params['date'], '%Y-%m-%d')
                clean_params['date'] = params['date']
            except ValueError:
                raise ValueError("Invalid date format")
        return clean_params

    @staticmethod
    def validate_password(password):
        if len(password) < 7:
            raise ValueError("Password must be at least 7 characters long")
        if not any(c.isupper() for c in password):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() or not c.isalnum() for c in password):
            raise ValueError("Password must contain at least one number or special character")
        return password.encode('utf-8')

    @staticmethod
    def hash_password(password):
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(DataManager.validate_password(password), salt)

    @staticmethod
    def verify_password(password, hashed):
        return bcrypt.checkpw(DataManager.validate_password(password), hashed)

    @staticmethod
    def validate_entry_data(data):
        """Validate entry data and return cleaned data or raise ValueError"""
        required_fields = ['title', 'content', 'project_name', 'start_time', 'end_time', 'time_worked']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            raise ValueError(f"Missing required fields: {missing_fields}")
            
        # Sanitize text fields
        cleaned_data = {
            'title': DataManager.sanitize_text(data['title']),
            'content': DataManager.sanitize_text(data['content']),
            'project_name': DataManager.sanitize_text(data['project_name']),
            'start_time': DataManager.validate_timestamp(data['start_time']),
            'end_time': DataManager.validate_timestamp(data['end_time']),
            'time_worked': DataManager.validate_time_worked(data['time_worked']),
            'commit_sha': data.get('commit_sha')
        }
        
        return cleaned_data

    @staticmethod
    def get_entry_stats(entry_id):
        """Get all stats for an entry including reactions"""
        entry = LogEntry.query.get_or_404(entry_id)
        stats = {
            'likes_count': entry.reactions.filter_by(reaction_type='like').count(),
            'dislikes_count': entry.reactions.filter_by(reaction_type='dislike').count(),
            'comments_count': entry.comments.count() if hasattr(entry, 'comments') else 0
        }
        return stats

    @staticmethod
    def sanitize_text(text):
        """Sanitize text input to prevent XSS"""
        if not text:
            return ""
        # Allow only basic HTML tags
        allowed_tags = ['b', 'i', 'u', 'p', 'br', 'code']
        return bleach.clean(str(text), tags=allowed_tags, strip=True)

    @staticmethod
    def validate_timestamp(timestamp_str):
        """Validate and parse timestamp"""
        try:
            return datetime.fromisoformat(timestamp_str)
        except (ValueError, TypeError):
            raise ValueError(f"Invalid timestamp format: {timestamp_str}")

    @staticmethod
    def validate_time_worked(time_worked):
        """Validate time worked value"""
        try:
            time = int(time_worked)
            if time < 0:
                raise ValueError
            return time
        except (ValueError, TypeError):
            raise ValueError("Time worked must be a positive integer")

    @staticmethod
    def validate_repository_url(url):
        """Validate GitHub repository URL"""
        if not url:
            raise ValueError("Repository URL is required")
            
        parsed = urlparse(url)
        if not parsed.netloc or 'github.com' not in parsed.netloc:
            raise ValueError("Invalid GitHub repository URL")
            
        path_parts = parsed.path.strip('/').split('/')
        if len(path_parts) < 2:
            raise ValueError("Invalid repository path")
            
        return url

    def get_commit_info(self, project_name):
        """Get commits for a project"""
        try:
            project = Project.query.get_or_404(project_name)
            commits = self.gogitter.get_commit_history(project.repository_url)
            
            formatted_commits = []
            for commit in commits:
                formatted_commits.append({
                    'sha': commit.sha,
                    'message': self.sanitize_text(commit.commit.message),
                    'author': self.sanitize_text(commit.commit.author.name),
                    'date': commit.commit.author.date.isoformat(),
                    'url': commit.html_url
                })
            return formatted_commits
            
        except Exception as e:
            logger.error(f"Error fetching commits: {str(e)}")
            raise

    @staticmethod
    def get_project_stats(project_name):
        """Get all stats for a project"""
        project = Project.query.get_or_404(project_name)
        stats = {
            'total_entries': LogEntry.query.filter_by(project_name=project_name).count(),
            'total_time': db.session.query(db.func.sum(LogEntry.time_worked))
                          .filter_by(project_name=project_name)
                          .scalar() or 0,
            'contributors': db.session.query(LogEntry.developer_tag)
                            .filter_by(project_name=project_name)
                            .distinct()
                            .count()
        }
        return stats
