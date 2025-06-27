from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from models import LogEntry, Project, User, Comment, ForumReply, ForumTopic, ForumCategory, EntryReaction
from sqlalchemy import desc, func
from datetime import datetime, timedelta

feed_bp = Blueprint('feed', __name__)

@feed_bp.route('/dashboard')
@login_required
def dashboard_feed():
    try:
        # Get user stats
        user_stats = {
            'project_count': current_user.projects.count(),
            'entry_count': LogEntry.query.filter_by(developer_tag=current_user.developer_tag).count()
        }
        
        # Get reaction stats
        total_likes = 0
        total_score = 0
        user_entries = LogEntry.query.filter_by(developer_tag=current_user.developer_tag).all()
        for entry in user_entries:
            likes_count = entry.reactions.filter_by(reaction_type=1).count()  # ReactionType.LIKE = 1
            dislikes_count = entry.reactions.filter_by(reaction_type=2).count()  # ReactionType.DISLIKE = 2
            total_likes += likes_count
            total_score += (likes_count - dislikes_count)
        
        reaction_stats = {
            'total_likes': total_likes,
            'total_score': total_score
        }
        
        # Get recent entries (last 10)
        recent_entries = LogEntry.query.filter_by(developer_tag=current_user.developer_tag)\
                                     .order_by(desc(LogEntry.timestamp))\
                                     .limit(10)\
                                     .all()
        
        recent_entries_data = []
        for entry in recent_entries:
            entry_dict = entry.to_dict()
            entry_dict['likes_count'] = entry.reactions.filter_by(reaction_type=1).count()  # ReactionType.LIKE = 1
            entry_dict['comments_count'] = entry.comments.count()
            recent_entries_data.append(entry_dict)
        
        # Get recent topic replies to user's topics (last 10)
        user_topics = ForumTopic.query.filter_by(author_id=current_user.developer_tag).all()
        recent_topic_replies = []
        if user_topics:
            topic_ids = [topic.id for topic in user_topics]
            replies = ForumReply.query.filter(
                ForumReply.topic_id.in_(topic_ids),
                ForumReply.author_id != current_user.developer_tag
            ).order_by(desc(ForumReply.created_at)).limit(10).all()
            
            for reply in replies:
                topic = ForumTopic.query.get(reply.topic_id)
                category = ForumCategory.query.get(topic.category_id) if topic else None
                recent_topic_replies.append({
                    'id': reply.id,
                    'content': reply.content[:200] + '...' if len(reply.content) > 200 else reply.content,
                    'author_id': reply.author_id,
                    'created_at': reply.created_at.isoformat(),
                    'topic_id': reply.topic_id,
                    'topic_title': topic.title if topic else 'Unknown Topic',
                    'category': category.name if category else 'general',
                    'language_name': category.language_name if category and category.language_name else None
                })
        
        # Get recent comments on user's entries (last 10)
        recent_entry_comments = []
        if user_entries:
            entry_ids = [entry.id for entry in user_entries]
            comments = Comment.query.filter(
                Comment.entry_id.in_(entry_ids),
                Comment.user_id != current_user.developer_tag
            ).order_by(desc(Comment.timestamp)).limit(10).all()
            
            for comment in comments:
                entry = LogEntry.query.get(comment.entry_id)
                recent_entry_comments.append({
                    'id': comment.id,
                    'content': comment.content[:200] + '...' if len(comment.content) > 200 else comment.content,
                    'user_id': comment.user_id,
                    'timestamp': comment.timestamp.isoformat(),
                    'entry_id': comment.entry_id,
                    'entry_title': entry.title if entry else 'Unknown Entry',
                    'project_name': entry.project_name if entry else 'Unknown Project'
                })
        
        return jsonify({
            'user_stats': user_stats,
            'reaction_stats': reaction_stats,
            'recent_entries': recent_entries_data,
            'recent_topic_replies': recent_topic_replies,
            'recent_entry_comments': recent_entry_comments
        })
        
    except Exception as e:
        current_app.logger.error(f"Dashboard feed error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to load dashboard data'}), 500