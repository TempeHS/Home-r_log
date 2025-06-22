export class ForumManager {
    constructor(container) {
        this.container = container;
        this.topicsList = container.querySelector('.forum-topics');
        this.searchInput = document.getElementById('topicSearch');
        this.newTopicForm = document.getElementById('newTopicForm');
        this.submitTopicBtn = document.getElementById('submitTopic');
        
        this.bindEvents();
    }

    bindEvents() {
        // Search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.filterTopics(e.target.value);
            });
        }

        // Reply to topic
        this.container.addEventListener('click', (e) => {
            const replyBtn = e.target.closest('.reply-button');
            if (replyBtn) {
                const topicId = replyBtn.dataset.topicId;
                this.showReplyForm(topicId);
            }
        });
    }

    filterTopics(searchTerm) {
        const topics = this.container.querySelectorAll('.forum-topic-card');
        searchTerm = searchTerm.toLowerCase();

        topics.forEach(topic => {
            const title = topic.querySelector('.forum-topic-title').textContent.toLowerCase();
            const isVisible = title.includes(searchTerm);
            topic.style.display = isVisible ? 'block' : 'none';
        });
    }

    async createNewTopic() {
        const titleInput = document.getElementById('topicTitle');
        const contentInput = document.getElementById('topicContent');
        const categoryId = this.container.dataset.categoryId;

        if (!titleInput.value || !contentInput.value) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const response = await fetch('/forums/topics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({
                    title: titleInput.value,
                    content: contentInput.value,
                    category_id: categoryId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create topic');
            }

            const topic = await response.json();
            this.addTopicToList(topic);

            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('newTopicModal'));
            modal.hide();
            this.newTopicForm.reset();

        } catch (error) {
            console.error('Error creating topic:', error);
            alert('Error creating topic. Please try again.');
        }
    }

    addTopicToList(topic) {
        const topicElement = document.createElement('div');
        topicElement.className = 'forum-topic-card';
        topicElement.innerHTML = `
            <h3 class="forum-topic-title">${this.escapeHtml(topic.title)}</h3>
            <div class="forum-topic-metadata">
                <span>Posted by ${this.escapeHtml(topic.author)}</span>
                <span class="mx-2">•</span>
                <span>${new Date(topic.created_at).toLocaleString()}</span>
                <span class="mx-2">•</span>
                <span>0 replies</span>
            </div>
        `;

        this.topicsList.insertBefore(topicElement, this.topicsList.firstChild);
    }

    async showReplyForm(topicId) {
        // Implementation for showing and handling reply form
    }



    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}
