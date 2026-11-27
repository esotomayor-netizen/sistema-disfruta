'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EVENTO_COLA, Pendiente, descartarPendiente, enviarPendientes, listarPendientes } from '@/lib/cola-muestreos'

// Aviso fijo con los muestreos guardados en el celular sin señal. Los envía
// solos al volver la conexión, al abrir la app y cada 30 segundos.
export default function ColaMuestreos() {
  const router = useRouter()
  const [pendientes, setPendientes] = useState<Pendiente[]>([])
  const [estado, setEstado] = useState('')
  const [abierto, setAbierto] = useState(false)

  const refrescar = useCallback(async () => setPendientes(await listarPendientes()), [])

  const sincronizar = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return
    if (!(await listarPendientes()).length) return
    setEstado('Enviando…')
    const r = await enviarPendientes()
    if (r.requiereSesion) setEstado('Inicia sesión para enviar los muestreos guardados.')
    else if (r.enviados) setEstado(`${r.enviados} muestreo${r.enviados > 1 ? 's' : ''} enviado${r.enviados > 1 ? 's' : ''}.`)
    else setEstado('')
    if (r.enviados) router.refresh()
    await refrescar()
  }, [refrescar, router])

  useEffect(() => {
    if (typeof indexedDB === 'undefined') return
    refrescar().then(sincronizar)
    const onCambio = () => { refrescar() }
    window.addEventListener(EVENTO_COLA, onCambio)
    window.addEventListener('online', sincronizar)
    const t = setInterval(sincronizar, 30000)
    return () => {
      window.removeEventListener(EVENTO_COLA, onCambio)
      window.removeEventListener('online', sincronizar)
      clearInterval(t)
    }
  }, [refrescar, sincronizar])

  if (!pendientes.length) {
    return estado && !estado.startsWith('Enviando') ? (
      <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-800">✓ {estado}</div>
    ) : null
  }

  return (
    <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">
          📤 {pendientes.length} muestreo{pendientes.length > 1 ? 's' : ''} guardado{pendientes.length > 1 ? 's' : ''} en este teléfono sin enviar
        </span>
        <span className="text-amber-800">{estado || 'Se enviarán solos cuando haya señal.'}</span>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={sincronizar} className="btn-primary py-1.5">Enviar ahora</button>
          <button type="button" onClick={() => setAbierto(!abierto)} className="btn-secondary py-1.5">{abierto ? 'Ocultar' : 'Ver'}</button>
        </div>
      </div>
      {abierto && (
        <ul className="mt-2 divide-y divide-amber-200">
          {pendientes.map((p) => (
            <li key={p.clienteId} className="py-1.5 flex flex-wrap items-center gap-2">
              <span>{new Date(p.creado).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}</span>
              <span className="font-medium">{String(p.datos.variedad ?? '')}</span>
              <span>{String(p.datos.productor ?? '')}</span>
              {p.ultimoError && <span className="text-red-700">· {p.ultimoError}</span>}
              {p.ultimoError && (
                <button type="button" className="ml-auto text-red-700 underline text-xs"
                  onClick={() => { if (confirm('¿Descartar este muestreo guardado? Se perderá.')) descartarPendiente(p.clienteId) }}>
                  Descartar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
