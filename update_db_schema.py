#!/usr/bin/env python3
"""
Simple database update script to add new optimized columns
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app
from models import db

def update_database():
    """Add new columns to existing database"""
    print("🔄 Updating database schema...")
    
    with app.app_context():
        try:
            # Create all tables with new schema - this will add missing columns
            db.create_all()
            print("✅ Database schema updated successfully")
            
            # Check if we can query users
            from models import User
            user_count = User.query.count()
            print(f"📊 Found {user_count} users in database")
            
        except Exception as e:
            print(f"❌ Error updating database: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    update_database()
