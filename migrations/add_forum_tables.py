#!/usr/bin/env python3
"""
Database migration to add forum tables
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import db
from main import app

def migrate_database():
    """Add forum tables to database"""
    
    with app.app_context():
        print("Creating forum tables...")
        
        # Create all new tables
        db.create_all()
        
        print("Database migration completed successfully!")

if __name__ == '__main__':
    migrate_database()
