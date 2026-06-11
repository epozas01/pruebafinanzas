// Pulse service worker — cache static assets, network-first for everything else
const CACHE = 'pulse-v1'

self.addEventListener('install', e => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Never intercept API or Firebase traffic
  if (url.origin !== location.origin) return
  if (e.request.method !== 'GET') return

  // Hashed build assets: cache-first (immutable)
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        const copy = res.clone()
        caches.open(CACHE).then(c => c.put(e.request, copy))
        return res
      }))
    )
    return
  }

  // Navigation: network-first, fall back to cached shell when offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone()
        caches.open(CACHE).then(c => c.put('/', copy))
        return res
      }).catch(() => caches.match('/'))
    )
  }
})
