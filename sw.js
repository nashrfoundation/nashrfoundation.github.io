// Service Worker for Nashr Foundation Website
// Optimized for maximum performance and efficient caching

const CACHE_NAME = 'nashr-foundation-v1.1.0';
const STATIC_CACHE = 'nashr-static-v1.1.0';
const DYNAMIC_CACHE = 'nashr-dynamic-v1.1.0';

// Static assets that should be cached immediately
const STATIC_ASSETS = [
  './',
  './index.html',
  './donate.html',
  './admin.html',
  './styles.css',
  './admin-styles.css',
  './admin.js',
  './leaderboard.js',
  './logo.webp',
  './hero_background.webp',
  './hero_background_mobile.webp',
  './facebook_icon.webp',
  './twitter_icon.webp',
  './instagram_icon.webp',
  './tik-tok.webp',
  './youtube.webp',
  './manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - optimized caching strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests and non-HTTP(S) requests
  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Bypass analytics and third-party tracking URLs
  const bypass = url.hostname.includes('google-analytics.com') || 
                 url.hostname.includes('googletagmanager.com') ||
                 url.hostname.includes('fonts.googleapis.com') ||
                 url.hostname.includes('fonts.gstatic.com');
  if (bypass) return;

  // Handle different types of requests with appropriate strategies
  if (event.request.mode === 'navigate') {
    // Navigation requests: Network first with cache fallback
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful navigation responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache for offline support
          return caches.match(event.request);
        })
    );
  } else if (event.request.destination === 'image') {
    // Images: Cache first with network fallback
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request)
            .then(response => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE).then(cache => {
                  cache.put(event.request, responseClone);
                });
              }
              return response;
            });
        })
    );
  } else {
    // Other static assets: Stale-while-revalidate
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          const fetchPromise = fetch(event.request)
            .then(response => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE).then(cache => {
                  cache.put(event.request, responseClone);
                });
              }
              return response;
            })
            .catch(() => cachedResponse);
          
          return cachedResponse || fetchPromise;
        })
    );
  }
});

// Background sync for offline actions (if supported)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications (if implemented)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: './logo.webp',
      badge: './logo.webp',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Helper function for background sync
function doBackgroundSync() {
  // Implement background sync logic here
  return Promise.resolve();
}
