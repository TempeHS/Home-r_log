from github import Github
from datetime import datetime
import re
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class GoGitter:
    def __init__(self):
        token = os.getenv('GITHUB_ACCESS_TOKEN')
        if not token:
            logger.error("GitHub access token not found in environment variables")
            raise ValueError("GitHub access token not configured")
        self.github = Github(token)

    def parse_repo_url(self, url):
        """Extract owner and repo name from GitHub URL"""
        pattern = r'github\.com/([^/]+)/([^/]+)'
        match = re.search(pattern, url)
        if not match:
            logger.error(f"Invalid GitHub URL format: {url}")
            raise ValueError("Invalid GitHub repository URL")
        return match.groups()

    def get_commit_history(self, repo_url, limit=10):
        """Get recent commits for a repository"""
        try:
            owner, repo_name = self.parse_repo_url(repo_url)
            repo = self.github.get_repo(f"{owner}/{repo_name}")
            
            commits = []
            for commit in repo.get_commits()[:limit]:
                commits.append({
                    'sha': commit.sha[:7],
                    'message': commit.commit.message.split('\n')[0],
                    'author': commit.commit.author.name,
                    'date': commit.commit.author.date,
                    'url': commit.html_url,
                    'avatar_url': commit.author.avatar_url if commit.author else None
                })
            logger.info(f"Successfully fetched {len(commits)} commits for {repo_url}")
            return commits
            
        except Exception as e:
            logger.error(f"Error fetching commits: {str(e)}")
            return []

    def get_repo_info(self, repo_url):
        """Get repository information"""
        try:
            owner, repo_name = self.parse_repo_url(repo_url)
            repo = self.github.get_repo(f"{owner}/{repo_name}")
            
            return {
                'name': repo.name,
                'description': repo.description,
                'stars': repo.stargazers_count,
                'forks': repo.forks_count,
                'open_issues': repo.open_issues_count,
                'last_update': repo.updated_at
            }
        except Exception as e:
            logger.error(f"Error fetching repo info: {str(e)}")
            return None