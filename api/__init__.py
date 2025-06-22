from flask import Blueprint

api = Blueprint('api', __name__, url_prefix='/api')

# Import and register blueprints
from . import auth, entries, search
from .interactions import interactions_bp
from .user_manager import user_activity_bp

# Register the interactions blueprint without additional prefix since api already has /api
api.register_blueprint(interactions_bp, url_prefix='/')
api.register_blueprint(user_activity_bp, url_prefix='/user')

#basic blueprint for all api routes

#api endpoint
from functools import wraps
from flask import request, jsonify
from models import User

def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return jsonify({'error': 'No API key provided'}), 401
        
        user = User.query.filter_by(api_key=api_key, api_enabled=True).first()
        if not user:
            return jsonify({'error': 'Invalid API key'}), 401
            
        return f(*args, **kwargs)
    return decorated
