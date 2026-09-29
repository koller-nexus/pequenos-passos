const CACHE_NAME = "pequenos-passos-v3";
const APP_SHELL = [
  "/",
  "/familia",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/fonts/bricolage-grotesque-latin-wght.woff2",
  "/fonts/atkinson-hyperlegible-400.woff2",
  "/fonts/atkinson-hyperlegible-700.woff2",
];

async function cacheCssAssets(cache, cssResponse) {
  const css = await cssResponse.clone().text();
  const urls = [...css.matchAll(/url\((?:["']?)([^"')]+)(?:["']?)\)/g)]
    .map((match) => new URL(match[1], cssResponse.url))
    .filter((url) => url.origin === self.location.origin);

  await Promise.all(
    urls.map(async (url) => {
      const request = new Request(url);
      if (await cache.match(request)) {
        return;
      }

      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response);
      }
    }),
  );
}

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(APP_SHELL);

  const pages = await Promise.all(
    ["/", "/familia"].map(async (path) => {
      const response = await fetch(path, { cache: "reload" });
      if (!response.ok) {
        throw new Error("Não foi possível preparar o aplicativo offline.");
      }

      await cache.put(path, response.clone());
      return response.text();
    }),
  );
  const assetPaths = [
    ...new Set(
      pages.flatMap((html) =>
        [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)].map(
          (match) => match[1],
        ),
      ),
    ),
  ];

  await Promise.all(
    assetPaths.map(async (path) => {
      const response = await fetch(path);
      if (!response.ok) {
        return;
      }

      await cache.put(path, response.clone());
      if (response.headers.get("content-type")?.includes("text/css")) {
        await cacheCssAssets(cache, response);
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match("/offline.html")),
    );
    return;
  }

  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font" ||
    request.destination === "image" ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cachedResponse) =>
          cachedResponse ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
});
