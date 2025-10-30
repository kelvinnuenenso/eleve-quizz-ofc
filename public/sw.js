// Service Worker Otimizado - Elevado Quizz v3.1
const CACHE_VERSION = 'v3.1';
const STATIC_CACHE = `elevado-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `elevado-dynamic-${CACHE_VERSION}`;
const VENDOR_CACHE = `elevado-vendor-${CACHE_VERSION}`;

// Arquivos estáticos críticos (HTML, CSS)
const STATIC_FILES = [
  '/',
  '/manifest.json',
];

// Padrões de vendor chunks (cache permanente)
const VENDOR_PATTERNS = [
  /vendor-react.*\.js$/,
  /vendor-ui.*\.js$/,
  /vendor-motion.*\.js$/,
  /vendor-utils.*\.js$/,
];

// Padrões de assets (imagens, fonts)
const ASSET_PATTERNS = [
  /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
];

// Install event - preparar caches
self.addEventListener('install', (event) => {
  console.log(`[SW v${CACHE_VERSION}] Installing...`);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .catch((error) => {
        console.warn('[SW] Failed to pre-cache:', error);
      })
  );
  
  // Ativar imediatamente
  self.skipWaiting();
});

// Activate event - limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log(`[SW v${CACHE_VERSION}] Activating...`);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Manter apenas caches da versão atual
            return !cacheName.includes(CACHE_VERSION);
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Assumir controle imediatamente
  self.clients.claim();
});

// Fetch event - estratégia de cache otimizada
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip Supabase API requests (sempre buscar fresh data)
  if (url.hostname.includes('supabase.co')) return;
  
  event.respondWith(
    handleFetch(request)
  );
});

async function handleFetch(request) {
  const url = new URL(request.url);
  
  // Ignore chrome-extension and other unsupported schemes
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return fetch(request);
  }
  
  // Estratégia 1: Vendor chunks - Cache First (permanente)
  if (VENDOR_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return cacheFirst(request, VENDOR_CACHE);
  }
  
  // Estratégia 2: Assets (images, fonts) - Cache First
  if (ASSET_PATTERNS.some(pattern => pattern.test(url.href))) {
    return cacheFirst(request, DYNAMIC_CACHE);
  }
  
  // Estratégia 3: HTML, CSS, JS - Network First com fallback
  if (url.pathname.endsWith('.html') || 
      url.pathname.endsWith('.css') || 
      url.pathname.endsWith('.js') ||
      url.pathname === '/') {
    return networkFirst(request, DYNAMIC_CACHE);
  }
  
  // Estratégia 4: Tudo mais - Network First
  return networkFirst(request, DYNAMIC_CACHE);
}

// Cache First: Tenta cache, depois network
async function cacheFirst(request, cacheName) {
  // Ignore chrome-extension and other unsupported schemes
  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return fetch(request);
  }
  
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('[SW] Fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network First: Tenta network, fallback para cache
async function networkFirst(request, cacheName) {
  // Ignore chrome-extension and other unsupported schemes
  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return fetch(request);
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Fallback offline para navegação
    if (request.mode === 'navigate') {
      return getOfflinePage();
    }
    
    throw error;
  }
}

// Página offline
function getOfflinePage() {
  return new Response(
    `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Elevado Quizz</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
          display: flex; 
          align-items: center; 
          justify-content: center; 
          min-height: 100vh; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 20px;
        }
        .container { 
          max-width: 500px;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        }
        h1 { 
          font-size: 3rem; 
          margin-bottom: 1rem;
        }
        p { 
          font-size: 1.1rem; 
          line-height: 1.6;
          margin-bottom: 2rem;
          opacity: 0.95;
        }
        button {
          background: white;
          color: #667eea;
          border: none;
          padding: 14px 32px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📱</h1>
        <h2>Você está offline</h2>
        <p>Parece que você perdeu a conexão com a internet. Verifique sua conexão e tente novamente.</p>
        <button onclick="window.location.reload()">🔄 Tentar novamente</button>
      </div>
    </body>
    </html>
    `,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    }
  );
}

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'quiz-submission') {
    console.log('[SW] Background sync: quiz-submission');
    event.waitUntil(syncQuizSubmissions());
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Elevado Quizz',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore', title: 'Ver no app',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close', title: 'Fechar',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Elevado Quizz', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/app')
    );
  }
});

// Helper function for background sync
async function syncQuizSubmissions() {
  // This would handle offline quiz submissions
  // For now, it's a placeholder for future implementation
  console.log('[SW] Syncing quiz submissions...');
}
