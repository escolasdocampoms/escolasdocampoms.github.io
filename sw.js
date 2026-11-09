// Escolas do Campo MS — funciona sem internet depois da primeira visita.
// A página é buscada na rede primeiro (para receber atualizações); sem rede, usa a cópia guardada.
const CACHE = 'escolas-campo-v9';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192-v2.png', 'icon-512-v2.png', 'icon-180-v2.png', 'fonts/rawline-400.woff2', 'fonts/rawline-600.woff2', 'fonts/rawline-700.woff2', 'fonts/rawline-800.woff2', 'fonts/rawline-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(CORE.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const page = req.mode === 'navigate' || (url.origin === location.origin && /\/(index\.html)?$/.test(url.pathname));
  if (page) {
    e.respondWith(fetch(req, {cache: 'no-cache'}).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put('index.html', cp)); return r; })
      .catch(() => caches.match('index.html').then((r) => r || caches.match('./'))));
    return;
  }
  // demais arquivos (d3, fontes, ícones): cópia guardada primeiro, rede como reserva
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); }
    return r;
  })));
});
