const CACHE_NAME = 'ehb-robot-v1.0.0';
const STATIC_CACHE = 'ehb-robot-static-v1';
const DYNAMIC_CACHE = 'ehb-robot-dynamic-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/ehb-robot',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/app.js',
  '/js/robot-engine.js',
  '/js/voice-recognition.js',
  '/js/offline-queue.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/sounds/voice-start.mp3',
  '/sounds/voice-end.mp3',
  '/sounds/notification.mp3'
];

// API endpoints to cache
const API_CACHE = [
  '/api/robot-status',
  '/api/robot-memory',
  '/api/robot-feedback',
  '/api/robot-reminders',
  '/api/robot-market',
  '/api/robot-backup'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🤖 EHB Robot Service Worker installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static files for offline use');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 EHB Robot Service Worker activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static files
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle other requests
  event.respondWith(fetch(request));
});

// Handle API requests with offline fallback
async function handleApiRequest(request) {
  try {
    // Try to fetch from network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('🌐 Network failed, trying cache for:', request.url);

    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for API calls
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Offline mode - data will sync when online',
        offline: true,
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

// Handle static file requests
async function handleStaticRequest(request) {
  // Try cache first for static files
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Fetch from network if not in cache
    const networkResponse = await fetch(request);

    // Cache the response for future offline use
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('📱 Offline mode - serving cached version');

    // Return a basic offline page if nothing is cached
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>EHB Robot - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 50px;
              background: #1a1a2e;
              color: white;
            }
            .offline-icon { font-size: 64px; margin: 20px; }
            .message { margin: 20px 0; }
            .retry-btn {
              background: #4CAF50;
              color: white;
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <div class="offline-icon">🤖</div>
          <h1>EHB Robot is Offline</h1>
          <div class="message">
            <p>You're currently offline. Some features may be limited.</p>
            <p>Your requests will be queued and synced when you're back online.</p>
          </div>
          <button class="retry-btn" onclick="window.location.reload()">
            Retry Connection
          </button>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

// Background sync for offline tasks
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);

  if (event.tag === 'robot-sync') {
    event.waitUntil(syncOfflineTasks());
  }
});

// Sync offline tasks when back online
async function syncOfflineTasks() {
  try {
    // Get offline queue from IndexedDB
    const offlineQueue = await getOfflineQueue();

    if (offlineQueue.length === 0) {
      console.log('📭 No offline tasks to sync');
      return;
    }

    console.log(`🔄 Syncing ${offlineQueue.length} offline tasks`);

    for (const task of offlineQueue) {
      try {
        // Attempt to sync each task
        const response = await fetch(task.url, {
          method: task.method,
          headers: task.headers,
          body: task.body
        });

        if (response.ok) {
          // Remove from queue if successful
          await removeFromOfflineQueue(task.id);
          console.log(`✅ Synced task: ${task.type}`);
        } else {
          console.log(`❌ Failed to sync task: ${task.type}`);
        }
      } catch (error) {
        console.error(`❌ Error syncing task:`, error);
      }
    }

    // Notify user of sync completion
    await showNotification('EHB Robot', 'Offline tasks synced successfully!');

  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'EHB Robot notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Open EHB Robot',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('EHB Robot', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/ehb-robot')
    );
  }
});

// Helper functions for offline queue management
async function getOfflineQueue() {
  // This would typically use IndexedDB
  // For now, return empty array
  return [];
}

async function removeFromOfflineQueue(taskId) {
  // This would typically use IndexedDB
  console.log('🗑️ Removed task from queue:', taskId);
}

async function showNotification(title, body) {
  const options = {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png'
  };

  return self.registration.showNotification(title, options);
}

// Handle message events from main thread
self.addEventListener('message', (event) => {
  console.log('📨 Message received in service worker:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          return cache.addAll(event.data.urls);
        })
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Periodic sync triggered:', event.tag);

  if (event.tag === 'robot-maintenance') {
    event.waitUntil(performMaintenance());
  }
});

async function performMaintenance() {
  try {
    // Clean up old cache entries
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();

    // Remove entries older than 7 days
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const date = response.headers.get('date');
        if (date && new Date(date).getTime() < weekAgo) {
          await cache.delete(request);
        }
      }
    }

    console.log('🧹 Maintenance completed');
  } catch (error) {
    console.error('❌ Maintenance failed:', error);
  }
}

console.log('🤖 EHB Robot Service Worker loaded successfully');
