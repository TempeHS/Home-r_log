export class ProjectView {
    constructor() {
        console.log('ProjectView constructor starting...');
        this.projectData = document.getElementById('projectData');
        console.log('ProjectData element:', this.projectData);
        console.log('ProjectData value raw:', this.projectData?.value);
        
        if (this.projectData && this.projectData.value) {
            try {
                this.entries = JSON.parse(this.projectData.value);
                console.log('Successfully parsed entries:', this.entries);
                console.log('Number of entries:', this.entries.length);
                this.entries.forEach((entry, index) => {
                    console.log(`Entry ${index + 1}:`, {
                        id: entry.id,
                        title: entry.title,
                        commit_sha: entry.commit_sha
                    });
                });
            } catch (e) {
                console.error('Error parsing project data:', e);
                console.error('Raw value that failed to parse:', this.projectData.value);
                this.entries = [];
            }
        } else {
            console.log('No projectData element or empty value');
            this.entries = [];
        }

        this.initializeEntryMapping();
        this.setupCommitTimeline();
        this.setupForumHandlers();
    }

    initializeEntryMapping() {
        this.entryMap = new Map();
        document.querySelectorAll('.entry-preview').forEach(entry => {
            const id = entry.dataset.entryId;
            const commitSha = entry.dataset.commitSha;
            if (id && commitSha) {
                this.entryMap.set(commitSha, entry);
            }
        });
    }

    setupCommitTimeline() {
        const timeline = document.getElementById('commitTimeline');
        if (!timeline) {
            console.log('No commit timeline found');
            return;
        }

        console.log('Setting up commit timeline click handlers');

        // Handle entry link clicks to switch to entries tab and scroll
        timeline.addEventListener('click', (e) => {
            if (e.target.classList.contains('entry-link')) {
                e.preventDefault();
                const entryId = e.target.dataset.entryId;
                console.log(`Entry link clicked for entry ${entryId}`);
                this.switchToEntriesAndScroll(entryId);
            }
            // Handle commit item clicks to switch to entries tab and highlight related entries
            else if (e.target.closest('.commit-item')) {
                const commitItem = e.target.closest('.commit-item');
                const sha = commitItem.dataset.commitSha;
                const entryLinks = commitItem.querySelectorAll('.entry-link');
                if (entryLinks.length > 0) {
                    console.log(`Commit clicked with ${entryLinks.length} related entries`);
                    const entryIds = Array.from(entryLinks).map(link => link.dataset.entryId);
                    this.switchToEntriesAndHighlightMultiple(entryIds);
                }
            }
        });
    }

    switchToEntriesAndHighlightMultiple(entryIds) {
        // Switch to entries tab
        const entriesTabTrigger = document.getElementById('entries-tab');
        if (entriesTabTrigger) {
            const entriesTab = bootstrap.Tab.getOrCreateInstance(entriesTabTrigger);
            entriesTab.show();
            
            // Wait for tab to be shown, then highlight entries
            setTimeout(() => {
                entryIds.forEach(entryId => {
                    this.highlightEntry(entryId);
                });
            }, 100);
        }
    }

    switchToEntriesAndScroll(entryId) {
        // Switch to entries tab
        const entriesTabTrigger = document.getElementById('entries-tab');
        if (entriesTabTrigger) {
            const entriesTab = bootstrap.Tab.getOrCreateInstance(entriesTabTrigger);
            entriesTab.show();
            
            // Wait for tab to be shown, then scroll to entry
            setTimeout(() => {
                this.scrollToEntry(entryId);
            }, 100);
        }
    }

    scrollToEntry(entryId) {
        const entryElement = document.getElementById(`entry-${entryId}`);
        if (entryElement) {
            entryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            this.highlightEntry(entryId);
        }
    }

    highlightEntry(entryId) {
        const entryElement = document.getElementById(`entry-${entryId}`);
        if (entryElement) {
            entryElement.classList.add('highlight');
            setTimeout(() => entryElement.classList.remove('highlight'), 2000);
        }
    }

    setupForumHandlers() {
        // Load forum content when forum tab is clicked
        const forumTab = document.getElementById('forum-tab');
        const forumContent = document.getElementById('forum-content');
        if (!forumTab || !forumContent) return;

        forumTab.addEventListener('click', () => {
            const projectName = document.querySelector('.container-fluid').dataset.projectName;
            if (!projectName) return;
            
            // Default to general forum
            const url = `/forums/projects/${projectName}/general`;
            fetch(url)
                .then(response => response.text())
                .then(html => {
                    forumContent.innerHTML = html;
                })
                .catch(error => {
                    console.error('Error loading forum:', error);
                    forumContent.innerHTML = '<div class="alert alert-danger">Error loading forum content</div>';
                });
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ProjectView();
});