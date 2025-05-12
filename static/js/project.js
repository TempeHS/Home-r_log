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
}

// initialize asap
document.addEventListener('DOMContentLoaded', () => {
    new ProjectView();
});