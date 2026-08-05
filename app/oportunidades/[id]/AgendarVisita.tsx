'use client'

import { useEffect, useState, useCallback } from 'react'

interface Usuario { id: number; nombre: string; apellido: string }
interface AgendaItem { id: number; fecha: string; notas: string | null; tecnico: Usuario }

function toYMD(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function AgendarVisita({
  oportunidadId,
  tecnicoDefaultId,
}: {
  oportunidadId: string
  tecnicoDefaultId: number | null
}) {
  const [agendas, setAgendas] = useState<AgendaItem[]>([])
  const [tecnicos, setTecnicos] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [fecha, setFecha] = useState(toYMD(new Date()))
  const [hora, setHora] = useState('09:00')
  const [tecnicoId, setTecnicoId] = useState('')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const fetchAgendas = useCallback(() => {
    fetch(`/api/agenda?oportunidadId=${oportunidadId}`)
      .then((r) => r.json())
      .then((data) => { setAgendas(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [oportunidadId])

  useEffect(() => { fetchAgendas() }, [fetchAgendas])

  useEffect(() => {
    fetch('/api/equipo')
      .then((r) => r.json())
      .then((data: Usuario[]) => {
        setTecnicos(data)
        setTecnicoId(tecnicoDefaultId ? String(tecnicoDefaultId) : data[0] ? String(data[0].id) : '')
      })
  }, [tecnicoDefaultId])

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tecnicoId) { setError('Selecciona un técnico'); return }
    setGuardando(true)
    setError('')
    try {
      const res = await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, hora, tecnicoId, oportunidadId, notas: notas.trim() || null }),
      })
      if (!res.ok) throw new Error()
      setNotas('')
      setMostrarForm(false)
      fetchAgendas()
    } catch {
      setError('No se pudo agendar la visita')
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta visita agendada?')) return
    await fetch(`/api/agenda/${id}`, { method: 'DELETE' })
    fetchAgendas()
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
          Visitas agendadas
          {agendas.length > 0 && (
            <span className="ml-2 font-normal text-gray-400 normal-case tracking-normal">({agendas.length})</span>
          )}
        </h2>
        {!mostrarForm && (
          <button onClick={() => setMostrarForm(true)} className="btn-primary text-sm">
            + Agendar visita
          </button>
        )}
      </div>

      {mostrarForm && (
        <form onSubmit={handleGuardar} className="card mb-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input w-full" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hora</label>
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="input w-full" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Técnico</label>
            <select value={tecnicoId} onChange={(e) => setTecnicoId(e.target.value)} className="input w-full">
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notas (opcional)</label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="input w-full"
              placeholder="Objetivo de la visita…"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={guardando} className="btn-primary">
              {guardando ? 'Guardando…' : 'Agendar'}
            </button>
            <button type="button" onClick={() => setMostrarForm(false)} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Cargando…</p>
      ) : agendas.length === 0 ? (
        <div className="card text-center py-8 text-gray-400 text-sm">
          Aún no hay visitas agendadas para esta oportunidad.
        </div>
      ) : (
        <div className="space-y-2">
          {agendas.map((a) => (
            <div key={a.id} className="card py-3 px-4 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm">
                  {new Date(a.fecha).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {' · '}
                  {new Date(a.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{a.tecnico.nombre} {a.tecnico.apellido}</p>
                {a.notas && <p className="text-xs text-gray-400 mt-0.5 italic">{a.notas}</p>}
              </div>
              <button
                onClick={() => handleEliminar(a.id)}
                className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                title="Eliminar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
