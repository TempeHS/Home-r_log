import { LogEntry } from './logEntry.js';
import { ReactionManager } from './entryViewer.js';

// Loading Animation Class
class LoadingAnimation {
    constructor() {
        this.loadingOverlay = null;
        this.isActive = false;
        this.createLoadingOverlay();
        this.bindNavigationEvents();
        
        // Don't show loading immediately if initial overlay exists
        const initialOverlay = document.getElementById('initialLoadingOverlay');
        if (!initialOverlay && document.readyState === 'loading') {
            this.show();
        }
    }

    createLoadingOverlay() {
        // Check if initial loading overlay exists and use it
        this.loadingOverlay = document.getElementById('initialLoadingOverlay');
        
        if (this.loadingOverlay) {
            // Use existing initial overlay
            return;
        }

        // Create the loading overlay if it doesn't exist
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.className = 'loading-overlay';
        this.loadingOverlay.id = 'loadingOverlay';

        // Create the sprinkles container
        const sprinklesContainer = document.createElement('div');
        sprinklesContainer.className = 'sprinkles-container';

        // Create sprinkles
        for (let i = 1; i <= 15; i++) {
            const sprinkle = document.createElement('div');
            sprinkle.className = 'sprinkle';
            sprinklesContainer.appendChild(sprinkle);
        }

        // Create the main loading content
        const loadingContent = document.createElement('div');
        loadingContent.className = 'loading-content';

        // Create donut container
        const donutContainer = document.createElement('div');
        donutContainer.className = 'donut-container';

        // Create the SVG element using the like.svg content
        const donutSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        donutSvg.setAttribute('class', 'donut-svg');
        donutSvg.setAttribute('viewBox', '0 0 196.17 140.96');
        donutSvg.innerHTML = `
            <defs>
                <style>
                    .cls-1 { fill: #eb8f23; }
                    .cls-2 { fill: #f68c1f; }
                    .cls-3 { fill: #e17ab1; }
                    .cls-4 { fill: #c2b59b; }
                </style>
            </defs>
            <g>
                <g>
                    <path class="cls-2" d="M82.55.18c43.95-1.84,117.31,9.7,113.48,68.78C189.14,175.12-26.62,159.32,2.74,51.57,12.76,14.81,47.76,1.64,82.55.18ZM51.56,11.41c-13.31,4.47-23.68,9.17-32.83,20.38-9.31,11.41-24.23,44.26,2.9,41.67,7-.67,15.3-8.33,22.61-4.74,8.92,4.38,8.78,25.45,21.27,33.41,18.93,12.06,26.73-13.34,41.02-16.29,19.79-4.09,19.87,19.59,34.28,24.47,7.11,2.41,28.26,1.87,33.78-3.12,5.15-4.66,12.52-20.68,14.19-27.56C206.39,7.06,98.08-4.23,51.56,11.41ZM102.93,92.65c-5.96,3.99-10.78,12.24-18.51,15.76-13.63,6.21-27.04-2.64-33.18-14.87-1.88-3.74-5.8-18.14-8.22-19.61-4.9-2.98-12.28,2.71-16.91,3.98-7.17,1.97-13.5,1.51-19.86-2.48,6.27,51.17,60.53,62.21,103.88,59.68,19.21-1.12,38.78-6.68,54.12-18.44-13.07,1.1-26.18,1.4-35.8-8.92-6.86-7.35-11.98-24.17-25.52-15.11Z"/>
                    <path class="cls-3" d="M51.56,11.41c46.52-15.64,154.82-4.35,137.23,68.21-1.67,6.88-9.04,22.9-14.19,27.56-5.52,4.99-26.67,5.52-33.78,3.12-14.41-4.88-14.49-28.56-34.28-24.47-14.29,2.95-22.09,28.35-41.02,16.29-12.49-7.95-12.35-29.02-21.27-33.41-7.31-3.59-15.62,4.07-22.61,4.74-27.13,2.59-12.21-30.26-2.9-41.67,9.14-11.21,19.52-15.9,32.83-20.38ZM87.48,34.94c-9.96,1.37-23.22,10.15-23.06,21.13.34,22.96,32.15,21.66,47.69,16.43,23.16-7.79,10.14-31.16-7.49-36.32-5.64-1.65-11.26-2.04-17.14-1.23ZM168.79,42.69c-3.74,1.11,1.2,6.07,1.91,7.9,3.12,7.93,3.74,16.41.68,24.54-1.24,3.28-6.73,9.31-6.1,11.65.98,3.62,4.42.62,5.9-.91,4.33-4.49,7.95-15.7,8.05-21.86.07-4.71-3.86-23.26-10.44-21.31Z"/>
                    <path class="cls-4" d="M102.93,92.65c13.53-9.06,18.66,7.77,25.52,15.11,9.62,10.31,22.72,10.01,35.8,8.92-15.34,11.76-34.91,17.32-54.12,18.44-43.35,2.53-97.61-8.51-103.88-59.68,6.36,3.99,12.69,4.46,19.86,2.48,4.63-1.27,12.01-6.96,16.91-3.98,2.42,1.47,6.34,15.86,8.22,19.61,6.14,12.23,19.55,21.07,33.18,14.87,7.73-3.52,12.56-11.77,18.51-15.76ZM43.75,109.45c-5.95-1.17-12.5-4.37-15.22-10.1-.77-1.62-2.37-12.17-5.92-7.05s5.03,15.08,8.97,17.92c2.75,1.98,10.96,6.38,12.96,2.01l-.79-2.78Z"/>
                    <path class="cls-1" d="M87.48,34.94c5.87-.81,11.49-.42,17.14,1.23,17.63,5.16,30.65,28.53,7.49,36.32-15.54,5.23-47.34,6.53-47.69-16.43-.16-10.97,13.1-19.76,23.06-21.13ZM69.84,59.53c12.51-9.57,27.19-11.31,41.26-4.01,2.02,1.05,4.67,4.13,6.39,4.57,4.09,1.04.23-7.58-.75-9.22-4.24-7.09-15.59-11.33-23.56-11.31-6.95.02-20.38,5.02-22.57,12.26-.82,2.71-1.07,4.88-.78,7.7ZM86.47,56.79c-2.65.45-12.07,4.8-12.62,7.3,4.01,6.38,13.55,6.77,20.33,6.37,2.96-.18,20.32-2.63,20.36-5.45-6.84-7.75-18.14-9.89-28.07-8.21Z"/>
                    <path class="cls-1" d="M168.79,42.69c6.59-1.95,10.51,16.6,10.44,21.31-.1,6.16-3.71,17.37-8.05,21.86-1.48,1.53-4.92,4.53-5.9.91-.63-2.34,4.86-8.36,6.1-11.65,3.06-8.13,2.44-16.6-.68-24.54-.72-1.82-5.65-6.79-1.91-7.9Z"/>
                    <path class="cls-1" d="M43.75,109.45l.79,2.78c-2,4.37-10.21-.03-12.96-2.01-3.94-2.83-12.34-13.06-8.97-17.92,3.55-5.12,5.15,5.42,5.92,7.05,2.72,5.73,9.27,8.93,15.22,10.1Z"/>
                    <path class="cls-4" d="M69.84,59.53c-.29-2.82-.04-4.99.78-7.7,2.18-7.24,15.62-12.24,22.57-12.26,7.97-.02,19.32,4.22,23.56,11.31.98,1.64,4.84,10.26.75,9.22-1.72-.44-4.37-3.52-6.39-4.57-14.07-7.31-28.75-5.56-41.26,4.01Z"/>
                </g>
            </g>
        `;

        donutContainer.appendChild(donutSvg);

        // Create loading text
        const loadingText = document.createElement('div');
        loadingText.className = 'loading-text';
        loadingText.textContent = 'loading()...';

        // Assemble the loading content
        loadingContent.appendChild(donutContainer);
        loadingContent.appendChild(loadingText);

        // Assemble the overlay
        this.loadingOverlay.appendChild(sprinklesContainer);
        this.loadingOverlay.appendChild(loadingContent);

        // Add to body
        document.body.appendChild(this.loadingOverlay);
    }

    bindNavigationEvents() {
        // Intercept all navigation clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && this.shouldShowLoading(link)) {
                const href = link.getAttribute('href');
                
                // Don't show loading for external links, anchors, or API calls
                if (href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript:') || href.includes('/api/')) {
                    return;
                }

                // Show loading animation
                this.show();
            }
        });

        // Also handle form submissions that redirect
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                const action = form.getAttribute('action');
                const method = form.getAttribute('method') || 'get';
                
                // Only show loading for forms that will navigate to a new page
                if (!action || (!action.includes('/api/') && method.toLowerCase() !== 'post')) {
                    this.show();
                }
            }
        });

        // Hide loading when page is fully loaded
        window.addEventListener('load', () => {
            this.hide();
        });

        // Also hide loading on DOMContentLoaded as backup
        document.addEventListener('DOMContentLoaded', () => {
            this.hide();
        });

        // Hide loading on back/forward navigation
        window.addEventListener('popstate', () => {
            this.hide();
        });

        // Show loading when page starts unloading (navigation away)
        window.addEventListener('beforeunload', () => {
            // Only show if it's a navigation, not a refresh
            if (performance.navigation.type === 1) { // reload
                return;
            }
            this.show();
        });

        // Show loading when user navigates with browser buttons
        window.addEventListener('pagehide', () => {
            this.show();
        });
    }

    shouldShowLoading(link) {
        const href = link.getAttribute('href');
        
        // Don't show loading for:
        // - External links
        // - Anchor links
        // - JavaScript links
        // - API endpoints
        // - Downloads
        // - Links with target="_blank"
        if (!href || 
            href.startsWith('http') || 
            href.startsWith('#') || 
            href.startsWith('javascript:') || 
            href.includes('/api/') ||
            href.includes('download') ||
            link.getAttribute('target') === '_blank') {
            return false;
        }

        return true;
    }

    show() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.loadingOverlay.classList.add('active');
        
        // Disable scrolling
        document.body.style.overflow = 'hidden';
    }

    hide() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.loadingOverlay.classList.remove('active');
        
        // Re-enable scrolling
        document.body.style.overflow = '';
    }

    // Static methods for external use
    static showLoading() {
        const loading = window.loadingAnimation;
        if (loading) {
            loading.show();
        }
    }

    static hideLoading() {
        const loading = window.loadingAnimation;
        if (loading) {
            loading.hide();
        }
    }

    // Create a smaller loading component for specific areas
    static createInlineLoader(container, text = 'loading()...') {
        const loaderDiv = document.createElement('div');
        loaderDiv.setAttribute('class', 'loading-content');
        loaderDiv.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            position: relative;
        `;

        // Create smaller donut
        const donutContainer = document.createElement('div');
        donutContainer.setAttribute('class', 'donut-container');
        donutContainer.style.cssText = `
            width: 60px;
            height: 60px;
            position: relative;
            margin-bottom: 15px;
        `;

        // Create smaller sprinkles container
        const sprinklesContainer = document.createElement('div');
        sprinklesContainer.setAttribute('class', 'sprinkles-container');
        sprinklesContainer.style.cssText = `
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 85px;
            pointer-events: none;
            z-index: 10001;
        `;

        // Create sprinkles for inline loader
        for (let i = 1; i <= 8; i++) {
            const sprinkle = document.createElement('div');
            sprinkle.setAttribute('class', 'mini-sprinkle');
            sprinklesContainer.appendChild(sprinkle);
        }

        // Create smaller donut SVG
        const donutSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        donutSvg.setAttribute('class', 'donut-svg');
        donutSvg.setAttribute('viewBox', '0 0 196.17 140.96');
        donutSvg.style.width = '100%';
        donutSvg.style.height = '100%';
        donutSvg.style.animation = 'donutFloat 3s ease-in-out infinite';
        donutSvg.style.filter = 'drop-shadow(0 5px 10px rgba(255, 140, 0, 0.3))';
        donutSvg.innerHTML = `
            <defs>
                <style>
                    .cls-1 { fill: #eb8f23; }
                    .cls-2 { fill: #f68c1f; }
                    .cls-3 { fill: #e17ab1; }
                    .cls-4 { fill: #c2b59b; }
                </style>
            </defs>
            <g>
                <path class="cls-2" d="M82.55.18c43.95-1.84,117.31,9.7,113.48,68.78C189.14,175.12-26.62,159.32,2.74,51.57,12.76,14.81,47.76,1.64,82.55.18ZM51.56,11.41c-13.31,4.47-23.68,9.17-32.83,20.38-9.31,11.41-24.23,44.26,2.9,41.67,7-.67,15.3-8.33,22.61-4.74,8.92,4.38,8.78,25.45,21.27,33.41,18.93,12.06,26.73-13.34,41.02-16.29,19.79-4.09,19.87,19.59,34.28,24.47,7.11,2.41,28.26,1.87,33.78-3.12,5.15-4.66,12.52-20.68,14.19-27.56C206.39,7.06,98.08-4.23,51.56,11.41ZM102.93,92.65c-5.96,3.99-10.78,12.24-18.51,15.76-13.63,6.21-27.04-2.64-33.18-14.87-1.88-3.74-5.8-18.14-8.22-19.61-4.9-2.98-12.28,2.71-16.91,3.98-7.17,1.97-13.5,1.51-19.86-2.48,6.27,51.17,60.53,62.21,103.88,59.68,19.21-1.12,38.78-6.68,54.12-18.44-13.07,1.1-26.18,1.4-35.8-8.92-6.86-7.35-11.98-24.17-25.52-15.11Z"/>
                <path class="cls-3" d="M51.56,11.41c46.52-15.64,154.82-4.35,137.23,68.21-1.67,6.88-9.04,22.9-14.19,27.56-5.52,4.99-26.67,5.52-33.78,3.12-14.41-4.88-14.49-28.56-34.28-24.47-14.29,2.95-22.09,28.35-41.02,16.29-12.49-7.95-12.35-29.02-21.27-33.41-7.31-3.59-15.62,4.07-22.61,4.74-27.13,2.59-12.21-30.26-2.9-41.67,9.14-11.21,19.52-15.9,32.83-20.38ZM87.48,34.94c-9.96,1.37-23.22,10.15-23.06,21.13.34,22.96,32.15,21.66,47.69,16.43,23.16-7.79,10.14-31.16-7.49-36.32-5.64-1.65-11.26-2.04-17.14-1.23ZM168.79,42.69c-3.74,1.11,1.2,6.07,1.91,7.9,3.12,7.93,3.74,16.41.68,24.54-1.24,3.28-6.73,9.31-6.1,11.65.98,3.62,4.42.62,5.9-.91,4.33-4.49,7.95-15.7,8.05-21.86.07-4.71-3.86-23.26-10.44-21.31Z"/>
                <path class="cls-4" d="M102.93,92.65c13.53-9.06,18.66,7.77,25.52,15.11,9.62,10.31,22.72,10.01,35.8,8.92-15.34,11.76-34.91,17.32-54.12,18.44-43.35,2.53-97.61-8.51-103.88-59.68,6.36,3.99,12.69,4.46,19.86,2.48,4.63-1.27,12.01-6.96,16.91-3.98,2.42,1.47,6.34,15.86,8.22,19.61,6.14,12.23,19.55,21.07,33.18,14.87,7.73-3.52,12.56-11.77,18.51-15.76ZM43.75,109.45c-5.95-1.17-12.5-4.37-15.22-10.1-.77-1.62-2.37-12.17-5.92-7.05s5.03,15.08,8.97,17.92c2.75,1.98,10.96,6.38,12.96,2.01l-.79-2.78Z"/>
                <path class="cls-1" d="M87.48,34.94c5.87-.81,11.49-.42,17.14,1.23,17.63,5.16,30.65,28.53,7.49,36.32-15.54,5.23-47.34,6.53-47.69-16.43-.16-10.97,13.1-19.76,23.06-21.13ZM69.84,59.53c12.51-9.57,27.19-11.31,41.26-4.01,2.02,1.05,4.67,4.13,6.39,4.57,4.09,1.04.23-7.58-.75-9.22-4.24-7.09-15.59-11.33-23.56-11.31-6.95.02-20.38,5.02-22.57,12.26-.82,2.71-1.07,4.88-.78,7.7ZM86.47,56.79c-2.65.45-12.07,4.8-12.62,7.3,4.01,6.38,13.55,6.77,20.33,6.37,2.96-.18,20.32-2.63,20.36-5.45-6.84-7.75-18.14-9.89-28.07-8.21Z"/>
                <path class="cls-1" d="M168.79,42.69c6.59-1.95,10.51,16.6,10.44,21.31-.1,6.16-3.71,17.37-8.05,21.86-1.48,1.53-4.92,4.53-5.9.91-.63-2.34,4.86-8.36,6.1-11.65,3.06-8.13,2.44-16.6-.68-24.54-.72-1.82-5.65-6.79-1.91-7.9Z"/>
                <path class="cls-1" d="M43.75,109.45l.79,2.78c-2,4.37-10.21-.03-12.96-2.01-3.94-2.83-12.34-13.06-8.97-17.92,3.55-5.12,5.15,5.42,5.92,7.05,2.72,5.73,9.27,8.93,15.22,10.1Z"/>
                <path class="cls-4" d="M69.84,59.53c-.29-2.82-.04-4.99.78-7.7,2.18-7.24,15.62-12.24,22.57-12.26,7.97-.02,19.32,4.22,23.56,11.31.98,1.64,4.84,10.26.75,9.22-1.72-.44-4.37-3.52-6.39-4.57-14.07-7.31-28.75-5.56-41.26,4.01Z"/>
            </g>
        `;

        donutContainer.appendChild(sprinklesContainer);
        donutContainer.appendChild(donutSvg);

        // Create loading text
        const loadingText = document.createElement('div');
        loadingText.setAttribute('class', 'loading-text');
        loadingText.textContent = text;
        loadingText.style.cssText = `
            color: var(--yellow);
            font-family: 'Roboto Mono', monospace;
            font-size: 0.9rem;
            margin-top: 10px;
            animation: textPulse 2s ease-in-out infinite;
        `;

        loaderDiv.appendChild(donutContainer);
        loaderDiv.appendChild(loadingText);

        if (container) {
            container.appendChild(loaderDiv);
        }

        return loaderDiv;
    }

    // Remove inline loader
    static removeInlineLoader(loader) {
        if (loader && loader.parentNode) {
            loader.parentNode.removeChild(loader);
        }
    }
}

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
        this.bind2FAEvents();
        this.bindActivityTabs();
        this.loadProfileData();
    }

    showNotification(message, type = 'danger') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} fade show position-fixed top-0 end-0 m-3`;
        notification.style.zIndex = '1060';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    logError(error, context) {
        console.error(`Error in ${context}:`, error);
        this.showNotification(`${context}: ${error.message}`);
    }

    bindApiKeyEvents() {
        const generateBtn = document.getElementById('generateApiKey');
        const regenerateBtn = document.getElementById('regenerateApiKey');

        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.handleGenerateKey());
        }

        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => this.handleRegenerateKey());
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

    bindActivityTabs() {
        const tabs = document.querySelectorAll('#activityTabs .nav-link');
        tabs.forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                const target = e.target.getAttribute('href');
                this.loadTabContent(target);
            });
        });

        // Load initial tab content
        this.loadTabContent('#projects-activity');
    }

    async loadTabContent(tabId) {
        try {
            switch (tabId) {
                case '#projects-activity':
                    await this.loadProjectsActivity();
                    break;
                case '#forum-posts':
                    await this.loadForumPostsActivity();
                    break;
                case '#comments':
                    await this.loadCommentsActivity();
                    break;
            }
        } catch (error) {
            this.logError(error, `Loading tab content for ${tabId}`);
        }
    }

    async loadProjectsActivity() {
        const container = document.getElementById('projectsContainer');
        if (!container) return;

        try {
            const response = await fetch('/api/entries');
            if (!response.ok) throw new Error('Failed to fetch entries');
            
            const entries = await response.json();
            this.displayProjectsActivity(entries, container);
        } catch (error) {
            container.innerHTML = '<div class="alert alert-danger">Failed to load project activity</div>';
            throw error;
        }
    }

    async loadForumPostsActivity() {
        const container = document.getElementById('forumPostsContainer');
        if (!container) return;

        try {
            const response = await fetch('/api/user/forum-posts');
            if (!response.ok) throw new Error('Failed to fetch forum posts');
            
            const posts = await response.json();
            this.displayForumPostsActivity(posts, container);
        } catch (error) {
            container.innerHTML = '<div class="alert alert-danger">Failed to load forum posts</div>';
            throw error;
        }
    }

    async loadCommentsActivity() {
        const container = document.getElementById('commentsContainer');
        if (!container) return;

        try {
            // Fetch both forum comments and entry comments
            const [forumResponse, entryResponse] = await Promise.all([
                fetch('/api/user/forum-comments'),
                fetch('/api/user/entry-comments')
            ]);
            
            if (!forumResponse.ok || !entryResponse.ok) {
                throw new Error('Failed to fetch comments');
            }
            
            const forumComments = await forumResponse.json();
            const entryComments = await entryResponse.json();
            
            this.displayCommentsActivity(forumComments, entryComments, container);
        } catch (error) {
            container.innerHTML = '<div class="alert alert-danger">Failed to load comments</div>';
            throw error;
        }
    }

    displayProjectsActivity(entries, container) {
        const projectGroups = this.groupEntriesByProject(entries);
        
        if (Object.keys(projectGroups).length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-folder-plus"></i> 
                    No project entries yet. <a href="/projects">Create your first project</a> to get started!
                </div>
            `;
            return;
        }

        let html = '';
        Object.entries(projectGroups).forEach(([projectName, projectEntries]) => {
            const visibleEntries = projectEntries.slice(0, 2);
            const hasMore = projectEntries.length > 2;
            
            html += `
                <div class="project-activity-card card mb-3" data-project="${escapeHtml(projectName)}">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0 text-yellow">${escapeHtml(projectName)}</h6>
                            <small class="text-muted">${projectEntries.length} total entries</small>
                        </div>
                        ${hasMore ? `
                            <button class="expand-toggle" type="button" title="Show all entries">
                                <i class="bi bi-chevron-down"></i>
                            </button>
                        ` : ''}
                    </div>
                    <div class="card-body">
                        <div class="visible-entries">
                            ${visibleEntries.map(entry => this.createEntryPreview(entry)).join('')}
                        </div>
                        ${hasMore ? `
                            <div class="hidden-entries" style="display: none;">
                                ${projectEntries.slice(2).map(entry => this.createEntryPreview(entry)).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        this.bindProjectCardEvents();
    }

    createEntryPreview(entry) {
        const date = new Date(entry.timestamp).toLocaleDateString();
        const content = entry.content && entry.content.length > 100 ? 
            entry.content.substring(0, 100) + '...' : 
            (entry.content || 'No content');

        return `
            <div class="project-entry-preview" data-entry-id="${entry.id}">
                <div class="entry-title">${escapeHtml(entry.title || 'Untitled Entry')}</div>
                <div class="entry-content">${escapeHtml(content)}</div>
                <div class="entry-meta">
                    <span>${date}</span>
                    ${entry.time_worked ? `<span class="ms-2">${entry.time_worked} min</span>` : ''}
                </div>
            </div>
        `;
    }

    bindProjectCardEvents() {
        // Handle expand/collapse
        document.querySelectorAll('.expand-toggle').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = button.closest('.project-activity-card');
                const hiddenEntries = card.querySelector('.hidden-entries');
                const isExpanded = card.classList.contains('expanded');

                if (isExpanded) {
                    hiddenEntries.style.display = 'none';
                    card.classList.remove('expanded');
                } else {
                    hiddenEntries.style.display = 'block';
                    card.classList.add('expanded');
                }
            });
        });

        // Handle entry clicks
        document.querySelectorAll('.project-entry-preview').forEach(preview => {
            preview.addEventListener('click', () => {
                const entryId = preview.dataset.entryId;
                if (entryId) {
                    window.location.href = `/entry/${entryId}`;
                }
            });
        });
    }

    groupEntriesByProject(entries) {
        return entries.reduce((groups, entry) => {
            const project = entry.project_name || entry.project || 'Uncategorized';
            if (!groups[project]) {
                groups[project] = [];
            }
            groups[project].push(entry);
            return groups;
        }, {});
    }

    async handleGenerateKey() {
        try {
            const response = await fetch('/api/user/generate-key', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
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
            
        } catch (error) {
            this.logError(error, 'Profile Data Loading');
        }
    }

    displayRecentEntries(entries) {
        // Legacy method - kept for compatibility
        const recentEntries = document.getElementById('recentEntries');
        if (!recentEntries) return;

        if (!entries?.length) {
            recentEntries.innerHTML = '<p>No entries yet</p>';
            return;
        }

        recentEntries.innerHTML = entries.map(entry => createEntryCard(entry)).join('');
    }

    displayForumPostsActivity(posts, container) {
        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-chat-square-text"></i> 
                    No forum posts yet. <a href="/forums">Join the discussion</a> to get started!
                </div>
            `;
            return;
        }

        let html = '';
        posts.forEach(post => {
            const date = new Date(post.created_at).toLocaleDateString();
            html += `
                <div class="forum-post-card card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title mb-0">
                                <a href="${post.topic_url}" class="text-decoration-none text-yellow">
                                    ${escapeHtml(post.title)}
                                </a>
                            </h6>
                            <span class="badge bg-secondary">${post.replies_count} replies</span>
                        </div>
                        <p class="card-text text-muted small mb-2">${escapeHtml(post.content)}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="bi bi-calendar3"></i> ${date} in 
                                <a href="${post.forum_url}" class="text-muted">${escapeHtml(post.forum_name)}</a>
                            </small>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    displayCommentsActivity(forumComments, entryComments, container) {
        const allComments = [];
        
        // Process forum comments
        forumComments.forEach(comment => {
            allComments.push({
                ...comment,
                type: 'forum',
                title: comment.topic_title,
                url: comment.topic_url,
                context: comment.forum_name
            });
        });
        
        // Process entry comments
        entryComments.forEach(comment => {
            allComments.push({
                ...comment,
                type: 'entry',
                title: comment.entry_title,
                url: comment.entry_url,
                context: `${comment.project_name} Project`
            });
        });
        
        // Sort by date (most recent first)
        allComments.sort((a, b) => {
            const dateA = new Date(a.created_at || a.timestamp);
            const dateB = new Date(b.created_at || b.timestamp);
            return dateB - dateA;
        });

        if (allComments.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-chat-dots"></i> 
                    No comments yet. Start engaging with entries and forum discussions!
                </div>
            `;
            return;
        }

        let html = '';
        allComments.forEach(comment => {
            const date = new Date(comment.created_at || comment.timestamp).toLocaleDateString();
            const typeIcon = comment.type === 'forum' ? 'chat-square-text' : 'journal-text';
            const typeLabel = comment.type === 'forum' ? 'Forum' : 'Entry';
            
            html += `
                <div class="comment-card card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title mb-0">
                                <i class="bi bi-${typeIcon}"></i>
                                <a href="${comment.url}" class="text-decoration-none text-yellow ms-1">
                                    ${escapeHtml(comment.title)}
                                </a>
                            </h6>
                            <span class="badge bg-primary">${typeLabel}</span>
                        </div>
                        <p class="card-text mb-2">${escapeHtml(comment.content)}</p>
                        <small class="text-muted">
                            <i class="bi bi-calendar3"></i> ${date} in ${escapeHtml(comment.context)}
                        </small>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
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

// Initialize loading animation
document.addEventListener('DOMContentLoaded', () => {
    window.loadingAnimation = new LoadingAnimation();
});

// Export LoadingAnimation for use in other modules
window.LoadingAnimation = LoadingAnimation;
