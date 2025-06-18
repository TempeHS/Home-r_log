export class ProjectView {
    constructor() {
        this.commitTimeline = document.getElementById('commitTimeline');
        this.currentPage = 1;
        this.loading = false;
        this.hasMore = true;
        this.projectName = document.querySelector('[data-project-name]')?.dataset.projectName;
        
        if (this.projectName) {
            // Show initial loading if no commits are visible yet
            const existingCommits = this.commitTimeline?.querySelectorAll('.commit-item');
            if (!existingCommits || existingCommits.length === 0) {
                this.showInitialLoading();
            }
            
            this.initializeEntryMapping();
            this.bindInfiniteScroll();
            
            // Hide initial loading after everything is set up
            setTimeout(() => {
                this.hideInitialLoading();
            }, 1000);
        } else {
            console.error("Project name not found in DOM");
        }
    }

    initializeEntryMapping() {
        try {
            // Show loading while processing entries
            this.showEntriesLoading();
            
            const projectDataElement = document.getElementById('projectData');
            if (!projectDataElement) {
                console.error("Project data element not found");
                this.hideEntriesLoading();
                return;
            }

            const rawData = projectDataElement.value;
            const entries = JSON.parse(rawData);
            console.log(`Parsed ${entries.length} entries`);

            // Create mapping of commit SHAs to entries
            this.entryMap = new Map();
            entries.forEach(entry => {
                if (entry.commit_sha) {
                    if (!this.entryMap.has(entry.commit_sha)) {
                        this.entryMap.set(entry.commit_sha, []);
                    }
                    this.entryMap.get(entry.commit_sha).push(entry);
                }
            });

            // Add a small delay to show the loading animation
            setTimeout(() => {
                this.updateCommitEntries();
                this.hideEntriesLoading();
            }, 800);
            
        } catch (error) {
            console.error("Error initializing entry mapping:", error);
            this.hideEntriesLoading();
            // Show error to user
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger';
            errorDiv.textContent = 'Error loading project data. Please refresh the page.';
            document.querySelector('.container-fluid')?.prepend(errorDiv);
        }
    }

    updateCommitEntries() {
        const commitElements = document.querySelectorAll('.commit-item');
        
        commitElements.forEach(commit => {
            const commitSha = commit.dataset.commitSha;
            const entries = this.entryMap.get(commitSha) || [];
            const relatedEntriesDiv = commit.querySelector('.related-entries');

            if (entries.length > 0 && relatedEntriesDiv) {
                relatedEntriesDiv.innerHTML = '';
                
                entries.forEach(entry => {
                    const entryLink = document.createElement('a');
                    entryLink.href = `/entry/${entry.id}`;
                    entryLink.className = 'badge bg-primary me-1 text-decoration-none entry-link';
                    entryLink.textContent = entry.title || 'Untitled Entry';
                    entryLink.dataset.entryId = entry.id;
                    
                    entryLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        const targetEntry = document.querySelector(`.entry-preview[data-entry-id="${entry.id}"]`);
                        if (targetEntry) {
                            targetEntry.scrollIntoView({ behavior: 'smooth' });
                            targetEntry.classList.add('highlight');
                            setTimeout(() => targetEntry.classList.remove('highlight'), 2000);
                        } else {
                            window.LoadingAnimation?.showLoading();
                            window.location.href = entryLink.href;
                        }
                    });
                    
                    relatedEntriesDiv.appendChild(entryLink);
                });
            }
        });
    }

    bindInfiniteScroll() {
        const commitsContainer = document.querySelector('.commits-scroll');
        if (!commitsContainer) return;

        const observer = new IntersectionObserver(entries => {
            const lastEntry = entries[0];
            if (lastEntry.isIntersecting && this.hasMore && !this.loading) {
                this.loadMoreCommits();
            }
        }, { threshold: 0.5 });

        const observerTarget = document.createElement('div');
        observerTarget.className = 'observer-target';
        commitsContainer.appendChild(observerTarget);
        observer.observe(observerTarget);
    }

    async loadMoreCommits() {
        if (this.loading || !this.hasMore || !this.projectName) return;
        
        this.loading = true;
        
        // Show loading placeholder
        this.showLoadingPlaceholder();
        
        try {
            const response = await fetch(`/api/projects/${encodeURIComponent(this.projectName)}/commits?page=${this.currentPage + 1}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            
            if (Array.isArray(data)) {
                this.hasMore = data.length > 0;
                if (this.hasMore) {
                    this.currentPage++;
                    // Add a small delay to show the loading animation
                    setTimeout(() => {
                        this.appendCommits(data);
                        this.hideLoadingPlaceholder();
                    }, 800);
                } else {
                    this.hideLoadingPlaceholder();
                }
            } else if (data.error) {
                throw new Error(data.error);
            }
            
        } catch (error) {
            console.error('Error loading commits:', error);
            this.hideLoadingPlaceholder();
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger';
            errorDiv.textContent = `Error loading commits: ${error.message}`;
            this.commitTimeline?.parentElement?.prepend(errorDiv);
        } finally {
            this.loading = false;
        }
    }

    appendCommits(commits) {
        if (!this.commitTimeline) return;
        
        commits.forEach(commit => {
            const commitElement = document.createElement('div');
            commitElement.className = 'commit-item mb-3';
            commitElement.dataset.commitSha = commit.sha;
            
            commitElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">${new Date(commit.date).toLocaleString()}</small>
                </div>
                <div class="commit-message">${this.escapeHtml(commit.message)}</div>
                <small class="text-muted">by ${this.escapeHtml(commit.author)}</small>
                <div class="related-entries mt-2"></div>
            `;
            
            this.commitTimeline.appendChild(commitElement);
        });
        
        this.updateCommitEntries();
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    showLoadingPlaceholder() {
        const commitsContainer = document.querySelector('.commits-scroll');
        if (!commitsContainer || this.loadingPlaceholder) return;
        
        this.loadingPlaceholder = window.LoadingAnimation.createInlineLoader(null, 'loading commits()...');
        this.loadingPlaceholder.id = 'commits-loading-placeholder';
        
        // Add placeholder before the observer target
        const observerTarget = commitsContainer.querySelector('.observer-target');
        if (observerTarget) {
            commitsContainer.insertBefore(this.loadingPlaceholder, observerTarget);
        } else {
            commitsContainer.appendChild(this.loadingPlaceholder);
        }
    }

    hideLoadingPlaceholder() {
        if (this.loadingPlaceholder) {
            window.LoadingAnimation.removeInlineLoader(this.loadingPlaceholder);
            this.loadingPlaceholder = null;
        }
    }

    showInitialLoading() {
        const commitsContainer = document.querySelector('.commits-scroll');
        if (!commitsContainer) return;
        
        // Clear existing content
        commitsContainer.innerHTML = '';
        
        this.initialLoader = window.LoadingAnimation.createInlineLoader(commitsContainer, 'loading project()...');
    }

    hideInitialLoading() {
        if (this.initialLoader) {
            window.LoadingAnimation.removeInlineLoader(this.initialLoader);
            this.initialLoader = null;
        }
    }

    showEntriesLoading() {
        const entriesContainer = document.querySelector('.entries-scroll');
        if (!entriesContainer) return;
        
        this.entriesLoader = window.LoadingAnimation.createInlineLoader(null, 'processing entries()...');
        entriesContainer.appendChild(this.entriesLoader);
    }

    hideEntriesLoading() {
        if (this.entriesLoader) {
            window.LoadingAnimation.removeInlineLoader(this.entriesLoader);
            this.entriesLoader = null;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ProjectView();
});