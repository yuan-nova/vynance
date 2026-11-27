// Service worker Vynance (NFR-04, TSD §8). Ditulis tangan supaya sederhana dan bisa diaudit.
// - Navigasi: jaringan dulu, cadangan index.html dari cache supaya aplikasi tetap terbuka saat offline.
// - Aset build (/assets/*, ikon, font): cache dulu, perbarui di belakang.
// - /api/* tidak pernah di-cache: data keuangan selalu dari server; tulis offline ditangani antrean di aplikasi.

const VERSION = "v1"
const SHELL = `vynance-shell-${VERSION}`
const ASSETS = `vynance-assets-${VERSION}`
const PRECACHE = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL, ASSETS].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return
  const url = new URL(req.url)
  const sameOrigin = url.origin === self.location.origin
  if (sameOrigin && url.pathname.startsWith("/api/")) return

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          void caches.open(SHELL).then((c) => c.put("/", copy))
          return res
        })
        .catch(() => caches.match("/").then((r) => r ?? Response.error())),
    )
    return
  }

  const cacheable =
    (sameOrigin && (url.pathname.startsWith("/assets/") || /\.(png|svg|webmanifest|woff2?)$/.test(url.pathname))) ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  if (!cacheable) return

  event.respondWith(
    caches.open(ASSETS).then(async (cache) => {
      const hit = await cache.match(req)
      const fresh = fetch(req)
        .then((res) => {
          if (res.ok || res.type === "opaque") void cache.put(req, res.clone())
          return res
        })
        .catch(() => hit ?? Response.error())
      return hit ?? fresh
    }),
  )
})
