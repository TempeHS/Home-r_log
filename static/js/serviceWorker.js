// pwa stuff
const CACHE_NAME = 'devlog-v1';

// these urls must match routes
const URLS_TO_CACHE = [
    '/',
    '/static/css/style.css',
    '/static/js/app.js',
    '/static/js/auth.js',
    '/static/js/logEntry.js',
    '/privacy',
    '/login',
    '/search',
    //'/logout',
    //etc..
    '/static/css/bootstrap.min.css',
    '/static/js/bootstrap.bundle.min.js',
    '/static/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(URLS_TO_CACHE))
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
    // Don't cache API calls
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(response => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200) {
                        return response;
                    }
                    
                    // Clone the response since we need to use it twice
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                        
                    return response;
                });
            })
    );
});

// Handle push notifications
self.addEventListener('push', event => {
    const options = {
        body: event.data.text(),
        icon: '/static/images/icons/icon-192x192.png',
        badge: '/static/images/icons/badge-72x72.png'
    };

    event.waitUntil(
        self.registration.showNotification('Home(r)_Log', options)
    );
});