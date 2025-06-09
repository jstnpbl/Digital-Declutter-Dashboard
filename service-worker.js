/**
 * Service Worker for Digital Declutter Dashboard
 * Provides offline functionality by caching essential assets
 */

const CACHE_NAME = 'digital-declutter-v1';
const ASSETS_TO_CACHE = [
  '/', // Root path
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

// Install service worker and cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate service worker and clean up old caches
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
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch strategy: Cache first, then network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If resource found in cache, return it
        if (response) {
          return response;
        }
        
        // Otherwise, fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Don't cache API calls or external resources
            if (!event.request.url.startsWith(self.location.origin) || 
                event.request.method !== 'GET') {
              return networkResponse;
            }
            
            // Cache the new resource
            return caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
          })
          .catch(() => {
            // If network fails and resource isn't in cache,
            // return a fallback page for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // Return error for other resource types
            return new Response('Network error occurred', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});