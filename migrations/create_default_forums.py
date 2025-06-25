#!/usr/bin/env python3
"""
Migration script to create default language forums
Run this after updating your database schema
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import db, LanguageTag, ForumCategory

def create_default_forums():
    """create default language forums for supported languages"""
    
    # default supported languages
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
    
    print("Creating default language forums...")
    
    for lang_name in default_languages:
        # create or get language tag
        tag = LanguageTag.query.filter_by(name=lang_name).first()
        if not tag:
            tag = LanguageTag(name=lang_name)
            db.session.add(tag)
            db.session.flush()  # flush to get the ID
            print(f"Created language tag: {lang_name}")
        else:
            print(f"Language tag already exists: {lang_name}")
        
        # create general forum category
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
        
        # create help forum category
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
        return True
    except Exception as e:
        print(f"Error creating forums: {e}")
        db.session.rollback()
        return False

if __name__ == '__main__':
    # when run directly, create app context
    from main import app
    with app.app_context():
        create_default_forums()
