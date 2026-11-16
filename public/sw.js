// Minimal offline support: the app shell and the theme song are kept on the phone after the first visit.
const CACHE = "film-wheel-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  const hashed = url.pathname.startsWith("/assets/") || url.pathname.endsWith(".mp3") || url.pathname.endsWith(".png");
  if (hashed) {
    // cache first: these files never change under the same name
    e.respondWith(caches.open(CACHE).then(async (c) => (await c.match(e.request, { ignoreSearch: true })) || fetch(e.request).then((r) => { if (r.ok && r.status === 200) c.put(e.request, r.clone()); return r; })));
  } else {
    // network first for the page itself, so updates arrive straight away
    e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); } return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("/"))));
  }
});
