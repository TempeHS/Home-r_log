export class LogEntry {
    constructor() {
        this.setupUI();
        this.bindEvents();
        this.initializeTimestamps();
        if (this.projectSelect.value) {
            this.loadCommits();
        }
    }

    setupUI() {
        this.form = document.getElementById('entryForm');
        this.projectSelect = document.getElementById('project_name');
        this.commitSelect = document.getElementById('commitSelect');
        this.startTime = document.getElementById('start_time');
        this.endTime = document.getElementById('end_time');
    }

    initializeTimestamps() {
        const now = new Date();
        const formattedNow = now.toISOString().slice(0, 16);
        this.startTime.value = formattedNow;
        this.endTime.value = formattedNow;
    }

    bindEvents() {
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
            this.projectSelect.addEventListener('change', () => this.loadCommits());
        }
    }

    formatDate(isoDate) {
        const date = new Date(isoDate);
        return date.toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async loadCommits() {
        try {
            const projectName = this.projectSelect.value;
            if (!projectName) return;

            console.log("Fetching commits for project:", projectName);
            
            const response = await fetch(`/api/projects/${encodeURIComponent(projectName)}/commits`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const commits = await response.json();
            console.log("Received commits:", commits);
            
            // clear options
            this.commitSelect.innerHTML = '<option value="">Select a commit (optional)</option>';
            
            // update commit
            commits.forEach(commit => {
                const option = document.createElement('option');
                option.value = commit.sha;
                option.textContent = `${commit.message.split('\n')[0]} (${commit.author})`;
                this.commitSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading commits:', error);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        console.log('Form submission started');

        try {
            const formData = new FormData(this.form);
            const entry = {
                title: formData.get('title'),
                content: formData.get('content'),
                project_name: formData.get('project_name'),
                start_time: formData.get('start_time'),
                end_time: formData.get('end_time'),
                time_worked: this.calculateTimeWorked(),
                commit_sha: this.commitSelect.value || null // Just get the SHA directly
            };

            console.log('Sending entry data:', entry);

            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify(entry)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create entry');
            }

            // Redirect to project page on success
            window.location.href = `/projects/${entry.project_name}`;
        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
        }
    }

    calculateTimeWorked() {
        const start = new Date(this.startTime.value);
        const end = new Date(this.endTime.value);
        return Math.round((end - start) / (1000 * 60)); // Convert to minutes
    }
}
