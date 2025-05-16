export class ProjectView {
    constructor() {
        this.commitTimeline = document.getElementById('commitTimeline');
        this.currentPage = 1;
        this.loading = false;
        this.hasMore = true;
        this.projectName = document.querySelector('[data-project-name]')?.dataset.projectName;
        
        this.initializeEntryMapping();
        this.bindInfiniteScroll();
    }

    initializeEntryMapping() {
        try {
            const projectDataElement = document.getElementById('projectData');
            if (!projectDataElement) {
                console.error("Project data element not found");
                return;
            }

            const rawData = projectDataElement.value;
            console.log("Raw project data:", rawData);

            const entries = JSON.parse(rawData);
            console.log("Parsed entries:", entries);

            // create mapping of commit SHAs to entries
            this.entryMap = entries.reduce((map, entry) => {
                if (entry.commit_sha) {
                    if (!map.has(entry.commit_sha)) {
                        map.set(entry.commit_sha, []);
                    }
                    map.get(entry.commit_sha).push(entry);
                }
                return map;
            }, new Map());

            console.log("Entry mapping created");
            this.updateCommitEntries();
        } catch (error) {
            console.error("Error initializing entry mapping:", error);
            console.log("Project data element value:", document.getElementById('projectData')?.value);
        }
    }

    updateCommitEntries() {
        const commitElements = document.querySelectorAll('.commit-item');
        console.log(`Found ${commitElements.length} commit elements`);

        commitElements.forEach(commit => {
            const commitSha = commit.dataset.commitSha;
            const entries = this.entryMap.get(commitSha) || [];
            const relatedEntriesDiv = commit.querySelector('.related-entries');

            console.log(`Processing commit ${commitSha}: ${entries.length} related entries`);

            if (entries.length > 0 && relatedEntriesDiv) {
                // clear existing entries
                relatedEntriesDiv.innerHTML = '';
                
                // add entries with correct URL pattern
                entries.forEach(entry => {
                    const entryLink = document.createElement('a');
                    entryLink.href = `/entry/${entry.id}`; // Updated to match Flask route
                    entryLink.className = 'badge bg-primary me-1 text-decoration-none entry-link';
                    entryLink.textContent = entry.title;
                    entryLink.dataset.entryId = entry.id;
                    relatedEntriesDiv.appendChild(entryLink);

                    // Add click handler for smooth scrolling
                    entryLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        const targetEntry = document.querySelector(`.entry-preview[data-entry-id="${entry.id}"]`);
                        if (targetEntry) {
                            targetEntry.scrollIntoView({ behavior: 'smooth' });
                            targetEntry.classList.add('highlight');
                            setTimeout(() => targetEntry.classList.remove('highlight'), 2000);
                        } else {
                            window.location.href = entryLink.href; // Fallback to regular navigation
                        }
                    });
                });
            }
        });
    }

    bindInfiniteScroll() {
        const commitsContainer = document.querySelector('.commits-scroll');
        if (!commitsContainer) return;

        // Use Intersection Observer for infinite scroll
        const observer = new IntersectionObserver(entries => {
            const lastEntry = entries[0];
            if (lastEntry.isIntersecting && this.hasMore && !this.loading) {
                this.loadMoreCommits();
            }
        }, { threshold: 0.5 });

        // Observe the last commit item
        const observerTarget = document.createElement('div');
        observerTarget.className = 'observer-target';
        commitsContainer.appendChild(observerTarget);
        observer.observe(observerTarget);
    }

    async loadMoreCommits() {
        if (this.loading || !this.hasMore) return;
        
        this.loading = true;
        try {
            const response = await fetch(`/api/projects/${this.projectName}/commits?page=${this.currentPage + 1}`);
            const data = await response.json();
            
            if (data.error) throw new Error(data.error);
            
            this.hasMore = data.has_more;
            this.currentPage++;
            
            // Append new commits
            this.appendCommits(data.commits);
            
        } catch (error) {
            console.error('Error loading more commits:', error);
        } finally {
            this.loading = false;
        }
    }

    appendCommits(commits) {
        commits.forEach(commit => {
            const commitElement = document.createElement('div');
            commitElement.className = 'commit-item mb-3';
            commitElement.dataset.commitSha = commit.sha;
            
            commitElement.innerHTML = `
                <div class="commit-message">${commit.message}</div>
                <small class="text-muted">by ${commit.author}</small>
                <div class="related-entries mt-2"></div>
            `;
            
            this.commitTimeline.appendChild(commitElement);
        });
        
        // Update entry mappings for new commits
        this.updateCommitEntries();
    }
}

// initialize asap
document.addEventListener('DOMContentLoaded', () => {
    new ProjectView();
});