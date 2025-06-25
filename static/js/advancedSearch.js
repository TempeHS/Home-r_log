
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
            // Ensure body can scroll properly
            this.ensureScrollingEnabled();
            
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
        
        // Determine the filter type based on container ID
        let filterType = '';
        if (containerId === 'projectList') filterType = 'project';
        else if (containerId === 'languageList') filterType = 'language';  
        else if (containerId === 'userList') filterType = 'user';
        
        console.log(`Populating ${containerId} with filter type: ${filterType}`);
        
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
                           value="${item[nameField]}" data-filter-type="${filterType}">
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

        // Initialize query preview toggle (new compact version)
        const queryToggle = document.getElementById('queryPreviewToggle');
        if (queryToggle) {
            queryToggle.addEventListener('click', () => this.toggleQueryPreview());
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
        const validSortFields = ['timestamp', 'likes', 'comments', 'project','created_at', 'entries', 'name','replies'
        ]; // Valid sort field names for security
        const sortFieldInput = document.getElementById('sortField')?.value || 'timestamp';
        this.searchFilters.sortField = validSortFields.includes(sortFieldInput) ? sortFieldInput : 'timestamp';
        this.searchFilters.sortOrder = document.getElementById('sortOrder')?.value || 'desc';
    }

    getSelectedFilterValues(type) {
        console.log(`DEBUG: Looking for checkboxes with data-filter-type="${type}"`);
        const allCheckboxes = document.querySelectorAll(`input[data-filter-type="${type}"]`);
        console.log(`DEBUG: Found ${allCheckboxes.length} elements with data-filter-type="${type}"`);
        
        const checkboxes = document.querySelectorAll(`input[data-filter-type="${type}"]:checked`);
        console.log(`DEBUG: Found ${checkboxes.length} checked checkboxes for type ${type}`);
        
        const values = Array.from(checkboxes).map(cb => {
            console.log(`DEBUG: Checkbox value: ${cb.value}, checked: ${cb.checked}`);
            return cb.value;
        });
        console.log(`Getting selected ${type} values:`, values);
        return values;
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

        // Debug: Log current search filters
        console.log('Current search filters:', this.searchFilters);

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
        let parts = [];
        let conditions = [];
        
        // SELECT clause
        parts.push('<span class="sql-keyword">SELECT</span> <span class="sql-wildcard">*</span> <span class="sql-keyword">FROM</span> <span class="sql-table">entries</span>');
        
        // WHERE conditions
        if (this.searchFilters.text) {
            conditions.push(`<span class="sql-column">content</span> <span class="sql-operator">LIKE</span> <span class="sql-value">'%${this.escapeHtml(this.searchFilters.text)}%'</span>`);
        }
        
        if (this.searchFilters.projects.length > 0) {
            const projects = this.searchFilters.projects.map(p => `'${this.escapeHtml(p)}'`).join(', ');
            conditions.push(`<span class="sql-column">project</span> <span class="sql-operator">IN</span> <span class="sql-value">(${projects})</span>`);
        }
        
        if (this.searchFilters.users.length > 0) {
            const users = this.searchFilters.users.map(u => `'${this.escapeHtml(u)}'`).join(', ');
            conditions.push(`<span class="sql-column">developer</span> <span class="sql-operator">IN</span> <span class="sql-value">(${users})</span>`);
        }
        
        if (this.searchFilters.languages.length > 0) {
            const languages = this.searchFilters.languages.map(l => `'${this.escapeHtml(l)}'`).join(', ');
            conditions.push(`<span class="sql-column">language</span> <span class="sql-operator">IN</span> <span class="sql-value">(${languages})</span>`);
        }
        
        if (this.searchFilters.dateFrom) {
            conditions.push(`<span class="sql-column">date</span> <span class="sql-operator">>=</span> <span class="sql-value">'${this.searchFilters.dateFrom}'</span>`);
        }
        
        if (this.searchFilters.dateTo) {
            conditions.push(`<span class="sql-column">date</span> <span class="sql-operator"><=</span> <span class="sql-value">'${this.searchFilters.dateTo}'</span>`);
        }
        
        if (conditions.length > 0) {
            parts.push('<span class="sql-keyword">WHERE</span> ' + conditions.join(' <span class="sql-operator">AND</span> '));
        }
        
        // ORDER BY
        let orderField = this.searchFilters.sortField === 'timestamp' ? 'date' : this.searchFilters.sortField;
        parts.push(`<span class="sql-keyword">ORDER BY</span> <span class="sql-column">${orderField}</span> <span class="sql-keyword">${this.searchFilters.sortOrder.toUpperCase()}</span>`);
        
        return parts.join('<br>') + '<span class="sql-semicolon">;</span>';
    }

    generateProjectsSQL() {
        let parts = [];
        let conditions = [];
        
        // SELECT clause
        parts.push('<span class="sql-keyword">SELECT</span> <span class="sql-wildcard">*</span> <span class="sql-keyword">FROM</span> <span class="sql-table">projects</span>');
        
        // WHERE conditions
        if (this.searchFilters.text) {
            conditions.push(`(<span class="sql-column">name</span> <span class="sql-operator">LIKE</span> <span class="sql-value">'%${this.escapeHtml(this.searchFilters.text)}%'</span> <span class="sql-operator">OR</span> <span class="sql-column">description</span> <span class="sql-operator">LIKE</span> <span class="sql-value">'%${this.escapeHtml(this.searchFilters.text)}%'</span>)`);
        }
        
        if (this.searchFilters.users.length > 0) {
            const users = this.searchFilters.users.map(u => `'${this.escapeHtml(u)}'`).join(', ');
            conditions.push(`<span class="sql-column">team_members</span> <span class="sql-operator">CONTAINS</span> <span class="sql-value">(${users})</span>`);
        }
        
        if (this.searchFilters.languages.length > 0) {
            const languages = this.searchFilters.languages.map(l => `'${this.escapeHtml(l)}'`).join(', ');
            conditions.push(`<span class="sql-column">languages</span> <span class="sql-operator">CONTAINS</span> <span class="sql-value">(${languages})</span>`);
        }
        
        if (conditions.length > 0) {
            parts.push('<span class="sql-keyword">WHERE</span> ' + conditions.join(' <span class="sql-operator">AND</span> '));
        }
        
        // ORDER BY
        let orderField = this.searchFilters.sortField === 'created_at' ? 'created_date' : this.searchFilters.sortField;
        parts.push(`<span class="sql-keyword">ORDER BY</span> <span class="sql-column">${orderField}</span> <span class="sql-keyword">${this.searchFilters.sortOrder.toUpperCase()}</span>`);
        
        return parts.join('<br>') + '<span class="sql-semicolon">;</span>';
    }

    generateForumsSQL() {
        let parts = [];
        let conditions = [];
        
        // SELECT clause
        parts.push('<span class="sql-keyword">SELECT</span> <span class="sql-wildcard">*</span> <span class="sql-keyword">FROM</span> <span class="sql-table">forums</span>');
        
        // WHERE conditions
        if (this.searchFilters.text) {
            conditions.push(`<span class="sql-column">content</span> <span class="sql-operator">LIKE</span> <span class="sql-value">'%${this.escapeHtml(this.searchFilters.text)}%'</span>`);
        }
        
        if (this.searchFilters.users.length > 0) {
            const users = this.searchFilters.users.map(u => `'${this.escapeHtml(u)}'`).join(', ');
            conditions.push(`<span class="sql-column">author</span> <span class="sql-operator">IN</span> <span class="sql-value">(${users})</span>`);
        }
        
        if (this.searchFilters.languages.length > 0) {
            const languages = this.searchFilters.languages.map(l => `'${this.escapeHtml(l)}'`).join(', ');
            conditions.push(`<span class="sql-column">language</span> <span class="sql-operator">IN</span> <span class="sql-value">(${languages})</span>`);
        }
        
        if (this.searchFilters.projects.length > 0) {
            const projects = this.searchFilters.projects.map(p => `'${this.escapeHtml(p)}'`).join(', ');
            conditions.push(`<span class="sql-column">project</span> <span class="sql-operator">IN</span> <span class="sql-value">(${projects})</span>`);
        }
        
        if (conditions.length > 0) {
            parts.push('<span class="sql-keyword">WHERE</span> ' + conditions.join(' <span class="sql-operator">AND</span> '));
        }
        
        // ORDER BY
        parts.push(`<span class="sql-keyword">ORDER BY</span> <span class="sql-column">created_date</span> <span class="sql-keyword">DESC</span>`);
        
        return parts.join('<br>') + '<span class="sql-semicolon">;</span>';
    }

    async performSearch() {
        this.collectFilterValues();
        console.log('DEBUG: Collected search filters:', this.searchFilters);
        
        try {
            this.showLoading();
            
            let endpoint = '';
            let params = new URLSearchParams();
            
            if (this.searchFilters.text) params.append('text', this.searchFilters.text);
            this.searchFilters.projects.forEach(p => params.append('projects[]', p));
            this.searchFilters.languages.forEach(l => {
                console.log(`DEBUG: Adding language parameter: ${l}`);
                params.append('languages[]', l);
            });
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
            
            console.log(`DEBUG: Final URL: ${endpoint}?${params}`);
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
            resultsTitle.innerHTML = '<i class="bi bi-journal-text"></i> Search Results - Entries';
            resultsCount.textContent = total;
            this.displayEntryResults(data.entries, resultsContainer);
            if (data.pagination) this.displayPagination(data.pagination);
        } else if (this.currentMode === 'projects') {
            resultsTitle.innerHTML = '<i class="bi bi-folder"></i> Search Results - Projects';
            resultsCount.textContent = data.projects.length;
            this.displayProjectResults(data.projects, resultsContainer);
        } else if (this.currentMode === 'forums') {
            resultsTitle.innerHTML = '<i class="bi bi-chat-dots"></i> Search Results - Forums';
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
        const previewBody = document.getElementById('queryPreviewBody');
        const toggleButton = document.querySelector('.toggle-sql');
        const toggleIcon = toggleButton?.querySelector('i');
        
        if (previewBody && toggleButton) {
            const isHidden = previewBody.style.display === 'none' || !previewBody.style.display;
            
            if (isHidden) {
                previewBody.style.display = 'block';
                if (toggleIcon) toggleIcon.className = 'bi bi-chevron-up';
            } else {
                previewBody.style.display = 'none';
                if (toggleIcon) toggleIcon.className = 'bi bi-chevron-down';
            }
        }
    }

    toggleQueryPreview() {
        const previewContent = document.getElementById('queryPreviewContent');
        const toggleButton = document.getElementById('queryPreviewToggle');
        const toggleIcon = toggleButton?.querySelector('.toggle-icon');
        
        if (previewContent && toggleButton) {
            const isHidden = previewContent.style.display === 'none' || !previewContent.style.display;
            
            if (isHidden) {
                previewContent.style.display = 'block';
                toggleButton.classList.add('expanded');
                if (toggleIcon) toggleIcon.className = 'bi bi-chevron-up toggle-icon';
            } else {
                previewContent.style.display = 'none';
                toggleButton.classList.remove('expanded');
                if (toggleIcon) toggleIcon.className = 'bi bi-chevron-down toggle-icon';
            }
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

    ensureScrollingEnabled() {
        // Force enable scrolling on the search page
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        document.body.style.height = 'auto';
        document.documentElement.style.height = 'auto';
        document.body.style.minHeight = '100vh';
        
        // Add classes for CSS targeting
        document.body.classList.add('search-page-body');
        document.documentElement.classList.add('search-page-html');
    }
}

// Auto-initialize if the advanced search form exists
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('advancedSearchForm')) {
        new AdvancedSearchManager();
    }
});
