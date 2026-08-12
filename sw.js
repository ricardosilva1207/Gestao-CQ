/**
 * sw.js — Service Worker do Dashboard Metrologia
 *
 * Estratégias:
 *  - /api/  → SEMPRE rede (dados ao vivo; nunca cacheia medições/solicitações)
 *  - /data/ → network-first com fallback ao cache (dados frescos, mas funciona offline)
 *  - shell estático (html/css/js/img) → cache-first com atualização em background
 *
 * Bump CACHE_VERSION para forçar atualização dos clientes.
 */
const CACHE_VERSION = 'metrologia-v9';
const SHELL_CACHE   = `${CACHE_VERSION}-shell`;
const DATA_CACHE    = `${CACHE_VERSION}-data`;

// App shell mínimo — garante carregamento offline da página principal
const SHELL_ASSETS = [
  './',
  './index.html',
  './solicitar-analise.html',
  './manifest.json',
  './css/global.css',
  './css/dashboard.css',
  './css/cards.css',
  './css/charts.css',
  './css/responsive.css',
  // Módulos JS — app.js é um ES module que importa toda a árvore abaixo;
  // sem eles o carregamento offline quebra nos import estáticos.
  './js/app.js',
  './js/utils.js',
  './js/storage.js',
  './js/api.js',
  './js/initAnaliseExtra.js',
  './components/Sidebar.js',
  './components/Header.js',
  './components/Ticker.js',
  './components/KpiGrid.js',
  './components/ChartPanel.js',
  './components/EditDrawer.js',
  './components/AnalisePeriodicaPage.js',
  './components/AnaliseExtraModal.js',
  './components/CronogramaPage.js',
  './components/NormasPage.js',
  './components/HinpyouPage.js',
  './components/DesenhosPage.js',
  './components/HistoricoPeriodicaPage.js',
  './components/PlaceholderPage.js',
  './toyota-logo.png.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      // addAll falha se 1 recurso faltar; usamos add individual tolerante a erro
      .then(cache => Promise.allSettled(SHELL_ASSETS.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !k.startsWith(CACHE_VERSION)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Apenas mesma origem
  if (url.origin !== self.location.origin) return;

  // 1. API → somente rede, sem cache (dados ao vivo)
  if (url.pathname.startsWith('/api/')) {
    return; // deixa o navegador tratar normalmente
  }

  // 2. /data/ → network-first com fallback ao cache
  if (url.pathname.includes('/data/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 3. Código da aplicação (HTML/JS/CSS) e navegações → network-first
  //    Garante que atualizações de código sejam aplicadas imediatamente quando
  //    online; o cache só é usado como fallback offline.
  if (request.mode === 'navigate' || /\.(?:html|js|css)$/.test(url.pathname)) {
    // bypass do cache HTTP do navegador → sempre código mais recente quando online
    event.respondWith(networkFirst(request, SHELL_CACHE, true));
    return;
  }

  // 4. Demais estáticos (imagens, fontes...) → cache-first
  event.respondWith(cacheFirst(request));
});

/** Network-first: tenta rede, salva cópia, cai pro cache se offline */
async function networkFirst(request, cacheName = DATA_CACHE, bypassHttpCache = false) {
  try {
    const res = await fetch(bypassHttpCache ? new Request(request.url, { cache: 'reload' }) : request);
    if (res && res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error('Offline e sem cache para ' + request.url);
  }
}

/** Cache-first: serve do cache e atualiza em background (stale-while-revalidate) */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then(res => {
    if (res && res.ok) {
      caches.open(SHELL_CACHE).then(cache => cache.put(request, res.clone()));
    }
    return res;
  }).catch(() => cached);

  return cached || fetchPromise;
}
