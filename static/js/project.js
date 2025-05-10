export class ProjectView {
    constructor() {
        this.commitTimeline = document.getElementById('commitTimeline');
        this.initializeEntryMapping();
        this.bindEvents();
    }

    initializeEntryMapping() {
        const entries = JSON.parse(document.getElementById('entriesData').textContent);
        this.entryMap = new Map();
        
        entries.forEach(entry => {
            if (entry.commit_sha) {
                if (!this.entryMap.has(entry.commit_sha)) {
                    this.entryMap.set(entry.commit_sha, []);
                }
                this.entryMap.get(entry.commit_sha).push(entry);
            }
        });

        this.updateCommitEntries();
    }

    updateCommitEntries() {
        document.querySelectorAll('.commit-item').forEach(commitItem => {
            const sha = commitItem.dataset.commitSha;
            const relatedEntries = this.entryMap.get(sha) || [];
            
            if (relatedEntries.length > 0) {
                const entriesDiv = commitItem.querySelector('.related-entries');
                const entryLinks = relatedEntries.map(entry => `
                    <a href="/entry/${entry.id}" class="badge bg-primary text-decoration-none me-1">
                        ${entry.title}
                    </a>
                `).join('');
                
                entriesDiv.innerHTML = entryLinks;
            }
        });
    }

    bindEvents() {
        if (this.commitTimeline) {
            this.commitTimeline.addEventListener('click', this.handleCommitClick.bind(this));
        }
    }

    handleCommitClick(e) {
        const commitItem = e.target.closest('.commit-item');
        if (!commitItem) return;

        const sha = commitItem.dataset.commitSha;
        document.querySelectorAll('.entry-preview').forEach(entry => {
            if (entry.dataset.commitSha === sha) {
                entry.scrollIntoView({ behavior: 'smooth' });
                entry.classList.add('highlight');
                setTimeout(() => entry.classList.remove('highlight'), 2000);
            }
        });
    }
}