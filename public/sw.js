// Service worker de DLC Export: permite abrir el formulario de muestreo sin
// señal en el huerto. Alcance acotado a propósito:
//  - /_next/static/* (JS, CSS, fuentes con hash): caché primero.
//  - /muestreos/nuevo: red primero; sin señal se sirve la última copia.
//  - /api/predios (lista de predios del formulario): red primero, copia sin señal.
//  - Cualquier otra página sin señal: aviso con enlace al formulario.
// El resto de las peticiones no pasa por el service worker.
const VERSION = 'v1'
const ESTATICOS = `dlc-estaticos-${VERSION}`
const PAGINAS = `dlc-paginas-${VERSION}`
const PAGINAS_OFFLINE = ['/muestreos/nuevo']

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) {
      if (k.startsWith('dlc-') && k !== ESTATICOS && k !== PAGINAS) await caches.delete(k)
    }
    await self.clients.claim()
  })())
})

async function redPrimero(request, cacheName, clave) {
  const cache = await caches.open(cacheName)
  try {
    const res = await fetch(request)
    // No guardar redirecciones (p. ej. al login) ni errores.
    if (res.ok && !res.redirected && res.type === 'basic') await cache.put(clave || request, res.clone())
    return res
  } catch (e) {
    const copia = await cache.match(clave || request)
    if (copia) return copia
    throw e
  }
}

async function cachePrimero(request) {
  const cache = await caches.open(ESTATICOS)
  const copia = await cache.match(request)
  if (copia) return copia
  const res = await fetch(request)
  if (res.ok) await cache.put(request, res.clone())
  return res
}

const PAGINA_SIN_SENAL = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin señal</title>
<style>body{font-family:system-ui,sans-serif;background:#f5f5f4;margin:0;padding:32px 20px;color:#1f2937}
.c{max-width:420px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:24px}
a{display:block;text-align:center;background:#3c5430;color:#fff;padding:14px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:16px}</style>
</head><body><div class="c"><h1 style="font-size:20px;margin:0 0 8px">Sin señal</h1>
<p>Esta página necesita conexión. Puedes registrar un muestreo igual: quedará guardado en el teléfono y se enviará solo cuando vuelva la señal.</p>
<a href="/muestreos/nuevo">Nuevo muestreo (sin señal)</a></div></body></html>`

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cachePrimero(request))
    return
  }

  if (request.mode === 'navigate') {
    if (PAGINAS_OFFLINE.includes(url.pathname)) {
      event.respondWith(redPrimero(request, PAGINAS, url.pathname).catch(() =>
        new Response(PAGINA_SIN_SENAL, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })))
      return
    }
    event.respondWith(fetch(request).catch(() =>
      new Response(PAGINA_SIN_SENAL, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })))
    return
  }

  if (url.pathname === '/api/predios') {
    event.respondWith(redPrimero(request, PAGINAS))
  }
})
