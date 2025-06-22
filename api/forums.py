from flask import Blueprint, jsonify, request, render_template, abort, flash, redirect, url_for
from flask_login import current_user, login_required
from models import db, Project, LanguageTag, ForumCategory, ForumTopic, ForumReply
from datetime import datetime
import logging

forums_bp = Blueprint('forums', __name__, url_prefix='/forums')
logger = logging.getLogger(__name__)

@forums_bp.route('/')
@login_required
def forum_index():
    """show forum index with all supported languages"""
    # Only show languages that have default forums
    languages = LanguageTag.query.filter(
        LanguageTag.forums.any(ForumCategory.project_name.is_(None))
    ).all()
    
    # Get recent topics across all forums
    recent_topics = ForumTopic.query.join(ForumCategory)\
                                   .order_by(ForumTopic.created_at.desc())\
                                   .limit(10)\
                                   .all()
    
    return render_template('forum.html',
                         forum_title="Programming Forums",
                         languages=languages,
                         recent_topics=recent_topics)

@forums_bp.route('/<language>/<category>')
@login_required
def language_forum(language, category):
    """show language-specific forum"""
    if category not in ['general', 'help']:
        abort(400, description="Invalid category")
        
    tag = LanguageTag.query.filter_by(name=language.lower()).first_or_404()
    forum_cat = ForumCategory.query.filter_by(
        language_tag_id=tag.id,
        name=category,
        project_name=None  # Ensure this is a language forum, not project forum
    ).first_or_404()
    
    topics = ForumTopic.query.filter_by(category_id=forum_cat.id)\
                            .order_by(ForumTopic.created_at.desc())\
                            .all()
    
    return render_template('language_forum.html',
                         language_tag=tag,
                         active_tab=category,
                         topics=topics,
                         category_id=forum_cat.id)

@forums_bp.route('/projects/<project_name>/<category>')
@login_required
def project_forum(project_name, category):
    """show project-specific forum"""
    try:
        if category not in ['general', 'help']:
            abort(400, description="Invalid category")
            
        project = Project.query.get_or_404(project_name)
        forum_cat = ForumCategory.query.filter_by(
            project_name=project_name,
            name=category
        ).first_or_404()
        
        topics = ForumTopic.query.filter_by(category_id=forum_cat.id)\
                                .order_by(ForumTopic.created_at.desc())\
                                .all()
        
        return render_template('base_forum.html',
                             forum_title=f"{project_name} - {category.capitalize()}",
                             project=project,
                             active_tab=category,
                             topics=topics,
                             category_id=forum_cat.id)
                             
    except Exception as e:
        logger.error(f"Error in project forum: {str(e)}")
        abort(500)

@forums_bp.route('/projects/<project_name>/<category>/new', methods=['GET', 'POST'])
@login_required
def new_topic(project_name, category):
    """create a new forum topic"""
    try:
        if category not in ['general', 'help']:
            abort(400, description="Invalid category")
            
        project = Project.query.get_or_404(project_name)
        forum_cat = ForumCategory.query.filter_by(
            project_name=project_name,
            name=category
        ).first_or_404()
        
        if request.method == 'POST':
            # Create new topic
            topic = ForumTopic(
                title=request.form['title'],
                content=request.form['content'],
                category_id=forum_cat.id,
                author_id=current_user.developer_tag,
                project_name=project_name
            )
            
            db.session.add(topic)
            db.session.commit()
            
            flash('Topic created successfully', 'success')
            return redirect(url_for('forums.project_forum', project_name=project_name, category=category))
        
        return render_template('new_topic.html',
                             project=project,
                             category=category)
                             
    except Exception as e:
        logger.error(f"Error creating topic: {str(e)}")
        db.session.rollback()
        flash('Error creating topic', 'error')
        return redirect(url_for('forums.project_forum', project_name=project_name, category=category))

@forums_bp.route('/projects/<project_name>/<category>/topics/<int:topic_id>')
@login_required
def view_topic(project_name, category, topic_id):
    """view a forum topic and its replies"""
    try:
        if category not in ['general', 'help']:
            abort(400, description="Invalid category")
            
        project = Project.query.get_or_404(project_name)
        topic = ForumTopic.query.get_or_404(topic_id)
        
        # Verify this topic belongs to the correct category and project
        if topic.category.project_name != project_name or topic.category.name != category:
            abort(404)
        
        return render_template('topic.html',
                             project=project,
                             category=category,
                             topic=topic)
                             
    except Exception as e:
        logger.error(f"Error viewing topic: {str(e)}")
        flash('Error loading topic', 'error')
        return redirect(url_for('forums.project_forum', project_name=project_name, category=category))

@forums_bp.route('/projects/<project_name>/<category>/topics/<int:topic_id>/reply', methods=['POST'])
@login_required
def add_reply(project_name, category, topic_id):
    """add a reply to a forum topic"""
    try:
        if category not in ['general', 'help']:
            abort(400, description="Invalid category")
            
        topic = ForumTopic.query.get_or_404(topic_id)
        
        # Verify this topic belongs to the correct category and project
        if topic.category.project_name != project_name or topic.category.name != category:
            abort(404)
            
        reply = ForumReply(
            content=request.form['content'],
            topic_id=topic_id,
            author_id=current_user.developer_tag,
            project_name=project_name
        )
        
        db.session.add(reply)
        db.session.commit()
        
        flash('Reply added successfully', 'success')
        return redirect(url_for('forums.view_topic', 
                              project_name=project_name,
                              category=category,
                              topic_id=topic_id))
                              
    except Exception as e:
        logger.error(f"Error adding reply: {str(e)}")
        db.session.rollback()
        flash('Error adding reply', 'error')
        return redirect(url_for('forums.view_topic',
                              project_name=project_name,
                              category=category,
                              topic_id=topic_id))

@forums_bp.route('/<language>/<category>/new', methods=['POST'])
@login_required
def create_language_topic(language, category):
    """create a new topic in a language forum"""
    try:
        if category not in ['general', 'help']:
            abort(400, description="Invalid category")
            
        tag = LanguageTag.query.filter_by(name=language.lower()).first_or_404()
        forum_cat = ForumCategory.query.filter_by(
            language_tag_id=tag.id,
            name=category,
            project_name=None
        ).first_or_404()
        
        topic = ForumTopic(
            title=request.form['title'],
            content=request.form['content'],
            category_id=forum_cat.id,
            author_id=current_user.developer_tag
        )
        
        db.session.add(topic)
        db.session.commit()
        
        flash('Topic created successfully', 'success')
        return redirect(url_for('forums.language_forum', language=language, category=category))
        
    except Exception as e:
        logger.error(f"Error creating language topic: {str(e)}")
        db.session.rollback()
        flash('Error creating topic', 'error')
        return redirect(url_for('forums.language_forum', language=language, category=category))

@forums_bp.route('/<language>/<category>/topics/<int:topic_id>')
@login_required  
def view_language_topic(language, category, topic_id):
    """view a language forum topic and its replies"""
    try:
        if category not in ['general', 'help']:
            abort(400, description="Invalid category")
            
        tag = LanguageTag.query.filter_by(name=language.lower()).first_or_404()
        topic = ForumTopic.query.get_or_404(topic_id)
        
        # Verify this topic belongs to the correct language category
        if (topic.category.language_tag_id != tag.id or 
            topic.category.name != category or 
            topic.category.project_name is not None):
            abort(404)
        
        return render_template('topic.html',
                             language_tag=tag,
                             category=category,
                             topic=topic,
                             is_language_forum=True)
                             
    except Exception as e:
        logger.error(f"Error viewing language topic: {str(e)}")
        flash('Error loading topic', 'error')
        return redirect(url_for('forums.language_forum', language=language, category=category))
