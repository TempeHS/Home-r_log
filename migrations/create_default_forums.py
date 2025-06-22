#!/usr/bin/env python3
"""
Migration script to create default language forums
Run this after updating your database schema
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import db, LanguageTag, ForumCategory
from main import app

def create_default_forums():
    """Create default language forums for supported languages"""
    
    # Default supported languages
    default_languages = [
        'python',
        'javascript', 
        'html',
        'css',
        'c',
        'c++',
        'java',
        'typescript',
        'php',
        'go',
        'rust',
        'ruby'
    ]
    
    with app.app_context():
        print("Creating default language forums...")
        
        for lang_name in default_languages:
            # Create or get language tag
            tag = LanguageTag.query.filter_by(name=lang_name).first()
            if not tag:
                tag = LanguageTag(name=lang_name)
                db.session.add(tag)
                db.session.flush()  # Flush to get the ID
                print(f"Created language tag: {lang_name}")
            else:
                print(f"Language tag already exists: {lang_name}")
            
            # Create general forum category
            general_forum = ForumCategory.query.filter_by(
                language_tag_id=tag.id,
                name='general',
                project_name=None
            ).first()
            
            if not general_forum:
                general_forum = ForumCategory(
                    name='general',
                    language_tag_id=tag.id,
                    project_name=None
                )
                db.session.add(general_forum)
                print(f"Created general forum for {lang_name}")
            else:
                print(f"General forum already exists for {lang_name}")
            
            # Create help forum category
            help_forum = ForumCategory.query.filter_by(
                language_tag_id=tag.id,
                name='help',
                project_name=None
            ).first()
            
            if not help_forum:
                help_forum = ForumCategory(
                    name='help',
                    language_tag_id=tag.id,
                    project_name=None
                )
                db.session.add(help_forum)
                print(f"Created help forum for {lang_name}")
            else:
                print(f"Help forum already exists for {lang_name}")
        
        try:
            db.session.commit()
            print("Default forums created successfully!")
        except Exception as e:
            print(f"Error creating forums: {e}")
            db.session.rollback()

if __name__ == '__main__':
    create_default_forums()
