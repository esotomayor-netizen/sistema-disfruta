// Cola de muestreos guardados en el celular cuando no hay señal en el huerto.
// Se usa IndexedDB (no localStorage) porque los muestreos llevan fotos y
// localStorage tiene un límite de pocos MB. La cola se envía sola cuando
// vuelve la conexión (ver components/muestreo/ColaMuestreos.tsx).

const DB = 'dlc-muestreos'
const STORE = 'pendientes'
export const EVENTO_COLA = 'cola-muestreos-cambio'

export interface Pendiente {
  clienteId: string
  creado: number
  datos: Record<string, unknown> & { variedad?: string; productor?: string }
  ultimoError?: string
}

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'clienteId' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(modo: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await abrir()
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, modo)
    const req = fn(t.objectStore(STORE))
    t.oncomplete = () => { db.close(); resolve(req.result) }
    t.onerror = () => { db.close(); reject(t.error) }
  })
}

function avisar() {
  try { window.dispatchEvent(new Event(EVENTO_COLA)) } catch {}
}

export async function encolar(p: Pendiente) {
  await tx('readwrite', (s) => s.put(p))
  avisar()
}

export async function listarPendientes(): Promise<Pendiente[]> {
  try {
    const todos = await tx<Pendiente[]>('readonly', (s) => s.getAll() as IDBRequest<Pendiente[]>)
    return todos.sort((a, b) => a.creado - b.creado)
  } catch {
    return []
  }
}

async function quitar(clienteId: string) {
  await tx('readwrite', (s) => s.delete(clienteId))
}

export async function descartarPendiente(clienteId: string) {
  await quitar(clienteId)
  avisar()
}

export function nuevoClienteId() {
  try { return crypto.randomUUID() } catch {}
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// Error de red (sin señal) vs. respuesta del servidor. Solo los de red se
// encolan; un error de validación se muestra al inspector.
export function esErrorDeRed(e: unknown) {
  return e instanceof TypeError || (typeof navigator !== 'undefined' && navigator.onLine === false)
}

let enviando = false

// Envía los pendientes en orden. Devuelve cuántos se enviaron y si falta
// iniciar sesión (la sesión pudo vencer mientras el celular estaba sin señal).
export async function enviarPendientes(): Promise<{ enviados: number; restantes: number; requiereSesion: boolean }> {
  if (enviando) return { enviados: 0, restantes: (await listarPendientes()).length, requiereSesion: false }
  enviando = true
  let enviados = 0
  let requiereSesion = false
  try {
    for (const p of await listarPendientes()) {
      let res: Response
      try {
        res = await fetch('/api/muestreos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...p.datos, clienteId: p.clienteId }),
        })
      } catch {
        break // sigue sin señal
      }
      const json = res.headers.get('content-type')?.includes('application/json')
      if (res.status === 401 || res.redirected || !json) { requiereSesion = true; break }
      if (res.ok) {
        await quitar(p.clienteId)
        enviados++
        continue
      }
      const j = await res.json().catch(() => ({}))
      await tx('readwrite', (s) => s.put({ ...p, ultimoError: j.error || `Error ${res.status}` }))
    }
  } finally {
    enviando = false
    avisar()
  }
  return { enviados, restantes: (await listarPendientes()).length, requiereSesion }
}
