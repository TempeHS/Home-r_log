export class LogEntry {
    constructor() {
        this.setupUI();
        this.bindEvents();
    }

    setupUI() {
        const logEntriesDiv = document.getElementById('logEntries');
        if (!logEntriesDiv) return;
        logEntriesDiv.innerHTML = `
            <div class="row">
                <div class="col-12 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">New Log Entry</h5>
                            <form id="newEntryForm">
                                <div class="mb-3">
                                    <label for="project" class="form-label">Project</label>
                                    <input type="text" class="form-control" id="project" required pattern="^[a-zA-Z0-9-_]+$">
                                </div>
                                <div class="mb-3">
                                    <label for="title" class="form-label">Title</label>
                                    <input type="text" class="form-control" id="title" required maxlength="200" placeholder="Entry title">
                                </div>
                                <div class="mb-3">
                                    <label for="content" class="form-label">Log Content</label>
                                    <textarea class="form-control" id="content" rows="3" required maxlength="1000"></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary">Submit Entry</button>
                            </form>
                        </div>
                    </div>
                </div>
                
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Search Entries</h5>
                            <div class="row g-3">
                                <div class="col-md-3">
                                    <input type="date" class="form-control" id="searchDate">
                                </div>
                                <div class="col-md-3">
                                    <input type="text" class="form-control" id="searchProject" placeholder="Project">
                                </div>
                                <div class="col-md-4">
                                    <input type="text" class="form-control" id="searchContent" placeholder="Search content">
                                </div>
                                <div class="col-md-2">
                                    <button class="btn btn-secondary w-100" id="searchButton">Search</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 mt-4">
                    <div id="entriesList"></div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Remove duplicate event listeners and keep only one form submit handler
        const entryForm = document.getElementById('entryForm');
        if (entryForm) {
            entryForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createEntry();
            });
        }

        // Time validation
        const startTime = document.getElementById('start_time');
        const endTime = document.getElementById('end_time');
        if (startTime && endTime) {
            startTime.addEventListener('change', () => this.validateTimes());
            endTime.addEventListener('change', () => this.validateTimes());
        }

        // Search functionality
        const searchButton = document.getElementById('searchButton');
        if (searchButton) {
            searchButton.addEventListener('click', () => this.searchEntries());
        }
    }

    validateTimes() {
        const startTime = new Date(document.getElementById('start_time').value);
        const endTime = new Date(document.getElementById('end_time').value);
        
        if (endTime <= startTime) {
            document.getElementById('end_time').setCustomValidity('End time must be after start time');
        } else {
            document.getElementById('end_time').setCustomValidity('');
        }
    }

    async createEntry() {
        const formData = {
            project_name: document.getElementById('project_name').value,    // added new id
            title: document.getElementById('title').value || 'Untitled Entry', // default title if empty?
            content: document.getElementById('content').value,
            repository_url: document.getElementById('repository_url')?.value || '',
            start_time: document.getElementById('start_time').value,
            end_time: document.getElementById('end_time').value
        };

        console.log('Submitting entry:', formData); // Debug log

        try {
            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create entry');
            }

            window.location.href = `/projects/${formData.project_name}`;
        } catch (error) {
            console.error('Error creating entry:', error);
            alert(error.message);
        }
    }

    async searchEntries() {
        const date = document.getElementById('searchDate').value;
        const project = document.getElementById('searchProject').value;
        const content = document.getElementById('searchContent').value;

        const params = new URLSearchParams();
        if (date) params.append('date', date);
        if (project) params.append('project', project);
        if (content) params.append('content', content);

        try {
            const response = await fetch(`/api/entries/search?${params}`);
            if (response.ok) {
                this.displayEntries(await response.json());
            }
        } catch (error) {
            console.error('Error searching entries:', error);
        }
    }

    displayEntries(entries) {
        const entriesList = document.getElementById('entriesList');
        entriesList.innerHTML = entries.map(entry => `
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">${entry.title}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">
                        Project: ${entry.project_name} | Date: ${new Date(entry.timestamp).toLocaleString()}
                    </h6>
                    <p class="card-text">${entry.content}</p>
                </div>
            </div>
        `).join('');
    }
}
