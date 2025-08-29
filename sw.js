// Service Worker for Nashr Foundation Website
// Provides offline functionality and caching for better user experience

const CACHE_NAME = 'nashr-foundation-v1.0.0';
const urlsToCache = [
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
  './youtube.webp'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
