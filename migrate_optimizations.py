#!/usr/bin/env python3
"""
Migration script for database optimizations:
1. Convert reaction_type from string to integer
2. Hash existing email addresses 
3. Hash existing API keys
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import db, User, EntryReaction, ReactionType
from main import app
import hashlib

def migrate_reaction_types():
    """Convert string reaction types to integers"""
    print("🔄 Migrating reaction types...")
    
    try:
        # Get all reactions that still use string types
        reactions = EntryReaction.query.all()
        migrated_count = 0
        
        for reaction in reactions:
            # If reaction_type is already an integer, skip
            if isinstance(reaction.reaction_type, int):
                continue
                
            # Convert string to integer
            if hasattr(reaction, 'reaction_type'):
                if reaction.reaction_type == 'like':
                    reaction.reaction_type = ReactionType.LIKE
                    migrated_count += 1
                elif reaction.reaction_type == 'dislike':
                    reaction.reaction_type = ReactionType.DISLIKE
                    migrated_count += 1
                else:
                    # Invalid reaction type, set to NONE
                    reaction.reaction_type = ReactionType.NONE
                    migrated_count += 1
        
        db.session.commit()
        print(f"✅ Migrated {migrated_count} reaction types")
        
    except Exception as e:
        print(f"❌ Error migrating reaction types: {str(e)}")
        db.session.rollback()

def migrate_user_emails():
    """Hash existing email addresses"""
    print("🔄 Migrating user emails to hashed format...")
    
    try:
        users = User.query.all()
        migrated_count = 0
        
        for user in users:
            # Check if user still has old email field
            if hasattr(user, 'email') and user.email:
                # Create hash for existing email
                user.email_hash = hashlib.sha256(user.email.lower().strip().encode()).hexdigest()
                user._temp_email = user.email.lower().strip()
                migrated_count += 1
            elif hasattr(user, '_temp_email') and user._temp_email and not user.email_hash:
                # Create hash from temp email
                user.email_hash = hashlib.sha256(user._temp_email.encode()).hexdigest()
                migrated_count += 1
        
        db.session.commit()
        print(f"✅ Migrated {migrated_count} user emails")
        
    except Exception as e:
        print(f"❌ Error migrating user emails: {str(e)}")
        db.session.rollback()

def migrate_api_keys():
    """Hash existing API keys"""
    print("🔄 Migrating API keys to hashed format...")
    
    try:
        users = User.query.filter(User.api_key.isnot(None)).all()
        migrated_count = 0
        
        for user in users:
            if hasattr(user, 'api_key') and user.api_key and not user.api_key_hash:
                # Hash the existing API key
                user.api_key_hash = hashlib.sha256(user.api_key.encode()).hexdigest()
                # For security, we'll clear the original API key after migration
                # Note: This means users will need to regenerate their API keys
                user.api_key = None  # Clear the original key for security
                migrated_count += 1
        
        db.session.commit()
        print(f"✅ Migrated {migrated_count} API keys")
        print("⚠️  WARNING: Original API keys have been cleared for security.")
        print("   Users will need to regenerate their API keys.")
        
    except Exception as e:
        print(f"❌ Error migrating API keys: {str(e)}")
        db.session.rollback()

def verify_migration():
    """Verify that the migration was successful"""
    print("🔍 Verifying migration...")
    
    # Check reaction types
    string_reactions = EntryReaction.query.filter(
        EntryReaction.reaction_type.in_(['like', 'dislike'])
    ).count()
    
    if string_reactions > 0:
        print(f"⚠️  {string_reactions} reactions still have string types")
    else:
        print("✅ All reactions use integer types")
    
    # Check user emails
    users_without_hash = User.query.filter(User.email_hash.is_(None)).count()
    if users_without_hash > 0:
        print(f"⚠️  {users_without_hash} users missing email hash")
    else:
        print("✅ All users have hashed emails")
    
    # Check API keys
    users_with_plain_keys = User.query.filter(
        User.api_key.isnot(None), 
        User.api_key_hash.is_(None)
    ).count()
    
    if users_with_plain_keys > 0:
        print(f"⚠️  {users_with_plain_keys} users have unhashed API keys")
    else:
        print("✅ All API keys are properly handled")

def main():
    print("🚀 Starting database optimization migration...")
    print("=" * 50)
    
    with app.app_context():
        # Create tables with new schema
        db.create_all()
        
        # Run migrations
        migrate_reaction_types()
        migrate_user_emails()
        migrate_api_keys()
        
        # Verify migration
        verify_migration()
    
    print("=" * 50)
    print("✅ Migration completed!")
    print("\n📋 Post-Migration Steps:")
    print("1. Test user authentication with hashed emails")
    print("2. Verify reaction functionality with integer types")
    print("3. Users may need to regenerate API keys")
    print("4. Remove _temp_email field after full migration validation")

if __name__ == "__main__":
    main()
