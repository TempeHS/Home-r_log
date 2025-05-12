export class ProjectView {
    constructor() {
        this.commitTimeline = document.getElementById('commitTimeline');
        console.log("ProjectView initialized");
        this.initializeEntryMapping();
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
                
                // add entries
                entries.forEach(entry => {
                    const entryLink = document.createElement('a');
                    entryLink.href = `/entries/${entry.id}`;
                    entryLink.className = 'badge bg-primary me-1 text-decoration-none entry-link';
                    entryLink.textContent = entry.title;
                    relatedEntriesDiv.appendChild(entryLink);
                });
            }
        });
    }
}

// initialize asap
document.addEventListener('DOMContentLoaded', () => {
    new ProjectView();
});