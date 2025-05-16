from github import Github
from datetime import datetime
import re
import os
from dotenv import load_dotenv
import logging
from urllib.parse import urlparse
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class GoGitter:
    def __init__(self):
        self.token = os.getenv('GITHUB_ACCESS_TOKEN')
        if not self.token:
            raise ValueError("GitHub access token not found in environment variables")
            
        # Create session with proper retry and verification
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("https://", adapter)
        self.session.verify = True  # Ensure SSL verification is enabled
        
        self.github = Github(self.token)  # PyGithub handles its own session management

    def __del__(self):
        if hasattr(self, 'session'):
            self.session.close()  # Ensure session is properly closed

    def parse_repo_url(self, url):
        # parse the GitHub repository URL 
        parsed = urlparse(url)
        path_parts = parsed.path.strip('/').split('/')
        if len(path_parts) < 2:
            raise ValueError(f"Invalid GitHub repository URL: {url}")
        return path_parts[0], path_parts[1]

    def get_commit_history(self, repo_url, page=1, per_page=10):
        """Get commit history for a given repository with pagination"""
        try:
            owner, repo_name = self.parse_repo_url(repo_url)
            logger.info(f"Fetching commits for {owner}/{repo_name} - page {page}")
            
            repo = self.github.get_repo(f"{owner}/{repo_name}")
            # Calculate pagination offsets
            start = (page - 1) * per_page
            end = start + per_page
            commits = list(repo.get_commits().get_page(page-1))

            commits_paginated = repo.get_commits()
            
            # Get total count for pagination
            total_commits = commits_paginated.totalCount
            
            # Calculate if there are more pages
            has_more = (page * per_page) < total_commits
        
            # Get specific page of commits
            commits = list(commits_paginated.get_page(page-1))

            logger.info(f"Retrieved {len(commits)} commits")
            return commits, has_more
            
        except Exception as e:
            logger.error(f"Error fetching commits: {str(e)}")
            raise

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
        finally:
            # Ensure connection pool is cleared if there were any verify=False requests
            self.session.close()