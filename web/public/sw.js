const CACHE_NAME = "mosaicstacked-shell-v6";
const CACHE_VERSION_PATTERN = /^mosaicstacked-shell-v(\d+)$/;
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/manifest-light.webmanifest",
  "/manifest-dark.webmanifest",
  "/icons/favicon.svg",
  "/favicon/favicon-transparent-16.png",
  "/favicon/favicon-transparent-32.png",
  "/icons/light/apple-touch-icon-light-180.png",
  "/icons/light/icon-light-192.png",
  "/icons/light/icon-light-512.png",
  "/icons/light/pwa-maskable-light-192.png",
  "/icons/light/pwa-maskable-light-512.png",
  "/icons/dark/apple-touch-icon-dark-180.png",
  "/icons/dark/icon-dark-192.png",
  "/icons/dark/icon-dark-512.png",
  "/icons/dark/pwa-maskable-dark-192.png",
  "/icons/dark/pwa-maskable-dark-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(SHELL_ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    // Keep the current cache plus the directly previous one: tabs that were
    // opened before the activation keep being able to lazily load chunks from
    // the previous cache instead of hitting hard 404s (chunk update trap).
    const currentVersion = readCacheVersion(CACHE_NAME);
    await Promise.all(
      cacheNames
        .filter((name) => name !== CACHE_NAME)
        .filter((name) => {
          const version = readCacheVersion(name);
          return version === null || currentVersion === null || version < currentVersion - 1;
        })
        .map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

function readCacheVersion(name) {
  const match = CACHE_VERSION_PATTERN.exec(name);
  return match ? Number.parseInt(match[1], 10) : null;
}

function isHashedBuildAsset(pathname) {
  return pathname.startsWith("/assets/");
}

async function matchInPreviousCaches(request) {
  const cacheNames = await caches.keys();
  const fallbackCaches = cacheNames
    .filter((name) => name !== CACHE_NAME)
    .filter((name) => CACHE_VERSION_PATTERN.test(name))
    .sort((left, right) => readCacheVersion(right) - readCacheVersion(left));

  for (const cacheName of fallbackCaches) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }
  }

  return null;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (
    url.pathname.startsWith("/api/")
    || url.pathname === "/health"
    || url.pathname === "/models"
    || url.pathname === "/chat"
    || url.pathname === "/diagnostics"
    || url.pathname === "/journal/recent"
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put("/index.html", response.clone());
        return response;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match("/index.html")) ?? Response.error();
      }
    })());
    return;
  }

  if (isHashedBuildAsset(url.pathname)) {
    // Hashed build output is immutable: cache-first is correct, but a stale
    // tab may request a chunk that only exists in a previous cache.
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);

      if (cached) {
        return cached;
      }

      const response = await fetch(request);

      if (response.ok) {
        cache.put(request, response.clone());
        return response;
      }

      if (response.status === 404) {
        const previous = await matchInPreviousCaches(request);

        if (previous) {
          return previous;
        }
      }

      return response;
    })());
    return;
  }

  // Unhashed assets (index.html, manifests, icons, fonts, sw.js itself) may
  // change between deployments: network-first so updates are picked up.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    try {
      const response = await fetch(request);

      if (response.ok) {
        cache.put(request, response.clone());
      }

      return response;
    } catch {
      const cached = await cache.match(request);

      if (cached) {
        return cached;
      }

      const previous = await matchInPreviousCaches(request);

      return previous ?? Response.error();
    }
  })());
});
