// Import utilities
const showNotification = window.showNotification || function(message, type) {
    console.error('showNotification not available:', message);
};

// Utility function for escaping HTML
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        unsafe = String(unsafe);
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export class EntryViewer {
    constructor() {
        console.log('Initializing EntryViewer');
        this.entry = null;
        this.loadEntry().then(() => {
            this.initializeManagers();
        });
    }

    async loadEntry() {
        console.log('Loading entry data');
        try {
            const entryDataElement = document.getElementById('entryData');
            if (!entryDataElement) {
                throw new Error('EntryData element not found');
            }

            const rawValue = entryDataElement.value;
            console.log('Raw entry data:', rawValue);

            if (!rawValue || rawValue.trim() === '') {
                throw new Error('Entry data is empty');
            }

            try {
                const entryData = JSON.parse(rawValue);
                console.log('Successfully parsed entry data:', entryData);
                this.entry = entryData;
                this.displayEntry(entryData);
                return entryData;
            } catch (jsonError) {
                console.error('JSON parse error. Raw value:', rawValue);
                throw jsonError;
            }
        } catch (error) {
            console.error('Error loading entry:', error);
            document.querySelector('.card-body').innerHTML = `
                <div class="alert alert-danger" role="alert">
                    Failed to load entry data. Please try refreshing the page.<br>
                    Error: ${error.message}
                </div>`;
            throw error;
        }
    }

    displayEntry(entry) {
        document.getElementById('entryTitle').textContent = entry.title;
        document.getElementById('entryProject').textContent = `Project: ${entry.project_name}`;
        document.getElementById('entryDeveloper').textContent = `Developer: ${entry.developer_tag}`;
        document.getElementById('entryTimestamp').textContent = new Date(entry.timestamp).toLocaleString();
        document.getElementById('entryContent').textContent = entry.content;
        document.getElementById('entryTimeWorked').textContent = `Time worked: ${entry.time_worked} minutes`;
        document.getElementById('entryStartTime').textContent = `Started: ${new Date(entry.start_time).toLocaleString()}`;
        document.getElementById('entryEndTime').textContent = `Ended: ${new Date(entry.end_time).toLocaleString()}`;
        
        // Get the reactions container for this entry
        const reactionsContainer = document.querySelector('.reactions');
        if (reactionsContainer) {
            // Update reaction counts
            const likesCount = reactionsContainer.querySelector('.likes-count');
            const dislikesCount = reactionsContainer.querySelector('.dislikes-count');
            if (likesCount) likesCount.textContent = entry.likes_count || 0;
            if (dislikesCount) dislikesCount.textContent = entry.dislikes_count || 0;
            
            // Set active state for user's reaction if any
            if (entry.user_reaction) {
                const button = reactionsContainer.querySelector(`[data-reaction-type="${entry.user_reaction}"]`);
                if (button) button.classList.add('active');
            }
        }
    }

    initializeManagers() {
        // Initialize reaction and comment managers
        new ReactionManager();
        new CommentManager();
    }

    async loadComments() {
        try {
            console.log('Loading comments for entry:', this.entry.id);
            const response = await fetch(`/api/entries/${this.entry.id}/comments`);
            if (!response.ok) throw new Error('Failed to fetch comments');
            
            const comments = await response.json();
            console.log('Received comments:', comments);
            
            const commentsContainer = document.querySelector(`#comments-${this.entry.id}`);
            console.log('Comments container:', commentsContainer);
            
            if (commentsContainer) {
                const commentHTML = comments.map(comment => this.createCommentHTML(comment)).join('');
                console.log('Generated HTML:', commentHTML);
                commentsContainer.innerHTML = commentHTML;
            } else {
                throw new Error('Comments container not found for entry: ' + this.entry.id);
            }
        } catch (error) {
            console.error('Error loading comments:', error);
            const commentsSection = document.querySelector('.comments-section');
            if (commentsSection) {
                commentsSection.innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        Failed to load comments. Please try refreshing the page.
                        <br>
                        Error: ${error.message}
                    </div>
                    <form class="comment-form mb-4" data-entry-id="${this.entry.id}">
                        <div class="form-group">
                            <textarea class="form-control" rows="3" required placeholder="Write a comment..."></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary mt-2">Post Comment</button>
                    </form>`;
            }
        }
    }

    createCommentHTML(comment) {
        const replies = comment.replies ? comment.replies.map(reply => 
            this.createCommentHTML(reply)
        ).join('') : '';

        return `
            <div class="comment mb-3" data-comment-id="${comment.id}">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2 text-muted">
                            ${comment.user_id} • ${new Date(comment.timestamp).toLocaleString()}
                        </h6>
                        <p class="card-text">${escapeHtml(comment.content)}</p>
                        <button class="btn btn-sm btn-outline-primary reply-button" 
                                data-comment-id="${comment.id}">
                            Reply
                        </button>
                        <form class="reply-form mt-2 d-none" 
                              data-entry-id="${comment.entry_id}"
                              data-parent-id="${comment.id}">
                            <div class="form-group">
                                <textarea class="form-control" 
                                          rows="2" 
                                          required 
                                          placeholder="Write a reply..."></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary btn-sm mt-2">Post Reply</button>
                        </form>
                        <div class="replies ml-4 mt-3">
                            ${replies}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

export class ReactionManager {
    constructor() {
        this.DEBOUNCE_TIME = 1000;
        this.entryStates = new Map();
        this.bindEvents();
        this.likeImage = '/static/images/like.svg';
        this.dislikeImage = '/static/images/dislike.svg';
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            const reactionBtn = e.target.closest('.reaction-btn');
            if (reactionBtn && !reactionBtn.disabled) {
                e.preventDefault();
                this.handleReaction(reactionBtn);
            }
        });
    }

    async handleReaction(button) {
        const entryId = button.dataset.entryId;
        const type = button.dataset.reactionType;
        const container = button.closest('.reactions');

        if (!entryId || !type || !container) return;

        // Disable button temporarily
        button.disabled = true;

        try {
            const response = await fetch(`/api/entries/${entryId}/react`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                },
                body: JSON.stringify({ reaction_type: type })
            });

            if (!response.ok) throw new Error('Failed to update reaction');

            const data = await response.json();
            
            // Update UI with server response
            container.querySelector('.likes-count').textContent = data.likes_count;
            container.querySelector('.dislikes-count').textContent = data.dislikes_count;
            
            // Update active states
            container.querySelectorAll('.reaction-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.reactionType === data.user_reaction);
            });

            // Create particle effect
            this.createParticle(button, type);

        } catch (error) {
            console.error('Error updating reaction:', error);
            if (window.showNotification) {
                window.showNotification('Failed to save reaction', 'error');
            }
        } finally {
            button.disabled = false;
        }
    }

    createParticle(button, type) {
        const particle = document.createElement('img');
        particle.src = type === 'like' ? this.likeImage : this.dislikeImage;
        particle.classList.add('reaction-particle');
        
        // Get button position
        const rect = button.getBoundingClientRect();
        const startX = rect.left + rect.width/2 - 12;
        const startY = rect.top + rect.height/2 - 12;
        
        particle.style.cssText = `
            width: 24px;
            height: 24px;
            left: ${startX}px;
            top: ${startY}px;
            opacity: 1;
        `;
        
        document.body.appendChild(particle);

        // Animation parameters
        const angle = (Math.random() * 60 - 30) * Math.PI / 180;
        const velocity = 2 + Math.random() * 2;
        const rotationSpeed = (Math.random() - 0.5) * 8;
        let rotation = 0;
        let opacity = 1;
        let y = startY;
        let x = startX;

        const animate = () => {
            x += Math.sin((startY - y) / 30) * 1.5;
            y -= velocity;
            rotation += rotationSpeed;
            opacity = Math.max(0, opacity - 0.02);

            particle.style.transform = `translate(${x - startX}px, ${y - startY}px) rotate(${rotation}deg)`;
            particle.style.opacity = opacity;

            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };

        requestAnimationFrame(animate);
    }

    getEntryState(entryId, container) {
        if (!this.entryStates.has(entryId)) {
            // Initialize state if it doesn't exist
            this.entryStates.set(entryId, {
                likes: parseInt(container.querySelector('.likes-count').textContent) || 0,
                dislikes: parseInt(container.querySelector('.dislikes-count').textContent) || 0,
                currentReaction: container.querySelector('.reaction-btn.active')?.dataset.reactionType || null
            });
        }
        return this.entryStates.get(entryId);
    }

    updateEntryState(entryId, newState) {
        this.entryStates.set(entryId, newState);
        return newState;
    }

    calculateNewState(currentState, clickedType) {
        const state = { ...currentState };

        // If clicking the same reaction, remove it
        if (state.currentReaction === clickedType) {
            if (clickedType === 'like') state.likes--;
            if (clickedType === 'dislike') state.dislikes--;
            state.currentReaction = null;
        }
        // If switching reactions
        else if (state.currentReaction) {
            if (state.currentReaction === 'like') {
                state.likes--;
                state.dislikes++;
            } else {
                state.dislikes--;
                state.likes++;
            }
            state.currentReaction = clickedType;
        }
        // If adding new reaction
        else {
            if (clickedType === 'like') state.likes++;
            if (clickedType === 'dislike') state.dislikes++;
            state.currentReaction = clickedType;
        }

        return state;
    }

    updateUI(container, state) {
        // Update counts
        container.querySelector('.likes-count').textContent = Math.max(0, state.likes);
        container.querySelector('.dislikes-count').textContent = Math.max(0, state.dislikes);

        // Update active states
        container.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.reactionType === state.currentReaction);
        });
    }

    async syncWithServer(entryId, container) {
        const state = this.entryStates.get(entryId);
        if (!state) return;

        try {
            const response = await fetch(`/api/entries/${entryId}/react`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({
                    reaction_type: state.currentReaction // null will remove the reaction
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to sync reaction');
            }

            // Update state with server response
            const serverState = {
                likes: data.likes_count,
                dislikes: data.dislikes_count,
                currentReaction: data.user_reaction
            };

            // Only update UI if server state differs from our current state
            if (JSON.stringify(serverState) !== JSON.stringify(state)) {
                this.updateEntryState(entryId, serverState);
                this.updateUI(container, serverState);
            }

        } catch (error) {
            console.error('Error syncing with server:', error);
            showNotification('Failed to save your reaction. Changes will be temporary.', 'warning');
        } finally {
            // Cleanup
            this.syncTimeouts.delete(entryId);
            this.pendingSync.delete(entryId);
        }
    }
}

class CommentManager {
    constructor() {
        console.log('Initializing CommentManager');
        this.bindEvents();
        this.entryId = document.querySelector('.comment-form')?.dataset.entryId;
        if (!this.entryId) {
            const entryViewer = window.entryViewer;
            if (entryViewer && entryViewer.entry) {
                this.entryId = entryViewer.entry.id;
            }
        }
        console.log('Entry ID:', this.entryId);
        if (this.entryId) {
            this.loadComments();
        } else {
            console.warn('No entry ID found');
        }
    }

    bindEvents() {
        // Use event delegation for dynamically added elements
        document.addEventListener('submit', async (e) => {
            const form = e.target.closest('.comment-form, .reply-form');
            if (form) {
                e.preventDefault();
                await this.handleCommentSubmit(form);
            }
        });

        document.addEventListener('click', (e) => {
            const replyBtn = e.target.closest('.reply-button');
            if (replyBtn) {
                this.toggleReplyForm(replyBtn);
            }
        });
    }

    async loadComments() {
        if (!this.entryId) {
            console.warn('No entry ID available for loading comments');
            return;
        }
        const commentsContainer = document.querySelector(`#comments-${this.entryId}`);
        if (!commentsContainer) {
            console.warn('Comments container not found');
            return;
        }

        try {
            commentsContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading comments...</span></div></div>';
            const response = await fetch(`/api/entries/${this.entryId}/comments`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const comments = await response.json();
            
            if (comments.length === 0) {
                commentsContainer.innerHTML = '<p class="text-muted">No comments yet. Be the first to comment!</p>';
            } else {
                commentsContainer.innerHTML = comments
                    .map(comment => this.createCommentHTML(comment))
                    .join('');
            }
        } catch (error) {
            console.error('Error loading comments:', error);
            commentsContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    Failed to load comments. Please try refreshing the page.
                </div>`;
        }
    }

    async handleCommentSubmit(form) {
        const entryId = form.dataset.entryId;
        const parentId = form.dataset.parentId;
        const textarea = form.querySelector('textarea');
        const content = textarea.value.trim();
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;

        if (!content) return;

        try {
            // Disable form while submitting
            textarea.disabled = true;
            submitButton.disabled = true;
            submitButton.textContent = 'Posting...';

            const response = await fetch(`/api/entries/${entryId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: content,
                    parent_id: parentId || null
                })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to post comment');
            }

            textarea.value = '';
            if (form.classList.contains('reply-form')) {
                form.classList.add('d-none');
            }

            // Reload comments to show new comment
            window.location.reload();

        } catch (error) {
            console.error('Error posting comment:', error);
            alert(error.message || 'Failed to post comment. Please try again.');
        } finally {
            // Re-enable form
            textarea.disabled = false;
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }

    toggleReplyForm(button) {
        const commentId = button.dataset.commentId;
        const replyForm = document.querySelector(`.reply-form[data-parent-id="${commentId}"]`);
        if (replyForm) {
            replyForm.classList.toggle('d-none');
            if (!replyForm.classList.contains('d-none')) {
                replyForm.querySelector('textarea').focus();
            }
        }
    }

    createCommentHTML(comment) {
        const replies = comment.replies ? comment.replies.map(reply => 
            this.createCommentHTML(reply)
        ).join('') : '';

        return `
            <div class="comment mb-3" data-comment-id="${comment.id}">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2 text-muted">
                            ${comment.user_id} • ${new Date(comment.timestamp).toLocaleString()}
                        </h6>
                        <p class="card-text">${escapeHtml(comment.content)}</p>
                        <button class="btn btn-sm btn-outline-primary reply-button" 
                                data-comment-id="${comment.id}">
                            Reply
                        </button>
                        <form class="reply-form mt-2 d-none" 
                              data-entry-id="${comment.entry_id}"
                              data-parent-id="${comment.id}">
                            <div class="form-group">
                                <textarea class="form-control" 
                                          rows="2" 
                                          required 
                                          placeholder="Write a reply..."></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary btn-sm mt-2">Post Reply</button>
                        </form>
                        <div class="replies ml-4 mt-3">
                            ${replies}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}