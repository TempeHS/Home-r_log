"""Add forum and tag tables

Revision ID: add_forum_and_tags
Create Date: 2025-06-21
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Create language_tags table
    op.create_table('language_tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Create project_tags association table
    op.create_table('project_tags',
        sa.Column('project_name', sa.String(length=100), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['project_name'], ['project.name'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['language_tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('project_name', 'tag_id')
    )

    # Create forum_categories table
    op.create_table('forum_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('language_tag_id', sa.Integer(), nullable=True),
        sa.Column('project_name', sa.String(length=100), nullable=True),
        sa.ForeignKeyConstraint(['language_tag_id'], ['language_tags.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['project_name'], ['project.name'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('language_tag_id IS NOT NULL OR project_name IS NOT NULL',
                          name='category_owner_check')
    )

    # Create forum_topics table
    op.create_table('forum_topics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('author_id', sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['user.developer_tag'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['forum_categories.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create forum_replies table
    op.create_table('forum_replies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('topic_id', sa.Integer(), nullable=False),
        sa.Column('author_id', sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['user.developer_tag'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['topic_id'], ['forum_topics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('forum_replies')
    op.drop_table('forum_topics')
    op.drop_table('forum_categories')
    op.drop_table('project_tags')
    op.drop_table('language_tags')
