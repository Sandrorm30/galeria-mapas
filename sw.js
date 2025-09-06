const CACHE_NAME = 'mapas-ppa-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/styles.css',
  '/login-styles.css',
  '/script.js',
  '/auth.js',
  '/pwa.js',
  '/manifest.json',
  '/icons/android-chrome-192x192.png',
  '/icons/android-chrome-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon-16x16.png',
  '/icons/favicon.ico'
];

// Estratégias de cache diferentes para diferentes tipos de conteúdo
const CACHE_STRATEGIES = {
  // Cache first para recursos estáticos
  CACHE_FIRST: 'cache-first',
  // Network first para dados dinâmicos
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate para imagens
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('💾 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache aberto:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Todos os recursos foram cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Erro ao cachear recursos:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker ativado');
      return self.clients.claim();
    })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Ignorar requisições para outras origens (Google Sheets, Dropbox, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }
  
  event.respondWith(
    handleRequest(event.request)
  );
});

// Lógica principal de tratamento de requisições
async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Estratégia Cache First para recursos estáticos
    if (isCacheFirstResource(pathname)) {
      return await cacheFirst(request);
    }
    
    // Estratégia Network First para páginas HTML
    if (isNetworkFirstResource(pathname)) {
      return await networkFirst(request);
    }
    
    // Estratégia padrão: tentar rede, fallback para cache
    return await networkWithCacheFallback(request);
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return await getOfflinePage();
  }
}

// Identificar recursos que devem usar Cache First
function isCacheFirstResource(pathname) {
  const cacheFirstExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.ico'];
  return cacheFirstExtensions.some(ext => pathname.endsWith(ext)) || 
         pathname === '/manifest.json';
}

// Identificar recursos que devem usar Network First
function isNetworkFirstResource(pathname) {
  return pathname.endsWith('.html') || pathname === '/';
}

// Estratégia Cache First
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, networkResponse.clone());
  return networkResponse;
}

// Estratégia Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Estratégia de fallback
async function networkWithCacheFallback(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Página offline
async function getOfflinePage() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - Mapas PPA</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
                color: white;
                text-align: center;
            }
            .offline-container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                padding: 40px;
                max-width: 400px;
            }
            .offline-icon {
                font-size: 4rem;
                margin-bottom: 20px;
            }
            .offline-title {
                font-size: 1.5rem;
                margin-bottom: 15px;
            }
            .offline-message {
                margin-bottom: 25px;
                opacity: 0.9;
            }
            .retry-btn {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 10px;
                padding: 12px 24px;
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .retry-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        </style>
    </head>
    <body>
        <div class="offline-container">
            <div class="offline-icon">📱</div>
            <h1 class="offline-title">Você está offline</h1>
            <p class="offline-message">
                Não foi possível conectar à internet. 
                Alguns recursos podem não estar disponíveis.
            </p>
            <button class="retry-btn" onclick="window.location.reload()">
                Tentar novamente
            </button>
        </div>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Executando sincronização em background');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implementar lógica de sincronização se necessário
  console.log('📊 Sincronização completada');
}

// Push notifications (opcional)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: data.data || {}
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Clique em notificações
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.openWindow('/')
  );
});

console.log('🚀 Service Worker carregado');

