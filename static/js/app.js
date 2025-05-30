import { LogEntry } from './logEntry.js';
import { ReactionManager } from './entryViewer.js';

// core app functionality classes and utilities
class EntryManager {
    constructor() {
        this.form = document.getElementById('entryForm');
        this.projectList = document.getElementById('projectList');
        this.bindEvents();
        this.loadProjectSuggestions();
    }

    bindEvents() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            this.form.querySelectorAll('input, textarea').forEach(input => {
                input.addEventListener('input', () => this.validateField(input));
            });
        }
    }

    validateField(input) {
        const isValid = input.checkValidity();
        input.classList.toggle('is-valid', isValid);
        input.classList.toggle('is-invalid', !isValid);
        return isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();
        const formData = {
            project: this.form.querySelector('#project').value,
            content: this.form.querySelector('#content').value,
            repository_url: this.form.querySelector('#repository_url').value,
            start_time: this.form.querySelector('#start_time').value,
            end_time: this.form.querySelector('#end_time').value
        };

        console.log("Submitting form data:", formData); // Add this to verify data

        try {
            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                // clear form and validation states
                this.form.reset();
                this.form.querySelectorAll('input, textarea').forEach(input => {
                    input.classList.remove('is-valid', 'is-invalid');
                });
                showNotification('entry created', 'success');
                this.loadProjectSuggestions();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }


    async loadProjectSuggestions() {
        if (this.projectList) {
            try {
                const response = await fetch('/api/entries/metadata');
                const data = await response.json();
                if (data.projects) {
                    this.projectList.innerHTML = data.projects
                        .map(project => `<option value="${escapeHtml(project)}">`)
                        .join('');
                }
            } catch (error) {
                console.error('failed to load projects:', error);
            }
        }
    }
}

class SearchManager {
    constructor() {
        this.form = document.getElementById('searchForm');
        this.resultsContainer = document.getElementById('searchResults');
        this.bindEvents();
        this.loadMetadata();
        this.debounceTimer = null;
    }

    async loadMetadata() {
        const response = await fetch('/api/entries/metadata');
        const data = await response.json();
        this.populateDatalist('projectList', data.projects);
        this.populateDatalist('developerList', data.developers);
    }

    populateDatalist(id, items) {
        const datalist = document.getElementById(id);
        datalist.innerHTML = items.map(item => `<option value="${item}">`).join('');
    }

    bindEvents() {
        const filterElements = [
            'projectSearch',
            'developerSearch',
            'dateSearch',
            'sortField',
            'sortOrder'
        ];

        filterElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener('change', () => this.handleSearch());
                if (['projectSearch', 'developerSearch'].includes(elementId)) {
                    element.addEventListener('input', () => this.debounceSearch());
                }
            }
        });
    }

    debounceSearch() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.handleSearch(), 300);
    }

    async handleSearch() {
        const params = new URLSearchParams();
        
        const filters = {
            project: document.getElementById('projectSearch')?.value,
            developer_tag: document.getElementById('developerSearch')?.value,
            date: document.getElementById('dateSearch')?.value,
            sort_field: document.getElementById('sortField')?.value,
            sort_order: document.getElementById('sortOrder')?.value
        };

        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });

        try {
            const response = await fetch(`/api/entries/search?${params}`);
            if (!response.ok) throw new Error('Search failed');
            
            const entries = await response.json();
            this.displayResults(entries);
        } catch (error) {
            this.showError('Failed to fetch search results');
        }
    }

    displayResults(entries) {
        if (!this.resultsContainer) return;

        if (entries.length === 0) {
            this.resultsContainer.innerHTML = `
                <div class="card mb-3">
                    <div class="card-body">
                        <p class="text-center">No entries found</p>
                    </div>
                </div>`;
            return;
        }

        this.resultsContainer.innerHTML = entries.map(entry => `
            <div class="card mb-3 entry-preview">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <h5 class="card-title project-name">${entry.project}</h5>
                        <small class="text-muted">${new Date(entry.timestamp).toLocaleString()}</small>
                    </div>
                    <h6 class="card-subtitle mb-2 developer-tag">${entry.developer_tag}</h6>
                    <p class="card-text">${entry.content}</p>
                    ${entry.repository_url ? `
                        <a href="${entry.repository_url}" target="_blank" class="btn btn-sm btn-primary">
                            View Repository
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    showError(message) {
        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = `
                <div class="alert alert-danger">
                    ${message}
                </div>`;
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('searchForm')) {
        new SearchManager();
    }
});

class HomeManager {
    constructor() {
        this.loadProjectData();
    }

    async loadProjectData() {
        try {
            const response = await fetch('/api/entries/user-stats');
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error);
            
            // Update stats display
            document.getElementById('projectCount').textContent = data.project_count;
            document.getElementById('entryCount').textContent = data.entry_count;
            document.getElementById('devTag').textContent = data.developer_tag;
            
            // Group entries by project
            const projectGroups = this.groupEntriesByProject(data.entries);
            this.displayProjectCards(projectGroups);
        } catch (error) {
            showNotification('Failed to load projects', 'error');
        }
    }

    groupEntriesByProject(entries) {
        return entries.reduce((groups, entry) => {
            if (!groups[entry.project]) {
                groups[entry.project] = [];
            }
            groups[entry.project].push(entry);
            return groups;
        }, {});
    }

    displayProjectCards(projectGroups) {
        const container = document.getElementById('projectCards');
        if (!container) return;

        container.innerHTML = Object.entries(projectGroups).map(([project, entries]) => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${escapeHtml(project)}</h5>
                        <div class="project-entries">
                            ${entries.slice(0, 3).map(entry => this.createEntryPreview(entry)).join('')}
                            ${entries.length > 3 ? `
                                <button class="btn btn-outline-primary mt-2" 
                                        onclick="event.stopPropagation(); this.closest('.project-entries').classList.toggle('collapsed')">
                                    Show ${entries.length - 3} more entries
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    createEntryPreview(entry) {
        return `
            <div class="entry-preview mb-3">
                <small>${new Date(entry.timestamp).toLocaleDateString()}</small>
                <p class="mb-1">${escapeHtml(clipContent(entry.content, 10))}</p>
                <a href="/entry/${entry.id}" class="stretched-link"></a>
            </div>
        `;
    }
}


class EntryViewer {
    constructor() {
        this.loadEntry(this.getEntryIdFromUrl());
    }

    getEntryIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1];
    }

    async loadEntry(entryId) {
        try {
            const response = await fetch(`/api/entries/${entryId}`);
            if (!response.ok) throw new Error('Failed to load entry');
            
            const entry = await response.json();
            this.displayEntry(entry);
        } catch (error) {
            console.error('Error loading entry:', error);
            document.getElementById('entryContent').textContent = 'Error loading entry';
        }
    }

    displayEntry(entry) {
        const elements = {
            title: entry.title,
            content: entry.content,
            developer: entry.developer_tag,
            timestamp: new Date(entry.timestamp).toLocaleString(),
            timeWorked: `${entry.time_worked} minutes`,
            commitInfo: entry.commit_sha ? 
                `Commit: ${entry.commit_sha.substring(0,7)}` : 'No commit linked'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(`entry${id.charAt(0).toUpperCase() + id.slice(1)}`);
            if (element) element.textContent = value;
        });
    }
}

class PrivacyManager {
    constructor() {
        this.bindPrivacyEvents();
    }

    bindPrivacyEvents() {
        const downloadBtn = document.getElementById('downloadData');
        const deleteBtn = document.getElementById('deleteAccount');

        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.handleDownload());
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.handleDelete());
        }
    }

    async handleDownload() {
        try {
            const response = await fetch('/api/user/data');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'my_devlog_data.json';
            a.click();
        } catch (error) {
            showNotification('failed to download data', 'error');
        }
    }

    async handleDelete() {
        if (confirm('are you sure? this action cannot be undone')) {
            try {
                const response = await fetch('/api/user/data', {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    }
                });
                if (response.ok) {
                    window.location.href = '/login';
                }
            } catch (error) {
                showNotification('failed to delete account', 'error');
            }
        }
    }
}

class ProfileManager {
    constructor() {
        this.bindApiKeyEvents();
        this.loadProfileData();
        this.bind2FAEvents();
    }

    initializeErrorHandling() {
        this.errorContainer = document.createElement('div');
        this.errorContainer.className = 'alert alert-danger';
        document.querySelector('.container').prepend(this.errorContainer);
    }

    showNotification(message, type = 'danger') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} fade show`;
        notification.textContent = message;
        document.querySelector('.container').prepend(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    logError(error, context) {
        console.error(`Error in ${context}:`, error);
        this.showNotification(`${context}: ${error.message}`);
    }

    bindApiKeyEvents() {
        const generateBtn = document.getElementById('generateApiKey');
        if (generateBtn) {
            generateBtn.addEventListener('click', async () => {
                try {
                    const response = await fetch('/api/user/generate-key', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                        }
                    });
                    const data = await response.json();
                    if (response.ok) {
                        // Option 1: Reload to show the new key
                        window.location.reload();
                        // Option 2: Show the key directly (uncomment if you want to display without reload)
                        // document.getElementById('apiKeySection').innerText = data.key;
                    } else {
                        showNotification(data.error || 'Failed to generate API key', 'danger');
                    }
                } catch (err) {
                    showNotification('Network error while generating API key', 'danger');
                }
            });
        }
    }

    bind2FAEvents() {
        const toggle = document.getElementById('twoFactorToggle');
        if (toggle) {
            toggle.addEventListener('change', async (e) => {
                if (e.target.checked) {
                    const response = await fetch('/api/auth/enable-2fa', {
                        method: 'POST',
                        headers: {
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                        }
                    });
                    if (response.ok) {
                        document.getElementById('verificationSection').style.display = 'block';
                        this.showNotification('Verification code sent to your email', 'success');
                    }
                } else {
                    const response = await fetch('/api/auth/disable-2fa', {
                        method: 'POST',
                        headers: {
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                        }
                    });
                    if (response.ok) {
                        document.getElementById('verificationSection').style.display = 'none';
                        this.showNotification('2FA disabled successfully', 'success');
                    }
                }
            });
        }

        document.getElementById('verifyCode')?.addEventListener('click', async () => {
            const code = document.getElementById('verificationCode').value;
            const response = await fetch('/api/auth/verify-2fa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({ code })
            });
            if (response.ok) {
                document.getElementById('verificationSection').style.display = 'none';
                this.showNotification('2FA enabled successfully', 'success');
            }
        });
    }

    async handleGenerateKey() {
        try {
            const response = await fetch('/api/user/generate-key', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });
            
            if (response.ok) {
                this.showNotification('API key generated successfully', 'success');
                location.reload();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to generate API key');
            }
        } catch (error) {
            this.logError(error, 'API Key Generation');
        }
    }

    async handleRegenerateKey() {
        if (confirm('Are you sure? Current API key will be invalidated.')) {
            await this.handleGenerateKey();
        }
    }

    async loadProfileData() {
        try {
            const response = await fetch('/api/entries/user-stats');
            const data = await response.json();
            
            const projectCount = document.getElementById('projectCount');
            const entryCount = document.getElementById('entryCount');
            
            if (projectCount) projectCount.textContent = data.project_count;
            if (entryCount) entryCount.textContent = data.entry_count;
            
            this.displayRecentEntries(data.entries);
            
        } catch (error) {
            this.logError(error, 'Profile Data Loading');
        }
    }

    displayRecentEntries(entries) {
        const recentEntries = document.getElementById('recentEntries');
        if (!recentEntries) return;

        if (!entries?.length) {
            recentEntries.innerHTML = '<p>No entries yet</p>';
            return;
        }

        recentEntries.innerHTML = entries.map(entry => `
            <div class="card mb-3 entry-preview">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <h5 class="card-title project-name">${entry.project}</h5>
                        <small class="text-muted">${new Date(entry.timestamp).toLocaleString()}</small>
                    </div>
                    <p class="card-text">${entry.content}</p>
                    ${entry.repository_url ? `
                        <a href="${entry.repository_url}" target="_blank" class="btn btn-sm btn-primary">
                            View Repository
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }
}

// Using the ReactionManager from entryViewer.js instead for consistency

class CommentManager {
    constructor() {
        this.bindCommentEvents();
    }

    bindCommentEvents() {
        document.addEventListener('submit', (e) => {
            if (e.target.matches('.comment-form')) {
                e.preventDefault();
                this.handleCommentSubmit(e.target);
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.matches('.reply-button')) {
                this.toggleReplyForm(e.target);
            }
        });
    }

    async handleCommentSubmit(form) {
        const entryId = form.dataset.entryId;
        const parentId = form.dataset.parentId || null;
        const content = form.querySelector('textarea').value;

        try {
            const response = await fetch(`/api/entries/${entryId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content,
                    parent_id: parentId
                }),
            });

            if (!response.ok) throw new Error('Failed to post comment');
            
            const comment = await response.json();
            this.addCommentToDOM(comment, parentId);
            form.reset();
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Failed to post comment. Please try again.');
        }
    }

    toggleReplyForm(button) {
        const commentId = button.dataset.commentId;
        const replyForm = document.querySelector(`.reply-form[data-parent-id="${commentId}"]`);
        
        if (replyForm) {
            replyForm.classList.toggle('d-none');
            const textarea = replyForm.querySelector('textarea');
            if (!replyForm.classList.contains('d-none')) {
                textarea.focus();
            }
        }
    }

    addCommentToDOM(comment, parentId) {
        const commentHtml = this.createCommentHTML(comment);
        
        if (parentId) {
            const parentComment = document.querySelector(`.comment[data-comment-id="${parentId}"]`);
            const repliesContainer = parentComment.querySelector('.replies');
            repliesContainer.insertAdjacentHTML('beforeend', commentHtml);
        } else {
            const commentsContainer = document.querySelector(`#comments-${comment.entry_id}`);
            commentsContainer.insertAdjacentHTML('beforeend', commentHtml);
        }
    }

    createCommentHTML(comment) {
        return `
            <div class="comment mb-3" data-comment-id="${comment.id}">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2 text-muted">
                            ${comment.user_id} • ${new Date(comment.timestamp).toLocaleString()}
                        </h6>
                        <p class="card-text">${this.escapeHtml(comment.content)}</p>
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
                            ${comment.replies ? comment.replies.map(reply => this.createCommentHTML(reply)).join('') : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/<//g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize managers only if not already initialized by EntryViewer
document.addEventListener('DOMContentLoaded', () => {
    if (!window.entryViewer) {
        window.reactionManager = new ReactionManager();
    }
});

// utility functions
function escapeHtml(unsafe) { // prevents xss in dynamic stuff
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

window.showNotification = function(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '1050';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
};

function clipContent(content, maxLines = 3) {
    const lines = content.split('\n');
    return lines.length > maxLines ? lines.slice(0, maxLines).join('\n') + '...' : content;
}

function createEntryCard(entry) {
    return `
        <div class="card mb-3 entry-card">
            <div class="card-body">
                <h5 class="card-title text-truncate">${escapeHtml(entry.project)}</h5>
                <h6 class="card-subtitle mb-2">
                    ${new Date(entry.timestamp).toLocaleString()} - ${escapeHtml(entry.developer_tag)}
                </h6>
                <p class="card-text">${escapeHtml(clipContent(entry.content))}</p>
                <div class="entry-details">
                    <small>
                        <div>time worked: ${entry.time_worked} minutes</div>
                        <div>start: ${new Date(entry.start_time).toLocaleString()}</div>
                        <div>end: ${new Date(entry.end_time).toLocaleString()}</div>
                        ${entry.repository_url ? `<div><a href="${escapeHtml(entry.repository_url)}" target="_blank">repository</a></div>` : ''}
                    </small>
                </div>
            </div>
        </div>
    `;
}




// initialize all managers on dom load
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    // Initialize appropriate class based on current path
    if (path.includes('/project/')) {
        initializeProjectPage();
    } else if (path.includes('/entry/') && !path.includes('/new')) {
        new EntryViewer();
    } else if (path.includes('/entry/new/')) {
        new EntryForm();
    } else if (path === '/') {
        new LogEntry();
    }
});

function initializeProjectPage() {
    const projectDataElem = document.getElementById('projectData');
    if (!projectDataElem) return;

    const entries = JSON.parse(projectDataElem.value);
    const commitTimeline = document.getElementById('commitTimeline');
    if (!commitTimeline) return;

    // Group entries by commit
    const entryMap = new Map();
    entries.forEach(entry => {
        if (entry.commit_sha) {
            if (!entryMap.has(entry.commit_sha)) {
                entryMap.set(entry.commit_sha, []);
            }
            entryMap.get(entry.commit_sha).push(entry);
        }
    });

    // add entry indicators to commits
    document.querySelectorAll('.commit-item').forEach(commitItem => {
        const sha = commitItem.dataset.commitSha;
        const relatedEntries = entryMap.get(sha) || [];
        
        if (relatedEntries.length > 0) {
            const entriesDiv = commitItem.querySelector('.related-entries');
            const entryLinks = relatedEntries.map(entry => `
                <a href="/entry/${entry.id}" class="badge bg-primary text-decoration-none me-1">
                    ${entry.title.substring(0, 20)}${entry.title.length > 20 ? '...' : ''}
                </a>
            `).join('');
            
            entriesDiv.innerHTML = entryLinks;
        }
    });

    // highlight related entries when clicking a commit
    commitTimeline.addEventListener('click', (e) => {
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
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const entryForm = document.getElementById('entryForm');
    if (entryForm) {
        new LogEntry();
    }
});
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('apiKeySection')) {
        window.profileManager = new ProfileManager();
    }
});
