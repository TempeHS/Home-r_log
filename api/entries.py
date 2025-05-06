from flask import jsonify, request
from datetime import datetime
from flask_login import current_user, login_required
from models import LogEntry, User, db
from . import api
from .data_manager import DataManager
from .user_manager import UserManager
import logging
import math

# logging setup for terminal output
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# when get POST request; check auth, create new entries
@api.route('/entries', methods=['POST'])
@login_required
def create_entry():
    logger.info("=== NEW ENTRY CREATION ATTEMPT ===")
    try:
        data = request.get_json()
        logger.info(f"received data: {data}")

        required_fields = ['project_name', 'title', 'content', 'start_time', 'end_time']
        for field in required_fields:
            if not data.get(field):
                raise ValueError(f"Missing required field: {field}")

        # Use DataManager to validate and parse timestamps
        start_time, end_time = DataManager.validate_timestamps(
            data['start_time'], 
            data['end_time']
        )

        # Calculate time worked using DataManager
        time_worked = DataManager.calculate_time_worked(start_time, end_time)
        logger.info(f"Calculated time worked: {time_worked} minutes")

        entry = LogEntry(
            project_name=data['project_name'],
            title=data['title'],
            content=data['content'],
            repository_url=data.get('repository_url'),
            start_time=start_time,
            end_time=end_time,
            time_worked=time_worked,  # Add time_worked field
            developer_tag=current_user.developer_tag
        )

        db.session.add(entry)
        db.session.commit()
        
        logger.info(f"Entry created successfully with title: {entry.title} and time worked: {time_worked} minutes")
        return jsonify({'status': 'success', 'entry': entry.to_dict()}), 201

    except Exception as e:
        logger.error(f"Error during entry creation: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

    finally:
        logger.info("=== ENTRY CREATION ATTEMPT COMPLETE ===\n")

    @require_api_key
    def create_entry_api():
        try:
            data = request.get_json()
            user = User.query.filter_by(api_key=request.headers.get('X-API-Key')).first()
            
            start_time, end_time = DataManager.validate_timestamps(
                data['start_time'], 
                data['end_time']
            )

            entry = LogEntry(
                project=DataManager.sanitize_project(data['project']),
                content=DataManager.sanitize_content(data['content']),
                repository_url=DataManager.sanitize_repository_url(data['repository_url']),
                start_time=start_time,
                end_time=end_time,
                developer_tag=user.developer_tag
            )

            entry.time_worked = calculate_time_worked(entry.start_time, entry.end_time)
            
            db.session.add(entry)
            db.session.commit()
            
            return jsonify(entry.to_dict()), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400


# Get all entries
@api.route('/entries', methods=['GET'])
def get_entries():
    try:
        entries = LogEntry.query.order_by(LogEntry.timestamp.desc()).all()
        return jsonify([entry.to_dict() for entry in entries])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


#when get a GET request; return all projects and developers
@api.route('/entries/metadata', methods=['GET'])
def get_metadata():
    print("\n=== FETCHING METADATA ===")
    try:
        # get unique projects and developers
        projects = db.session.query(LogEntry.project).distinct().all()
        project_list = sorted([project[0] for project in projects])
        
        developers = db.session.query(User.developer_tag).distinct().all()
        developer_list = sorted([dev[0] for dev in developers])
        
        print(f"Found {len(project_list)} projects and {len(developer_list)} developers")
        
        return jsonify({
            'projects': project_list,
            'developers': developer_list
        })
        
    except Exception as e:
        print(f"ERROR fetching metadata: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api.route('/entries/user-stats', methods=['GET'])
def get_user_stats():
    user = UserManager.get_current_user()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401

    try:
        entries = LogEntry.query.filter_by(developer_tag=user.developer_tag).all()
        projects = set(entry.project for entry in entries)
        
        return jsonify({
            'developer_tag': user.developer_tag,
            'email': user.email,
            'project_count': len(projects),
            'entry_count': len(entries),
            'entries': [entry.to_dict() for entry in entries],
            'two_fa_enabled': user.two_fa_enabled
        })
        
    except Exception as e:
        logger.error(f"Error fetching user stats: {str(e)}")
        print(f"ERROR fetching user stats: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api.route('/entries/<int:entry_id>', methods=['GET'])
def get_entry(entry_id):
    user = UserManager.get_current_user()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401

    try:
        entry = LogEntry.query.get_or_404(entry_id)
        return jsonify(entry.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 400
