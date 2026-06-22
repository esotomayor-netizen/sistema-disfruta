'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Usuario { id: number; nombre: string; apellido: string; activo: boolean }
interface Predio { id: number; nombre: string; cultivos: { cultivo: string }[]; latitud: number | null; longitud: number | null }
interface AgendaVisita {
  id: number
  fecha: string
  notas: string | null
  predio: Predio
  tecnico: Usuario
}
interface CheckIn {
  id: number
  fecha: string
  latitud: number
  longitud: number
  notas: string | null
  agendaId: number | null
  predio: Predio | null
  agenda: { id: number; predio: Predio } | null
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function rutaKm(puntos: { lat: number; lon: number }[]) {
  let total = 0
  for (let i = 0; i < puntos.length - 1; i++) {
    total += haversineKm(puntos[i].lat, puntos[i].lon, puntos[i + 1].lat, puntos[i + 1].lon)
  }
  return total * 1.35
}

export default function CheckInPage() {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)

  const [tecnicos, setTecnicos] = useState<Usuario[]>([])
  const [tecnicoId, setTecnicoId] = useState('')
  const [agenda, setAgenda] = useState<AgendaVisita[]>([])
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [gpsLoading, setGpsLoading] = useState(false)
  const [notas, setNotas] = useState('')
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaVisita | null>(null)
  const [marcando, setMarcando] = useState(false)
  const [kmDia, setKmDia] = useState(0)

  useEffect(() => {
    fetch('/api/equipo')
      .then((r) => r.json())
      .then((u: Usuario[]) => setTecnicos(u.filter((x) => x.activo)))
  }, [])

  useEffect(() => {
    if (!tecnicoId) { setAgenda([]); setCheckins([]); return }
    Promise.all([
      fetch(`/api/agenda?fecha=${today}&tecnicoId=${tecnicoId}`).then((r) => r.json()),
      fetch(`/api/checkins?fecha=${today}&tecnicoId=${tecnicoId}`).then((r) => r.json()),
    ]).then(([a, c]) => {
      setAgenda(a as AgendaVisita[])
      const cs = c as CheckIn[]
      setCheckins(cs)
      if (cs.length >= 2) {
        const puntos = cs.map((x) => ({ lat: x.latitud, lon: x.longitud }))
        setKmDia(Math.round(rutaKm(puntos) * 10) / 10)
      } else {
        setKmDia(0)
      }
    })
  }, [tecnicoId, today])

  const marcarLlegada = (agendaItem: AgendaVisita | null) => {
    if (!navigator.geolocation) return alert('GPS no disponible en este dispositivo')
    setGpsLoading(true)
    setMarcando(true)
    if (agendaItem) setSelectedAgenda(agendaItem)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGpsLoading(false)
        const body = {
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          notas: notas || null,
          tecnicoId,
          predioId: agendaItem?.predio.id ?? null,
          agendaId: agendaItem?.id ?? null,
        }
        const res = await fetch('/api/checkins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          const nuevo = await res.json() as CheckIn
          setCheckins((prev) => {
            const next = [...prev, nuevo]
            if (next.length >= 2) {
              const puntos = next.map((x) => ({ lat: x.latitud, lon: x.longitud }))
              setKmDia(Math.round(rutaKm(puntos) * 10) / 10)
            }
            return next
          })
          setNotas('')
          setSelectedAgenda(null)
          setMarcando(false)
        } else {
          alert('Error al registrar check-in')
          setMarcando(false)
        }
      },
      () => {
        alert('No se pudo obtener la ubicación GPS')
        setGpsLoading(false)
        setMarcando(false)
        setSelectedAgenda(null)
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const eliminarCheckin = async (id: number) => {
    await fetch(`/api/checkins/${id}`, { method: 'DELETE' })
    setCheckins((prev) => {
      const next = prev.filter((c) => c.id !== id)
      if (next.length >= 2) {
        const puntos = next.map((x) => ({ lat: x.latitud, lon: x.longitud }))
        setKmDia(Math.round(rutaKm(puntos) * 10) / 10)
      } else {
        setKmDia(0)
      }
      return next
    })
  }

  const agendaCheckeada = new Set(checkins.map((c) => c.agendaId).filter(Boolean))

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-primary-900 text-white px-4 pt-safe-top pb-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Check-In GPS</h1>
            <p className="text-primary-300 text-xs">
              {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          {kmDia > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-100">{kmDia}</p>
              <p className="text-primary-400 text-xs">km hoy</p>
            </div>
          )}
        </div>
        <select
          className="w-full bg-primary-800 text-white border border-primary-700 rounded-lg px-3 py-2 text-sm"
          value={tecnicoId}
          onChange={(e) => setTecnicoId(e.target.value)}
        >
          <option value="">Seleccionar técnico…</option>
          {tecnicos.map((u) => (
            <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
          ))}
        </select>
      </div>

      {tecnicoId && (
        <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">

          {/* Agenda del día */}
          {agenda.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Agenda de hoy ({agenda.length} visitas)
              </h2>
              <div className="space-y-2">
                {agenda.map((a) => {
                  const done = agendaCheckeada.has(a.id)
                  return (
                    <div
                      key={a.id}
                      className={`rounded-xl border-2 p-3 flex items-center gap-3 transition-colors ${
                        done
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        done ? 'bg-green-100' : 'bg-primary-100'
                      }`}>
                        {done ? (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{a.predio.nombre}</p>
                        <p className="text-xs text-gray-500">{a.predio.cultivos.map((c) => c.cultivo).join(', ') || '—'}</p>
                        {a.notas && <p className="text-xs text-gray-400 truncate">{a.notas}</p>}
                      </div>
                      {!done && (
                        <button
                          onClick={() => marcarLlegada(a)}
                          disabled={marcando}
                          className="flex-shrink-0 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50 active:scale-95 transition-transform"
                        >
                          {gpsLoading && selectedAgenda?.id === a.id ? (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              GPS…
                            </span>
                          ) : 'Llegué'}
                        </button>
                      )}
                      {done && (
                        <button
                          onClick={() => router.push(`/visitas/nueva?predioId=${a.predio.id}&tecnicoId=${tecnicoId}`)}
                          className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 rounded-lg active:scale-95 transition-transform"
                        >
                          Visita
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Check-in manual (sin agenda) */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Marcar posición libre</h2>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
              rows={2}
              placeholder="Nota opcional (ej: Llegué al fundo, combustible, etc.)"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
            <button
              onClick={() => marcarLlegada(null)}
              disabled={marcando}
              className="mt-2 w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-transform"
            >
              {gpsLoading && !selectedAgenda ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Obteniendo GPS…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Marcar posición GPS
                </>
              )}
            </button>
          </div>

          {/* Trail del día */}
          {checkins.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Puntos marcados hoy
                </h2>
                {kmDia > 0 && (
                  <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-1 rounded-full">
                    {kmDia} km GPS
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {checkins.map((c, i) => (
                  <div key={c.id} className="bg-white rounded-lg border border-gray-200 px-3 py-2 flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary-700 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {c.agenda?.predio.nombre || c.predio?.nombre || 'Posición libre'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatHora(c.fecha)} · {c.latitud.toFixed(5)}, {c.longitud.toFixed(5)}
                      </p>
                      {c.notas && <p className="text-xs text-gray-400 truncate">{c.notas}</p>}
                    </div>
                    <button
                      onClick={() => eliminarCheckin(c.id)}
                      className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"
                      title="Eliminar punto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {kmDia === 0 && checkins.length === 1 && (
                <p className="text-xs text-gray-400 text-center mt-2">
                  Marca otro punto para calcular distancia
                </p>
              )}
            </div>
          )}

          {agenda.length === 0 && checkins.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm">Sin agenda ni puntos para hoy</p>
            </div>
          )}
        </div>
      )}

      {!tecnicoId && (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">Selecciona un técnico para comenzar</p>
          </div>
        </div>
      )}
    </div>
  )
}
