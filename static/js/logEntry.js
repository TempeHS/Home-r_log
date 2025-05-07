export class LogEntry {
    constructor() {
        this.setupUI();
        this.bindEvents();
    }

    setupUI() {
        this.form = document.getElementById('entryForm');
        if (!this.form) return;
    }

    bindEvents() {
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = {
                project_name: document.getElementById('project_name').value,
                title: document.getElementById('title').value,
                content: document.getElementById('content').value,
                start_time: document.getElementById('start_time').value,
                end_time: document.getElementById('end_time').value
            };

            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create entry');
            }

            const data = await response.json();
            window.location.href = `/projects/${formData.project_name}`;
        } catch (error) {
            console.error('Error creating entry:', error);
            alert(error.message);
        }
    }
}
