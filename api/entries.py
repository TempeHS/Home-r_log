from flask import jsonify, request
from datetime import datetime
from flask_login import current_user, login_required
from models import LogEntry, User, db, Project, LogEntry
from . import api
from .data_manager import DataManager
from .user_manager import UserManager
import logging
import math
import json
from .gogitter import GoGitter

# logging setup for terminal output
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# when get POST request; check auth, create new entries
@api.route('/entries', methods=['POST'])
@login_required
def create_entry():
    logger.info("=== CREATE ENTRY REQUEST RECEIVED ===")
    
    try:
        data = request.get_json()
        if not data:
            logger.error("No JSON data received")
            return jsonify({'error': 'No data provided'}), 400

        # Use DataManager to validate and sanitize data
        try:
            cleaned_data = DataManager.validate_entry_data(data)
        except ValueError as e:
            logger.error(f"Validation error: {str(e)}")
            return jsonify({'error': str(e)}), 400

        # Create entry with cleaned data
        entry = LogEntry(
            title=cleaned_data['title'],
            content=cleaned_data['content'],
            project_name=cleaned_data['project_name'],
            developer_tag=current_user.developer_tag,
            start_time=cleaned_data['start_time'],
            end_time=cleaned_data['end_time'],
            time_worked=cleaned_data['time_worked'],
            commit_sha=cleaned_data['commit_sha']
        )

        db.session.add(entry)
        db.session.commit()
        logger.info("Successfully created entry")

        return jsonify(entry.to_dict()), 201

    except Exception as e:
        logger.error("Error creating entry", exc_info=True)
        db.session.rollback()
        return jsonify({'error': f'Server error: {str(e)}'}), 500

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
        entry_data = entry.to_dict()
        entry_data['user_reaction'] = entry.get_user_reaction(user.developer_tag)
        return jsonify(entry_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@api.route('/projects/<string:project_name>/commits')
@login_required
def get_project_commits(project_name):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        project = Project.query.get_or_404(project_name)
        gogitter = GoGitter()
        commits = gogitter.get_commit_history(project.repository_url, page, per_page)
        
        commit_data = [{
            'sha': commit.sha,
            'message': commit.commit.message,
            'author': commit.commit.author.name,
            'date': commit.commit.author.date.isoformat()
        } for commit in commits]
        
        return jsonify({
            'commits': commit_data,
            'has_more': len(commit_data) == per_page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500