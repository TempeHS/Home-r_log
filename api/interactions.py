from flask import Blueprint, jsonify, request, current_app
from flask_login import current_user, login_required
from models import db, LogEntry, EntryReaction, Comment, ReactionType

interactions_bp = Blueprint('interactions', __name__)

@interactions_bp.route('/entries/<int:entry_id>/react', methods=['POST'])
@login_required
def toggle_reaction(entry_id):
    try:
        reaction_type = request.json.get('reaction_type')
        
        if reaction_type not in ['like', 'dislike']:
            return jsonify({'error': 'Invalid reaction type'}), 400
            
        entry = LogEntry.query.get_or_404(entry_id)
        entry.toggle_reaction(current_user.developer_tag, reaction_type)
        db.session.commit()
        
        return jsonify({
            'likes_count': entry.reactions.filter_by(reaction_type=ReactionType.LIKE).count(),
            'dislikes_count': entry.reactions.filter_by(reaction_type=ReactionType.DISLIKE).count(),
            'user_reaction': entry.get_user_reaction(current_user.developer_tag)
        })
        
    except Exception as e:
        current_app.logger.error(f"Error toggling reaction: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update reaction'}), 500

@interactions_bp.route('/entries/<int:entry_id>/comments', methods=['GET'])
@login_required
def get_comments(entry_id):
    try:
        entry = LogEntry.query.get_or_404(entry_id)
        # Get only top-level comments (no parent_id)
        comments = Comment.query.filter_by(entry_id=entry_id, parent_id=None).all()
        return jsonify([comment.to_dict() for comment in comments])
        
    except Exception as e:
        current_app.logger.error(f"Error fetching comments: {str(e)}")
        return jsonify({'error': 'Failed to fetch comments'}), 500

@interactions_bp.route('/entries/<int:entry_id>/comments', methods=['POST'])
@login_required
def add_comment(entry_id):
    try:
        current_app.logger.info(f'Adding comment to entry {entry_id}')
        content = request.json.get('content')
        parent_id = request.json.get('parent_id')
        
        current_app.logger.debug(f'Comment data: content="{content}", parent_id={parent_id}')
        
        if not content or not content.strip():
            current_app.logger.warning('Empty comment content received')
            return jsonify({'error': 'Comment content cannot be empty'}), 400
            
        entry = LogEntry.query.get_or_404(entry_id)
        
        # Validate parent comment if it exists
        if parent_id:
            parent_comment = Comment.query.get_or_404(parent_id)
            if parent_comment.entry_id != entry_id:
                return jsonify({'error': 'Invalid parent comment'}), 400
        
        new_comment = Comment(
            entry_id=entry_id,
            user_id=current_user.developer_tag,
            content=content.strip(),
            parent_id=parent_id
        )
        
        db.session.add(new_comment)
        db.session.commit()
        
        return jsonify(new_comment.to_dict()), 201
        
    except Exception as e:
        current_app.logger.error(f"Error adding comment: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to add comment'}), 500
