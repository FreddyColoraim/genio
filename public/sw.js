// Nomade PWA — Service Worker
// Stratégie : Cache-first pour assets statiques, Network-first pour pages

const CACHE_VERSION = 'nomade-v1';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Assets à pré-cacher au premier install
const PRECACHE_ASSETS = [
  '/terrain',
  '/formation',
  '/terrain/capture',
  '/terrain/contacts',
  '/formation/sessions',
  '/formation/emargement',
  '/icons/nomade-rh.svg',
  '/icons/nomade-formation.svg',
  '/manifest-terrain.json',
  '/manifest-formation.json',
];

// ── Install : pré-cache les assets shell ──────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Certains assets peuvent ne pas être disponibles offline — on ignore
      })
    ).then(() => self.skipWaiting())
  );
});

// ── Activate : nettoyer les anciens caches ────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('nomade-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch : Network-first pour pages, Cache-first pour assets ─────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ne pas intercepter : API routes, auth, Supabase, Stripe
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('stripe') ||
    url.hostname.includes('fonts.googleapis') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Assets statiques (_next/static) → Cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached ?? fetch(event.request).then((res) => {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(event.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // Pages /terrain et /formation → Network-first avec fallback cache
  if (
    url.pathname.startsWith('/terrain') ||
    url.pathname.startsWith('/formation')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(DYNAMIC_CACHE).then((c) => c.put(event.request, clone));
          return res;
        })
        .catch(() =>
          caches.match(event.request).then((cached) =>
            cached ?? caches.match('/terrain') // fallback vers home
          )
        )
    );
    return;
  }
});

// ── Push notifications (optionnel — préparé pour V2) ─────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Nomade', {
      body: data.body ?? '',
      icon: data.icon ?? '/icons/nomade-rh.svg',
      badge: '/icons/nomade-rh.svg',
      data: { url: data.url ?? '/terrain' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url ?? '/terrain')
  );
});
