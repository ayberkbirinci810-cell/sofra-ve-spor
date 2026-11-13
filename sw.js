/* Sofra ve Spor — çevrimdışı önbellek.
   Sayfanın kendisi: önce ağ (her açılışta en güncel sürüm), internet yoksa önbellek.
   Diğer dosyalar: önce önbellek, arkada tazele. */
const SURUM = 'sofraspor-3';
const DOSYALAR = ['./', 'index.html', 'manifest.webmanifest', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(SURUM).then(c => c.addAll(DOSYALAR.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== SURUM).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const page = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  e.respondWith(caches.open(SURUM).then(async c => {
    if (page) {
      try {
        const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 4000);
        const r = await fetch(req.url, { cache: 'no-store', signal: ctl.signal }); clearTimeout(t);
        if (r && r.ok) { c.put('index.html', r.clone()); c.put('./', r.clone()); return r; }
      } catch (err) {}
      return (await c.match('index.html')) || (await c.match('./')) || Response.error();
    }
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || Response.error();
  }));
});
