// Minimal service worker — just enough to make the app installable and to
// keep the app shell (this HTML file + icons) available if the network
// briefly drops. It does NOT cache Firebase/Firestore requests, so stock
// data always stays live and never goes stale from a cache.
const CACHE_NAME = "spica-stock-shell-v2";
const SHELL_FILES = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never touch Firebase/Firestore/Auth calls or any cross-origin API call —
  // those must always go to the network so stock data is always live.
  if (url.origin !== self.location.origin) return;

  // App shell files: try network first (so updates show up), fall back to
  // cache if offline.
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
