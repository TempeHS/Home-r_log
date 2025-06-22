/**
 * Advanced Search Manager
 * Handles the complex search interface with real-time SQL preview
 */
class AdvancedSearchManager {
    constructor() {
        this.currentMode = 'entries';
        this.searchFilters = {
            text: '',
            projects: [],
            languages: [],
            users: [],
            dateFrom: '',
            dateTo: '',
            sortField: 'timestamp',
            sortOrder: 'desc'
        };
        this.metadata = {
            projects: [],
            languages: [],
            users: []
        };
        this.currentPage = 1;
        this.resultsPerPage = 20;
        
        this.init();
    }

    async init() {
        try {
            await this.loadMetadata();
            this.bindEvents();
            this.initializeFilters();
            this.updateSQLPreview();
        } catch (error) {
            console.error('Failed to initialize advanced search:', error);
            this.showError('Failed to load search interface');
        }
    }

    async loadMetadata() {
        try {
            const response = await fetch('/api/search/metadata');
            if (!response.ok) throw new Error('Failed to fetch metadata');
            
            this.metadata = await response.json();
            this.populateFilterLists();
        } catch (error) {
            console.error('Failed to load metadata:', error);
            throw error;
        }
    }

    populateFilterLists() {
        this.populateFilterList('projectList', this.metadata.projects, 'name', 'entry_count');
        this.populateFilterList('languageList', this.metadata.languages, 'name', 'project_count');
        this.populateFilterList('userList', this.metadata.users, 'developer_tag', 'entry_count');
    }

    populateFilterList(containerId, items, nameField, metaField) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'filter-item';
            
            const metaValue = item[metaField] || 0;
            const metaText = containerId.includes('project') ? `${metaValue} entries` :
                           containerId.includes('language') ? `${metaValue} projects` :
                           `${metaValue} entries`;
            
            div.innerHTML = `
                <label class="form-check-label">
                    <input type="checkbox" class="form-check-input filter-checkbox" 
                           value="${item[nameField]}" data-filter-type="${containerId.replace('List', '')}">
                    <span class="filter-name">${item[nameField]}</span>
                    <small class="filter-meta text-muted">(${metaText})</small>
                </label>
            `;
            
            container.appendChild(div);
        });
    }

    initializeFilters() {
        this.updateSortOptions();
        this.setupFilterSearch();
        this.updateFilterCounts();
    }

    setupFilterSearch() {
        const searchInputs = document.querySelectorAll('.filter-search');
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const targetId = e.target.id.replace('Search', 'List');
                this.filterListItems(targetId, e.target.value);
            });
        });
    }

    filterListItems(listId, searchTerm) {
        const list = document.getElementById(listId);
        if (!list) return;

        const items = list.querySelectorAll('.filter-item');
        items.forEach(item => {
            const name = item.querySelector('.filter-name').textContent.toLowerCase();
            const isVisible = name.includes(searchTerm.toLowerCase());
            item.style.display = isVisible ? 'block' : 'none';
        });
    }

    updateSortOptions() {
        const sortField = document.getElementById('sortField');
        const sortOrder = document.getElementById('sortOrder');
        
        if (!sortField || !sortOrder) return;

        sortField.innerHTML = '';
        sortOrder.innerHTML = '';

        if (this.currentMode === 'entries') {
            sortField.innerHTML = `
                <option value="timestamp">Date</option>
                <option value="likes">Likes</option>
                <option value="comments">Comments</option>
                <option value="project">Project</option>
            `;
        } else if (this.currentMode === 'projects') {
            sortField.innerHTML = `
                <option value="created_at">Created Date</option>
                <option value="entries">Entry Count</option>
                <option value="name">Name</option>
            `;
        } else if (this.currentMode === 'forums') {
            sortField.innerHTML = `
                <option value="created_at">Date</option>
                <option value="replies">Replies</option>
            `;
        }

        sortOrder.innerHTML = `
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
        `;

        sortField.value = this.searchFilters.sortField;
        sortOrder.value = this.searchFilters.sortOrder;
    }

    bindEvents() {
        const modeTabs = document.querySelectorAll('#searchModeTabs .nav-link');
        modeTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchMode(e.target.dataset.mode);
            });
        });

        const form = document.getElementById('advancedSearchForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.performSearch();
            });
        }

        const searchText = document.getElementById('searchText');
        if (searchText) {
            searchText.addEventListener('input', () => this.updateFiltersAndPreview());
        }

        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('filter-checkbox')) {
                this.updateFiltersAndPreview();
            }
        });

        ['dateFrom', 'dateTo', 'sortField', 'sortOrder'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.updateFiltersAndPreview());
            }
        });

        const toggleButtons = document.querySelectorAll('.toggle-filters');
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target.dataset.target;
                this.toggleFilterPanel(target);
            });
        });

        const clearButton = document.getElementById('clearFilters');
        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearAllFilters());
        }

        const sqlToggle = document.querySelector('.toggle-sql');
        if (sqlToggle) {
            sqlToggle.addEventListener('click', () => this.toggleSQLPreview());
        }

        const exportButton = document.getElementById('exportResults');
        if (exportButton) {
            exportButton.addEventListener('click', () => this.exportResults());
        }
    }

    switchMode(mode) {
        if (mode === this.currentMode) return;

        this.currentMode = mode;
        
        document.querySelectorAll('#searchModeTabs .nav-link').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`#searchModeTabs [data-mode="${mode}"]`).classList.add('active');
        
        this.updateSortOptions();
        this.updateSQLPreview();
        this.clearResults();
    }

    updateFiltersAndPreview() {
        this.collectFilterValues();
        this.updateFilterCounts();
        this.updateSQLPreview();
    }

    collectFilterValues() {
        this.searchFilters.text = document.getElementById('searchText')?.value || '';
        this.searchFilters.projects = this.getSelectedFilterValues('project');
        this.searchFilters.languages = this.getSelectedFilterValues('language');
        this.searchFilters.users = this.getSelectedFilterValues('user');
        this.searchFilters.dateFrom = document.getElementById('dateFrom')?.value || '';
        this.searchFilters.dateTo = document.getElementById('dateTo')?.value || '';
        this.searchFilters.sortField = document.getElementById('sortField')?.value || 'timestamp';
        this.searchFilters.sortOrder = document.getElementById('sortOrder')?.value || 'desc';
    }

    getSelectedFilterValues(type) {
        const checkboxes = document.querySelectorAll(`[data-filter-type="${type}"] input:checked`);
        return Array.from(checkboxes).map(cb => cb.value);
    }

    updateFilterCounts() {
        const projectCount = document.getElementById('projectCount');
        const languageCount = document.getElementById('languageCount');
        const userCount = document.getElementById('userCount');
        
        if (projectCount) projectCount.textContent = `(${this.searchFilters.projects.length})`;
        if (languageCount) languageCount.textContent = `(${this.searchFilters.languages.length})`;
        if (userCount) userCount.textContent = `(${this.searchFilters.users.length})`;
    }

    updateSQLPreview() {
        const preview = document.getElementById('sqlPreview');
        if (!preview) return;

        let sql = '';
        
        if (this.currentMode === 'entries') {
            sql = this.generateEntriesSQL();
        } else if (this.currentMode === 'projects') {
            sql = this.generateProjectsSQL();
        } else if (this.currentMode === 'forums') {
            sql = this.generateForumsSQL();
        }
        
        preview.textContent = sql;
    }

    generateEntriesSQL() {
        let sql = 'SELECT entries.*, users.developer_tag, projects.name as project_name';
        let joins = '\nFROM log_entry as entries';
        let wheres = [];
        
        joins += '\nJOIN user as users ON entries.developer_tag = users.developer_tag';
        joins += '\nJOIN project as projects ON entries.project_name = projects.name';
        
        if (this.searchFilters.text) {
            wheres.push(`(entries.title ILIKE '%${this.searchFilters.text}%' OR entries.content ILIKE '%${this.searchFilters.text}%')`);
        }
        
        if (this.searchFilters.projects.length > 0) {
            wheres.push(`entries.project_name IN ('${this.searchFilters.projects.join("', '")}')`);
        }
        
        if (this.searchFilters.users.length > 0) {
            wheres.push(`entries.developer_tag IN ('${this.searchFilters.users.join("', '")}')`);
        }
        
        if (this.searchFilters.languages.length > 0) {
            joins += '\nJOIN project_tags ON projects.name = project_tags.project_name';
            joins += '\nJOIN language_tags ON project_tags.tag_id = language_tags.id';
            wheres.push(`language_tags.name IN ('${this.searchFilters.languages.join("', '")}')`);
        }
        
        if (this.searchFilters.dateFrom) {
            wheres.push(`entries.timestamp >= '${this.searchFilters.dateFrom}'`);
        }
        if (this.searchFilters.dateTo) {
            wheres.push(`entries.timestamp <= '${this.searchFilters.dateTo} 23:59:59'`);
        }
        
        if (wheres.length > 0) {
            sql += joins + '\nWHERE ' + wheres.join(' AND ');
        } else {
            sql += joins;
        }
        
        let orderField = 'entries.timestamp';
        if (this.searchFilters.sortField === 'likes') {
            orderField = 'likes_count';
            sql += '\nLEFT JOIN (SELECT entry_id, COUNT(*) as likes_count FROM entry_reaction WHERE reaction_type = "like" GROUP BY entry_id) likes ON entries.id = likes.entry_id';
        } else if (this.searchFilters.sortField === 'comments') {
            orderField = 'comments_count';
            sql += '\nLEFT JOIN (SELECT entry_id, COUNT(*) as comments_count FROM comment GROUP BY entry_id) comments ON entries.id = comments.entry_id';
        } else if (this.searchFilters.sortField === 'project') {
            orderField = 'entries.project_name';
        }
        
        sql += `\nORDER BY ${orderField} ${this.searchFilters.sortOrder.toUpperCase()}`;
        
        return sql;
    }

    generateProjectsSQL() {
        let sql = 'SELECT projects.*, COUNT(entries.id) as entry_count';
        let joins = '\nFROM project as projects';
        let wheres = [];
        
        joins += '\nLEFT JOIN log_entry as entries ON projects.name = entries.project_name';
        
        if (this.searchFilters.text) {
            wheres.push(`(projects.name ILIKE '%${this.searchFilters.text}%' OR projects.description ILIKE '%${this.searchFilters.text}%')`);
        }
        
        if (this.searchFilters.users.length > 0) {
            joins += '\nLEFT JOIN project_members ON projects.name = project_members.project_name';
            wheres.push(`(projects.created_by IN ('${this.searchFilters.users.join("', '")}') OR project_members.user_id IN ('${this.searchFilters.users.join("', '")}'))`);
        }
        
        if (this.searchFilters.languages.length > 0) {
            joins += '\nJOIN project_tags ON projects.name = project_tags.project_name';
            joins += '\nJOIN language_tags ON project_tags.tag_id = language_tags.id';
            wheres.push(`language_tags.name IN ('${this.searchFilters.languages.join("', '")}')`);
        }
        
        if (wheres.length > 0) {
            sql += joins + '\nWHERE ' + wheres.join(' AND ');
        } else {
            sql += joins;
        }
        
        sql += '\nGROUP BY projects.name, projects.description, projects.repository_url, projects.created_at, projects.created_by';
        
        let orderField = 'projects.created_at';
        if (this.searchFilters.sortField === 'entries') {
            orderField = 'entry_count';
        } else if (this.searchFilters.sortField === 'name') {
            orderField = 'projects.name';
        }
        
        sql += `\nORDER BY ${orderField} ${this.searchFilters.sortOrder.toUpperCase()}`;
        
        return sql;
    }

    generateForumsSQL() {
        let sql = 'SELECT topics.title, topics.content, topics.created_at, users.developer_tag, categories.name as category';
        let joins = '\nFROM forum_topics as topics';
        let wheres = [];
        
        joins += '\nJOIN forum_categories as categories ON topics.category_id = categories.id';
        joins += '\nJOIN user as users ON topics.author_id = users.developer_tag';
        joins += '\nLEFT JOIN language_tags ON categories.language_tag_id = language_tags.id';
        
        if (this.searchFilters.text) {
            wheres.push(`(topics.title ILIKE '%${this.searchFilters.text}%' OR topics.content ILIKE '%${this.searchFilters.text}%')`);
        }
        
        if (this.searchFilters.users.length > 0) {
            wheres.push(`topics.author_id IN ('${this.searchFilters.users.join("', '")}')`);
        }
        
        if (this.searchFilters.languages.length > 0) {
            wheres.push(`language_tags.name IN ('${this.searchFilters.languages.join("', '")}')`);
        }
        
        if (this.searchFilters.projects.length > 0) {
            wheres.push(`topics.project_name IN ('${this.searchFilters.projects.join("', '")}')`);
        }
        
        if (wheres.length > 0) {
            sql += joins + '\nWHERE ' + wheres.join(' AND ');
        } else {
            sql += joins;
        }
        
        sql += '\nORDER BY topics.created_at DESC';
        
        return sql;
    }

    async performSearch() {
        this.collectFilterValues();
        
        try {
            this.showLoading();
            
            let endpoint = '';
            let params = new URLSearchParams();
            
            if (this.searchFilters.text) params.append('text', this.searchFilters.text);
            this.searchFilters.projects.forEach(p => params.append('projects[]', p));
            this.searchFilters.languages.forEach(l => params.append('languages[]', l));
            this.searchFilters.users.forEach(u => params.append('users[]', u));
            params.append('sort_field', this.searchFilters.sortField);
            params.append('sort_order', this.searchFilters.sortOrder);
            
            if (this.currentMode === 'entries') {
                endpoint = '/api/search/entries/advanced';
                if (this.searchFilters.dateFrom) params.append('date_from', this.searchFilters.dateFrom);
                if (this.searchFilters.dateTo) params.append('date_to', this.searchFilters.dateTo);
                params.append('page', this.currentPage);
                params.append('per_page', this.resultsPerPage);
            } else if (this.currentMode === 'projects') {
                endpoint = '/api/search/projects/advanced';
            } else if (this.currentMode === 'forums') {
                endpoint = '/api/search/forums/advanced';
            }
            
            const response = await fetch(`${endpoint}?${params}`);
            if (!response.ok) throw new Error('Search failed');
            
            const data = await response.json();
            this.displayResults(data);
            
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    displayResults(data) {
        const resultsContainer = document.getElementById('searchResults');
        const resultsCount = document.getElementById('resultsCount');
        const resultsTitle = document.getElementById('resultsTitle');
        
        if (!resultsContainer) return;
        
        if (this.currentMode === 'entries') {
            const total = data.pagination ? data.pagination.total : data.entries.length;
            resultsTitle.textContent = 'Search Results - Entries';
            resultsCount.textContent = total;
            this.displayEntryResults(data.entries, resultsContainer);
            if (data.pagination) this.displayPagination(data.pagination);
        } else if (this.currentMode === 'projects') {
            resultsTitle.textContent = 'Search Results - Projects';
            resultsCount.textContent = data.projects.length;
            this.displayProjectResults(data.projects, resultsContainer);
        } else if (this.currentMode === 'forums') {
            resultsTitle.textContent = 'Search Results - Forums';
            resultsCount.textContent = data.results.length;
            this.displayForumResults(data.results, resultsContainer);
        }
    }

    displayEntryResults(entries, container) {
        if (entries.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-search display-1"></i>
                    <h4 class="mt-3">No entries found</h4>
                    <p>Try adjusting your search filters</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = entries.map(entry => `
            <div class="card mb-3 entry-result">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h5 class="card-title">
                                <a href="/entry/${entry.id}" class="text-decoration-none">${this.escapeHtml(entry.title)}</a>
                            </h5>
                            <h6 class="card-subtitle mb-2 text-muted">
                                <span class="badge bg-primary me-2">${this.escapeHtml(entry.project_name)}</span>
                                ${this.escapeHtml(entry.developer_tag)} • ${new Date(entry.timestamp).toLocaleDateString()}
                            </h6>
                            <p class="card-text">${this.escapeHtml(this.truncateText(entry.content, 200))}</p>
                        </div>
                        <div class="result-stats ms-3">
                            <div class="stat-item">
                                <i class="bi bi-heart-fill text-danger"></i> ${entry.likes_count || 0}
                            </div>
                            <div class="stat-item">
                                <i class="bi bi-chat-fill text-primary"></i> ${entry.comments_count || 0}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayProjectResults(projects, container) {
        if (projects.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-search display-1"></i>
                    <h4 class="mt-3">No projects found</h4>
                    <p>Try adjusting your search filters</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = projects.map(project => `
            <div class="card mb-3 project-result">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h5 class="card-title">
                                <a href="/projects/${encodeURIComponent(project.name)}" class="text-decoration-none">
                                    ${this.escapeHtml(project.name)}
                                </a>
                            </h5>
                            <p class="card-text">${this.escapeHtml(project.description)}</p>
                            <div class="project-meta">
                                <small class="text-muted">
                                    Created by ${this.escapeHtml(project.created_by)} • 
                                    ${new Date(project.created_at).toLocaleDateString()}
                                    ${project.languages && project.languages.length > 0 ? 
                                        ' • ' + project.languages.map(lang => `<span class="badge bg-secondary me-1">${lang}</span>`).join('') 
                                        : ''}
                                </small>
                            </div>
                        </div>
                        <div class="result-stats ms-3">
                            <div class="stat-item">
                                <i class="bi bi-journal-text"></i> ${project.entry_count || 0} entries
                            </div>
                            <div class="stat-item">
                                <i class="bi bi-people"></i> ${project.team_size || 0} members
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayForumResults(results, container) {
        if (results.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-search display-1"></i>
                    <h4 class="mt-3">No forum posts found</h4>
                    <p>Try adjusting your search filters</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = results.map(result => `
            <div class="card mb-3 forum-result">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="card-subtitle mb-2">
                                <span class="badge ${result.type === 'topic' ? 'bg-primary' : 'bg-secondary'}">${result.type}</span>
                                ${result.language ? `<span class="badge bg-info">${result.language}</span>` : ''}
                                ${result.category ? `<span class="badge bg-outline-primary">${result.category}</span>` : ''}
                            </h6>
                            ${result.type === 'topic' ? 
                                `<h5 class="card-title">${this.escapeHtml(result.title)}</h5>` :
                                `<h5 class="card-title">Reply to: ${this.escapeHtml(result.topic_title || 'Unknown Topic')}</h5>`
                            }
                            <p class="card-text">${this.escapeHtml(this.truncateText(result.content, 200))}</p>
                            <small class="text-muted">
                                By ${this.escapeHtml(result.author)} • ${new Date(result.created_at).toLocaleDateString()}
                                ${result.project ? ` • Project: ${this.escapeHtml(result.project)}` : ''}
                            </small>
                        </div>
                        ${result.type === 'topic' && result.reply_count ? 
                            `<div class="result-stats ms-3">
                                <div class="stat-item">
                                    <i class="bi bi-chat-dots"></i> ${result.reply_count} replies
                                </div>
                            </div>` : ''
                        }
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayPagination(pagination) {
        const paginationContainer = document.getElementById('searchPagination');
        if (!paginationContainer || pagination.pages <= 1) {
            if (paginationContainer) paginationContainer.style.display = 'none';
            return;
        }
        
        let paginationHTML = '';
        
        if (pagination.has_prev) {
            paginationHTML += `<li class="page-item">
                <a class="page-link" href="#" data-page="${pagination.page - 1}">Previous</a>
            </li>`;
        }
        
        const start = Math.max(1, pagination.page - 2);
        const end = Math.min(pagination.pages, pagination.page + 2);
        
        for (let i = start; i <= end; i++) {
            paginationHTML += `<li class="page-item ${i === pagination.page ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>`;
        }
        
        if (pagination.has_next) {
            paginationHTML += `<li class="page-item">
                <a class="page-link" href="#" data-page="${pagination.page + 1}">Next</a>
            </li>`;
        }
        
        const paginationList = paginationContainer.querySelector('.pagination');
        if (paginationList) {
            paginationList.innerHTML = paginationHTML;
            paginationContainer.style.display = 'block';
            
            paginationContainer.querySelectorAll('.page-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = parseInt(e.target.dataset.page);
                    if (page && page !== this.currentPage) {
                        this.currentPage = page;
                        this.performSearch();
                    }
                });
            });
        }
    }

    toggleFilterPanel(targetId) {
        const panel = document.getElementById(targetId);
        const button = document.querySelector(`[data-target="${targetId}"]`);
        
        if (panel && button) {
            const isHidden = panel.style.display === 'none';
            panel.style.display = isHidden ? 'block' : 'none';
            
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = isHidden ? 'bi bi-chevron-up' : 'bi bi-chevron-down';
            }
        }
    }

    clearAllFilters() {
        const searchText = document.getElementById('searchText');
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const sortField = document.getElementById('sortField');
        const sortOrder = document.getElementById('sortOrder');
        
        if (searchText) searchText.value = '';
        if (dateFrom) dateFrom.value = '';
        if (dateTo) dateTo.value = '';
        
        document.querySelectorAll('.filter-checkbox:checked').forEach(cb => {
            cb.checked = false;
        });
        
        if (sortField) sortField.value = this.currentMode === 'entries' ? 'timestamp' : 'created_at';
        if (sortOrder) sortOrder.value = 'desc';
        
        this.updateFiltersAndPreview();
        this.clearResults();
    }

    clearResults() {
        const resultsContainer = document.getElementById('searchResults');
        const resultsCount = document.getElementById('resultsCount');
        const paginationContainer = document.getElementById('searchPagination');
        
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-search display-1"></i>
                    <h4 class="mt-3">Ready to Search</h4>
                    <p>Use the filters above to find what you're looking for</p>
                </div>
            `;
        }
        
        if (resultsCount) resultsCount.textContent = '0';
        if (paginationContainer) paginationContainer.style.display = 'none';
        
        this.currentPage = 1;
    }

    toggleSQLPreview() {
        const previewBody = document.querySelector('.sql-preview-body');
        const toggleButton = document.querySelector('.toggle-sql i');
        
        if (previewBody && toggleButton) {
            const isHidden = previewBody.style.display === 'none';
            previewBody.style.display = isHidden ? 'block' : 'none';
            toggleButton.className = isHidden ? 'bi bi-chevron-up' : 'bi bi-chevron-down';
        }
    }

    exportResults() {
        console.log('Export functionality would be implemented here');
        this.showError('Export functionality coming soon!');
    }

    showLoading() {
        const searchButton = document.querySelector('.search-btn');
        if (searchButton) {
            searchButton.innerHTML = '<i class="bi bi-hourglass-split"></i> Searching...';
            searchButton.disabled = true;
        }
    }

    hideLoading() {
        const searchButton = document.querySelector('.search-btn');
        if (searchButton) {
            searchButton.innerHTML = '<i class="bi bi-search"></i> Search';
            searchButton.disabled = false;
        }
    }

    showError(message) {
        if (window.showNotification) {
            window.showNotification(message, 'danger');
        } else {
            alert(message);
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}

// Auto-initialize if the advanced search form exists
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('advancedSearchForm')) {
        new AdvancedSearchManager();
    }
});
