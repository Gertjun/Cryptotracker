// Service worker: app werkt offline; koersen en GitHub-sync gaan altijd via het netwerk.
const CACHE = 'crypto-portfolio-3.17.0';
const SHELL = ['./', 'index.html', 'app.js', 'manifest.json', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  // cache: 'reload' = altijd vers van de server, niet uit de browsercache (GitHub Pages laat bestanden 10 minuten bewaren)
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // API's niet cachen
  // Netwerk eerst (zodat updates direct binnenkomen), cache als terugval.
  // cache: 'no-cache' = altijd bij de server navragen of het bestand veranderd is (klein verzoek als dat niet zo is),
  // anders kan de browser tot 10 minuten een oude app.js teruggeven.
  const req = e.request.mode === 'navigate'
    ? new Request(e.request.url, { cache: 'no-cache', credentials: 'same-origin' })
    : new Request(e.request, { cache: 'no-cache' });
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
