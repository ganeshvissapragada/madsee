const CACHE_NAME = 'blogsphere-v2';
const STATIC_CACHE = 'blogsphere-static-v2';
const DYNAMIC_CACHE = 'blogsphere-dynamic-v2';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/vite.svg'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - comprehensive caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Serving from cache:', request.url);
          return cachedResponse;
        }

        // Fetch from network and cache the response
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache if not a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response
            const responseToCache = networkResponse.clone();

            // Determine which cache to use
            let cacheName = DYNAMIC_CACHE;
            
            // Cache static assets in static cache
            if (STATIC_ASSETS.includes(url.pathname) || 
                request.url.includes('.js') || 
                request.url.includes('.css') || 
                request.url.includes('.png') || 
                request.url.includes('.jpg') || 
                request.url.includes('.svg') ||
                request.url.includes('.ico')) {
              cacheName = STATIC_CACHE;
            }

            // Cache the response
            caches.open(cacheName)
              .then((cache) => {
                console.log('Caching new resource:', request.url);
                cache.put(request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            console.log('Network failed, serving offline page for:', request.url);
            
            // Return offline page for navigation requests
            if (request.destination === 'document') {
              return caches.match('/') || caches.match('/index.html');
            }
            
            // Return a basic response for other requests
            return new Response('Offline - Content not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Push event for notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New blog post available!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Read Now',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192.png'
      }
    ],
    requireInteraction: true,
    tag: 'blog-notification'
  };

  event.waitUntil(
    self.registration.showNotification('BlogSphere', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === self.location.origin + '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'blog-sync') {
    event.waitUntil(
      // Handle offline blog posts sync when back online
      syncOfflineBlogs()
    );
  }
});

// Sync offline blogs (placeholder for future implementation)
function syncOfflineBlogs() {
  return new Promise((resolve) => {
    console.log('Syncing offline blogs...');
    // This would sync any offline-created blogs when back online
    resolve();
  });
}

// Message handling for communication with main app
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    caches.keys().then((cacheNames) => {
      event.ports[0].postMessage({
        type: 'CACHE_STATUS',
        caches: cacheNames,
        isOnline: navigator.onLine
      });
    });
  }
});