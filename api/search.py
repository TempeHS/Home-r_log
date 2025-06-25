from flask import jsonify, request
from datetime import datetime
from models import LogEntry, db, Project, User, LanguageTag, ForumTopic, ForumReply, ForumCategory, project_tags
from . import api
from .data_manager import DataManager
from .user_manager import UserManager
import logging
from sqlalchemy import or_, and_, func

logger = logging.getLogger(__name__)

@api.route('/entries/search', methods=['GET'])
def search_entries():
    logger.info("Search request received")
    
    if not UserManager.check_session():
        logger.warning("Unauthorized search attempt")
        return jsonify({'error': 'Authentication required'}), 401
    
    # if no search parameters are provided, tell error
    if not any([
    request.args.get('project'),
    request.args.get('developer_tag'),
    request.args.get('date')
    ]):
        return jsonify({'error': 'Please enter at least one search parameter'}), 400

    try:
        query = LogEntry.query
        search_params = []

        # date filter using timestamp
        date = request.args.get('date')
        if date:
            search_date = datetime.strptime(date, '%Y-%m-%d')
            query = query.filter(db.func.date(LogEntry.timestamp) == search_date.date())
            search_params.append(f"date: {date}")

        # project filter (only apply if true)
        project = request.args.get('project', '')
        if project:
            project = DataManager.sanitize_project(project)
            query = query.filter(LogEntry.project_name.ilike(f"%{project}%"))
            search_params.append(f"project: {project}")

        # developer filter (only apply if true)
        developer = request.args.get('developer_tag', '')
        if developer:
            developer = DataManager.sanitize_developer_tag(developer)
            query = query.filter(LogEntry.developer_tag.ilike(f"%{developer}%"))
            search_params.append(f"developer: {developer}")

        # sort
        sort_field = request.args.get('sort_field', 'date')
        sort_order = request.args.get('sort_order', 'desc')
        
        if sort_field == 'project':
            query = query.order_by(
                LogEntry.project_name.desc() if sort_order == 'desc' 
                else LogEntry.project_name.asc()
            )
        else:
            query = query.order_by(
                LogEntry.timestamp.desc() if sort_order == 'desc' 
                else LogEntry.timestamp.asc()
            )

        entries = query.all()
        logger.info(f"Search completed with params: {', '.join(search_params)}")
        logger.info(f"Found {len(entries)} matching entries")

        return jsonify([entry.to_dict() for entry in entries])

    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return jsonify({'error': str(e)}), 400

@api.route('/search/metadata', methods=['GET'])
def get_search_metadata():
    """get all metadata for advanced search filters"""
    logger.info("Advanced search metadata request received")
    
    if not UserManager.check_session():
        logger.warning("Unauthorized search metadata attempt")
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        # get all projects with entry counts
        projects = db.session.query(
            Project.name,
            Project.description,
            func.count(LogEntry.id).label('entry_count')
        ).outerjoin(LogEntry, Project.name == LogEntry.project_name)\
         .group_by(Project.name, Project.description)\
         .order_by(Project.name).all()
        
        # get all languages with usage counts
        languages = db.session.query(
            LanguageTag.name,
            func.count(Project.name).label('project_count')
        ).outerjoin(Project.tags)\
         .group_by(LanguageTag.name)\
         .order_by(LanguageTag.name).all()
        
        # get all users with entry counts
        users = db.session.query(
            User.developer_tag,
            func.count(LogEntry.id).label('entry_count')
        ).outerjoin(LogEntry, User.developer_tag == LogEntry.developer_tag)\
         .group_by(User.developer_tag)\
         .order_by(User.developer_tag).all()
        
        logger.info(f"Found {len(projects)} projects, {len(languages)} languages, {len(users)} users")
        
        return jsonify({
            'projects': [{'name': p.name, 'description': p.description, 'entry_count': p.entry_count} for p in projects],
            'languages': [{'name': l.name, 'project_count': l.project_count} for l in languages],
            'users': [{'developer_tag': u.developer_tag, 'entry_count': u.entry_count} for u in users]
        })
        
    except Exception as e:
        logger.error(f"Search metadata error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@api.route('/search/entries/advanced', methods=['GET'])
def advanced_entry_search():
    """advanced search for entries with multiple filters"""
    logger.info("Advanced entry search request received")
    
    if not UserManager.check_session():
        logger.warning("Unauthorized advanced search attempt")
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        query = LogEntry.query
        search_params = []

        # text search in title and content
        text = request.args.get('text', '').strip()
        if text:
            query = query.filter(
                or_(
                    LogEntry.title.ilike(f"%{text}%"),
                    LogEntry.content.ilike(f"%{text}%")
                )
            )
            search_params.append(f"text: {text}")

        # project filter (multiple projects)
        projects = request.args.getlist('projects[]') or request.args.getlist('projects')
        if projects:
            query = query.filter(LogEntry.project_name.in_(projects))
            search_params.append(f"projects: {', '.join(projects)}")

        # user filter (multiple users)
        users = request.args.getlist('users[]') or request.args.getlist('users')
        if users:
            query = query.filter(LogEntry.developer_tag.in_(users))
            search_params.append(f"users: {', '.join(users)}")

        # date range filter
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        if date_from:
            start_date = datetime.strptime(date_from, '%Y-%m-%d')
            query = query.filter(LogEntry.timestamp >= start_date)
            search_params.append(f"from: {date_from}")
        if date_to:
            end_date = datetime.strptime(date_to, '%Y-%m-%d')
            # add one day to include the end date
            end_date = end_date.replace(hour=23, minute=59, second=59)
            query = query.filter(LogEntry.timestamp <= end_date)
            search_params.append(f"to: {date_to}")

        # language filter (through project tags)
        languages = request.args.getlist('languages[]') or request.args.getlist('languages')
        if languages:
            # join with projects that have these language tags
            query = query.join(Project, LogEntry.project_name == Project.name)\
                        .join(Project.tags)\
                        .filter(LanguageTag.name.in_(languages))
            search_params.append(f"languages: {', '.join(languages)}")

        # sort options
        sort_field = request.args.get('sort_field', 'timestamp')
        sort_order = request.args.get('sort_order', 'desc')
        
        if sort_field == 'likes':
            # sort by like count
            query = query.outerjoin(LogEntry.reactions)\
                        .group_by(LogEntry.id)\
                        .order_by(
                            func.count(LogEntry.reactions).desc() if sort_order == 'desc'
                            else func.count(LogEntry.reactions).asc()
                        )
        elif sort_field == 'comments':
            # sort by comment count
            query = query.outerjoin(LogEntry.comments)\
                        .group_by(LogEntry.id)\
                        .order_by(
                            func.count(LogEntry.comments).desc() if sort_order == 'desc'
                            else func.count(LogEntry.comments).asc()
                        )
        elif sort_field == 'project':
            query = query.order_by(
                LogEntry.project_name.desc() if sort_order == 'desc' 
                else LogEntry.project_name.asc()
            )
        else:  # default to timestamp
            query = query.order_by(
                LogEntry.timestamp.desc() if sort_order == 'desc' 
                else LogEntry.timestamp.asc()
            )

        # pagination
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        entries = query.paginate(
            page=page, 
            per_page=per_page,
            error_out=False
        )
        
        logger.info(f"Advanced search completed with params: {', '.join(search_params) if search_params else 'none'}")
        logger.info(f"Found {entries.total} matching entries, showing page {page}")

        return jsonify({
            'entries': [entry.to_dict() for entry in entries.items],
            'pagination': {
                'page': entries.page,
                'pages': entries.pages,
                'per_page': entries.per_page,
                'total': entries.total,
                'has_next': entries.has_next,
                'has_prev': entries.has_prev
            },
            'search_params': search_params
        })

    except Exception as e:
        logger.error(f"Advanced search error: {str(e)}")
        return jsonify({'error': str(e)}), 400

@api.route('/search/projects/advanced', methods=['GET'])
def advanced_project_search():
    """advanced search for projects"""
    logger.info("Advanced project search request received")
    
    if not UserManager.check_session():
        logger.warning("Unauthorized project search attempt")
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        # debug: Log all request parameters
        logger.info(f"DEBUG: All request args: {dict(request.args)}")
        
        query = Project.query
        search_params = []

        # Text search in name and description
        text = request.args.get('text', '').strip()
        if text:
            query = query.filter(
                or_(
                    Project.name.ilike(f"%{text}%"),
                    Project.description.ilike(f"%{text}%")
                )
            )
            search_params.append(f"text: {text}")

        # User filter (team members or created by)
        users = request.args.getlist('users[]') or request.args.getlist('users')
        if users:
            query = query.filter(
                or_(
                    Project.created_by.in_(users),
                    Project.team_members.any(User.developer_tag.in_(users))
                )
            )
            search_params.append(f"users: {', '.join(users)}")

        # Language filter
        languages = request.args.getlist('languages[]') or request.args.getlist('languages')
        logger.info(f"DEBUG: Received languages: {languages}")
        if languages:
            # Find projects that have at least one of the specified languages
            query = query.join(Project.tags).filter(LanguageTag.name.in_(languages)).distinct()
            search_params.append(f"languages: {', '.join(languages)}")
            logger.info(f"DEBUG: Applied language filter, search_params: {search_params}")

        # Sort options
        sort_field = request.args.get('sort_field', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        if sort_field == 'entries':
            # Sort by entry count
            query = query.outerjoin(LogEntry, Project.name == LogEntry.project_name)\
                        .group_by(Project.name)\
                        .order_by(
                            func.count(LogEntry.id).desc() if sort_order == 'desc'
                            else func.count(LogEntry.id).asc()
                        )
        else:  # default to created_at
            query = query.order_by(
                Project.created_at.desc() if sort_order == 'desc' 
                else Project.created_at.asc()
            )

        # Get all matching projects
        projects = query.all()
        
        # Add entry counts and other stats
        project_results = []
        for project in projects:
            project_dict = project.to_dict()
            project_dict['entry_count'] = project.entries.count()
            project_dict['team_size'] = len(project.team_members)
            project_dict['languages'] = [tag.name for tag in project.tags]
            project_results.append(project_dict)
        
        logger.info(f"Project search completed with params: {', '.join(search_params) if search_params else 'none'}")
        logger.info(f"Found {len(project_results)} matching projects")

        return jsonify({
            'projects': project_results,
            'search_params': search_params
        })

    except Exception as e:
        logger.error(f"Project search error: {str(e)}")
        return jsonify({'error': str(e)}), 400

@api.route('/search/forums/advanced', methods=['GET'])
def advanced_forum_search():
    """advanced search for forum topics and replies"""
    logger.info("Advanced forum search request received")
    
    if not UserManager.check_session():
        logger.warning("Unauthorized forum search attempt")
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        # Search in both topics and replies
        topic_query = ForumTopic.query
        reply_query = ForumReply.query
        search_params = []

        # Text search in title and content
        text = request.args.get('text', '').strip()
        if text:
            topic_query = topic_query.filter(
                or_(
                    ForumTopic.title.ilike(f"%{text}%"),
                    ForumTopic.content.ilike(f"%{text}%")
                )
            )
            reply_query = reply_query.filter(
                ForumReply.content.ilike(f"%{text}%")
            )
            search_params.append(f"text: {text}")

        # User filter
        users = request.args.getlist('users[]') or request.args.getlist('users')
        if users:
            topic_query = topic_query.filter(ForumTopic.author_id.in_(users))
            reply_query = reply_query.filter(ForumReply.author_id.in_(users))
            search_params.append(f"users: {', '.join(users)}")

        # Language filter
        languages = request.args.getlist('languages[]') or request.args.getlist('languages')
        if languages:
            topic_query = topic_query.join(ForumCategory)\
                                   .join(LanguageTag, ForumCategory.language_tag_id == LanguageTag.id)\
                                   .filter(LanguageTag.name.in_(languages))
            reply_query = reply_query.join(ForumTopic)\
                                   .join(ForumCategory)\
                                   .join(LanguageTag, ForumCategory.language_tag_id == LanguageTag.id)\
                                   .filter(LanguageTag.name.in_(languages))
            search_params.append(f"languages: {', '.join(languages)}")

        # Project filter
        projects = request.args.getlist('projects[]') or request.args.getlist('projects')
        if projects:
            topic_query = topic_query.filter(ForumTopic.project_name.in_(projects))
            reply_query = reply_query.filter(ForumReply.project_name.in_(projects))
            search_params.append(f"projects: {', '.join(projects)}")

        # Execute queries
        topics = topic_query.order_by(ForumTopic.created_at.desc()).all()
        replies = reply_query.order_by(ForumReply.created_at.desc()).all()
        
        # Format results
        results = []
        for topic in topics:
            results.append({
                'type': 'topic',
                'id': topic.id,
                'title': topic.title,
                'content': topic.content,
                'author': topic.author_id,
                'created_at': topic.created_at.isoformat() if topic.created_at else None,
                'category': topic.category.name if topic.category else None,
                'language': topic.category.language_tag.name if topic.category and topic.category.language_tag else None,
                'project': topic.project_name,
                'reply_count': topic.replies.count()
            })
        
        for reply in replies:
            results.append({
                'type': 'reply',
                'id': reply.id,
                'content': reply.content,
                'author': reply.author_id,
                'created_at': reply.created_at.isoformat() if reply.created_at else None,
                'topic_title': reply.topic.title if reply.topic else None,
                'topic_id': reply.topic_id,
                'category': reply.topic.category.name if reply.topic and reply.topic.category else None,
                'language': reply.topic.category.language_tag.name if reply.topic and reply.topic.category and reply.topic.category.language_tag else None,
                'project': reply.project_name
            })
        
        # Sort by created_at
        results.sort(key=lambda x: x['created_at'] or '', reverse=True)
        
        logger.info(f"Forum search completed with params: {', '.join(search_params) if search_params else 'none'}")
        logger.info(f"Found {len(results)} matching forum items")

        return jsonify({
            'results': results,
            'search_params': search_params
        })

    except Exception as e:
        logger.error(f"Forum search error: {str(e)}")
        return jsonify({'error': str(e)}), 400