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

class ReactionManager {
    constructor() {
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            // Check if the click target is inside a reaction button or its children
            const reactionBtn = e.target.closest('.reaction-btn');
            if (reactionBtn && !reactionBtn.disabled) {
                e.stopPropagation(); // Prevent event bubbling
                e.preventDefault();
                this.handleReaction(reactionBtn);
            }
        });
    }

    async handleReaction(button) {
        try {
            const entryId = button.dataset.entryId;
            const reactionType = button.dataset.reactionType;
            const reactionsContainer = button.closest('.reactions');
            const isActive = button.classList.contains('active');
            const otherType = reactionType === 'like' ? 'dislike' : 'like';
            const otherButton = reactionsContainer.querySelector(`[data-reaction-type="${otherType}"]`);
            const otherWasActive = otherButton.classList.contains('active');
            
            // get current tally
            const likesCount = reactionsContainer.querySelector('.likes-count');
            const dislikesCount = reactionsContainer.querySelector('.dislikes-count');
            let likes = parseInt(likesCount.textContent);
            let dislikes = parseInt(dislikesCount.textContent);

            // clear active
            reactionsContainer.querySelectorAll('.reaction-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            // brute force calculation
            if (reactionType === 'like') {
                if (isActive) {
                    // Removing like
                    likes--;
                } else {
                    // Adding like
                    likes++;
                    if (otherWasActive) {
                        // Was disliked before, remove dislike
                        dislikes--;
                    }
                    button.classList.add('active');
                }
            } else {  // dislike
                if (isActive) {
                    // Removing dislike
                    dislikes--;
                } else {
                    // Adding dislike
                    dislikes++;
                    if (otherWasActive) {
                        // Was liked before, remove like
                        likes--;
                    }
                    button.classList.add('active');
                }
            }

            // Update the UI with new counts
            likesCount.textContent = likes;
            dislikesCount.textContent = dislikes;

            // Send update to server
            const response = await fetch(`/api/entries/${entryId}/react`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reaction_type: reactionType }),
            });

            const data = await response.json();
            console.log('Reaction response:', data);

            if (!response.ok) {
                // If server update fails, revert the UI changes
                likesCount.textContent = data.likes_count;
                dislikesCount.textContent = data.dislikes_count;
                reactionsContainer.querySelectorAll('.reaction-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                if (data.user_reaction) {
                    const activeButton = reactionsContainer.querySelector(`[data-reaction-type="${data.user_reaction}"]`);
                    if (activeButton) activeButton.classList.add('active');
                }
                throw new Error(data.error || 'Failed to update reaction');
            }
        } catch (error) {
            console.error('Error handling reaction:', error);
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