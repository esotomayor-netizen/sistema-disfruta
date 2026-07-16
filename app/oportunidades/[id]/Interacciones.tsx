'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

type Interaccion = {
  id: number
  tipo: string
  fecha: string
  resumen: string
  resultado: string | null
  proximaAccion: string | null
  tecnico: { nombre: string; apellido: string }
}

const TIPOS = [
  {
    value: 'LLAMADA',
    label: 'Llamada',
    badge: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-500',
    btnActive: 'border-blue-400 bg-blue-50 text-blue-700 ring-2 ring-blue-300 ring-offset-1',
    btnIdle: 'border-gray-200 text-gray-500 hover:border-gray-300',
    icon: (size: string) => (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  {
    value: 'EMAIL',
    label: 'Email',
    badge: 'bg-purple-100 text-purple-800',
    dot: 'bg-purple-500',
    btnActive: 'border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-300 ring-offset-1',
    btnIdle: 'border-gray-200 text-gray-500 hover:border-gray-300',
    icon: (size: string) => (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    value: 'WHATSAPP',
    label: 'WhatsApp',
    badge: 'bg-green-100 text-green-800',
    dot: 'bg-green-500',
    btnActive: 'border-green-400 bg-green-50 text-green-700 ring-2 ring-green-300 ring-offset-1',
    btnIdle: 'border-gray-200 text-gray-500 hover:border-gray-300',
    icon: (size: string) => (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    value: 'REUNION',
    label: 'Reunión',
    badge: 'bg-orange-100 text-orange-800',
    dot: 'bg-orange-500',
    btnActive: 'border-orange-400 bg-orange-50 text-orange-700 ring-2 ring-orange-300 ring-offset-1',
    btnIdle: 'border-gray-200 text-gray-500 hover:border-gray-300',
    icon: (size: string) => (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    value: 'NOTA',
    label: 'Nota',
    badge: 'bg-gray-100 text-gray-700',
    dot: 'bg-gray-400',
    btnActive: 'border-gray-400 bg-gray-100 text-gray-700 ring-2 ring-gray-300 ring-offset-1',
    btnIdle: 'border-gray-200 text-gray-500 hover:border-gray-300',
    icon: (size: string) => (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
]

function tipoConfig(tipo: string) {
  return TIPOS.find((t) => t.value === tipo) ?? TIPOS[TIPOS.length - 1]
}

function nowLocalInput() {
  const d = new Date()
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export default function Interacciones({ oportunidadId }: { oportunidadId: string }) {
  const { data: session } = useSession()
  const [interacciones, setInteracciones] = useState<Interaccion[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [tipo, setTipo] = useState('LLAMADA')
  const [fecha, setFecha] = useState(nowLocalInput())
  const [resumen, setResumen] = useState('')
  const [resultado, setResultado] = useState('')
  const [proximaAccion, setProximaAccion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const fetchInteracciones = useCallback(() => {
    fetch(`/api/oportunidades/${oportunidadId}/interacciones`)
      .then((r) => r.json())
      .then((data) => { setInteracciones(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [oportunidadId])

  useEffect(() => { fetchInteracciones() }, [fetchInteracciones])

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumen.trim()) { setError('El resumen es requerido'); return }
    const userId = (session?.user as any)?.id
    if (!userId) { setError('No hay sesión activa'); return }
    setGuardando(true)
    setError('')
    try {
      const res = await fetch(`/api/oportunidades/${oportunidadId}/interacciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          fecha,
          resumen: resumen.trim(),
          resultado: resultado.trim() || null,
          proximaAccion: proximaAccion.trim() || null,
          tecnicoId: userId,
        }),
      })
      if (!res.ok) throw new Error()
      setResumen('')
      setResultado('')
      setProximaAccion('')
      setFecha(nowLocalInput())
      setMostrarForm(false)
      fetchInteracciones()
    } catch {
      setError('No se pudo guardar la interacción')
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta interacción?')) return
    await fetch(`/api/oportunidades/${oportunidadId}/interacciones/${id}`, { method: 'DELETE' })
    fetchInteracciones()
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
          Historial de contacto
          {interacciones.length > 0 && (
            <span className="ml-2 font-normal text-gray-400 normal-case tracking-normal">
              ({interacciones.length})
            </span>
          )}
        </h2>
        {!mostrarForm && (
          <button
            onClick={() => { setMostrarForm(true); setError(''); setFecha(nowLocalInput()) }}
            className="btn-primary text-sm"
          >
            + Registrar
          </button>
        )}
      </div>

      {mostrarForm && (
        <form onSubmit={handleGuardar} className="card mb-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Tipo de interacción</label>
            <div className="flex flex-wrap gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                    tipo === t.value ? t.btnActive : t.btnIdle
                  }`}
                >
                  {t.icon('w-4 h-4')}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha y hora</label>
            <input
              type="datetime-local"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="input w-full max-w-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Resumen <span className="text-red-500">*</span>
            </label>
            <textarea
              value={resumen}
              onChange={(e) => setResumen(e.target.value)}
              className="input w-full"
              rows={2}
              placeholder="¿Qué ocurrió? ¿Qué dijo el contacto?"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Resultado (opcional)</label>
            <input
              type="text"
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              className="input w-full"
              placeholder="ej: Interesado, No contestó, Solicitó propuesta…"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Próxima acción (opcional)</label>
            <input
              type="text"
              value={proximaAccion}
              onChange={(e) => setProximaAccion(e.target.value)}
              className="input w-full"
              placeholder="ej: Llamar el viernes, Enviar cotización, Agendar reunión…"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={guardando} className="btn-primary">
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setMostrarForm(false)} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Cargando…</p>
      ) : interacciones.length === 0 ? (
        <div className="card text-center py-10 text-gray-400 text-sm">
          <p>Aún no hay interacciones registradas.</p>
          <p className="text-xs mt-1 text-gray-300">
            Registra llamadas, emails, WhatsApp o reuniones con este contacto.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {interacciones.map((int) => {
            const tc = tipoConfig(int.tipo)
            return (
              <div key={int.id} className="flex gap-3">
                <div className={`w-4 h-4 rounded-full flex-shrink-0 ${tc.dot} mt-1.5 ring-2 ring-white shadow-sm`} />
                <div className="flex-1 card py-3 px-4 group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className={`badge flex-shrink-0 ${tc.badge} flex items-center gap-1`}>
                        {tc.icon('w-3 h-3')}
                        {tc.label}
                      </span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(int.fecha).toLocaleString('es-CL', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400 truncate">
                        {int.tecnico.nombre} {int.tecnico.apellido}
                      </span>
                    </div>
                    <button
                      onClick={() => handleEliminar(int.id)}
                      className="text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5"
                      title="Eliminar"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap leading-relaxed">
                    {int.resumen}
                  </p>

                  {int.resultado && (
                    <p className="text-xs text-gray-500 mt-1.5 italic">
                      Resultado: {int.resultado}
                    </p>
                  )}

                  {int.proximaAccion && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 border border-primary-100 rounded-full px-2.5 py-0.5 font-medium">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        {int.proximaAccion}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
