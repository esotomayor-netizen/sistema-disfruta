'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/Header'
import Link from 'next/link'

interface Usuario { id: number; nombre: string; apellido: string; rol: string; activo: boolean }
interface CumplimientoItem {
  id: number
  fecha: string
  predio: { id: number; nombre: string; cultivo: string }
  tecnico: { id: number; nombre: string; apellido: string }
  notas: string | null
  cumplida: boolean
  visitaId: number | null
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const LS_KEY = 'cumplimiento_usuarioId'

export default function CumplimientoPage() {
  const now = new Date()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null)
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [filtroTecnico, setFiltroTecnico] = useState('')
  const [items, setItems] = useState<CumplimientoItem[]>([])
  const [loading, setLoading] = useState(false)

  const esSupervisor = usuarioActual?.rol === 'SUPERVISOR'

  useEffect(() => {
    fetch('/api/equipo')
      .then((r) => r.json())
      .then((u: Usuario[]) => {
        const activos = u.filter((x) => x.activo)
        setUsuarios(activos)
        const saved = localStorage.getItem(LS_KEY)
        if (saved) {
          const found = activos.find((x) => String(x.id) === saved)
          if (found) setUsuarioActual(found)
        }
      })
  }, [])

  // Al seleccionar usuario, si es técnico auto-filtrar por él
  const handleSeleccionarUsuario = (u: Usuario) => {
    setUsuarioActual(u)
    localStorage.setItem(LS_KEY, String(u.id))
    if (u.rol !== 'SUPERVISOR') {
      setFiltroTecnico(String(u.id))
    } else {
      setFiltroTecnico('')
    }
  }

  const handleCambiarUsuario = () => {
    setUsuarioActual(null)
    localStorage.removeItem(LS_KEY)
    setFiltroTecnico('')
    setItems([])
  }

  const fetchData = useCallback(() => {
    if (!usuarioActual) return
    setLoading(true)
    const params = new URLSearchParams({ month: monthKey(viewDate) })
    const tecId = esSupervisor ? filtroTecnico : String(usuarioActual.id)
    if (tecId) params.set('tecnicoId', tecId)
    fetch(`/api/agenda/cumplimiento?${params}`)
      .then((r) => r.json())
      .then((data) => { setItems(data); setLoading(false) })
  }, [usuarioActual, viewDate, filtroTecnico, esSupervisor])

  useEffect(() => { fetchData() }, [fetchData])

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))

  // Resumen por técnico
  const resumenPorTecnico: Record<number, { tecnico: { id: number; nombre: string; apellido: string }; agendadas: number; cumplidas: number }> = {}
  for (const item of items) {
    if (!resumenPorTecnico[item.tecnico.id]) {
      resumenPorTecnico[item.tecnico.id] = { tecnico: item.tecnico, agendadas: 0, cumplidas: 0 }
    }
    resumenPorTecnico[item.tecnico.id].agendadas++
    if (item.cumplida) resumenPorTecnico[item.tecnico.id].cumplidas++
  }
  const resumen = Object.values(resumenPorTecnico).sort((a, b) =>
    a.tecnico.apellido.localeCompare(b.tecnico.apellido)
  )

  const totalAgendadas = items.length
  const totalCumplidas = items.filter((i) => i.cumplida).length
  const pctGlobal = totalAgendadas > 0 ? Math.round((totalCumplidas / totalAgendadas) * 100) : null

  const porDia: Record<string, CumplimientoItem[]> = {}
  for (const item of items) {
    const dia = item.fecha.slice(0, 10)
    if (!porDia[dia]) porDia[dia] = []
    porDia[dia].push(item)
  }
  const dias = Object.keys(porDia).sort()

  // ── Pantalla de selección de usuario ─────────────────────────────────────
  if (!usuarioActual) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Cumplimiento de Agenda</h1>
            <p className="text-sm text-gray-500 mt-1">Selecciona tu nombre para continuar</p>
          </div>
          <div className="space-y-2">
            {usuarios.map((u) => (
              <button
                key={u.id}
                onClick={() => handleSeleccionarUsuario(u)}
                className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-primary-400 hover:bg-primary-50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-700 font-semibold text-sm">
                  {u.nombre[0]}{u.apellido[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{u.nombre} {u.apellido}</p>
                  <p className="text-xs text-gray-400 capitalize">{u.rol.toLowerCase()}</p>
                </div>
                {u.rol === 'SUPERVISOR' && (
                  <span className="ml-auto text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Global</span>
                )}
              </button>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/agenda" className="text-xs text-gray-400 hover:text-gray-600">← Volver a Agenda</Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Vista principal ───────────────────────────────────────────────────────
  return (
    <div>
      <Header
        title="Cumplimiento de Agenda"
        subtitle={esSupervisor ? 'Vista global — todos los técnicos' : `${usuarioActual.nombre} ${usuarioActual.apellido}`}
        action={
          <div className="flex gap-2 items-center flex-wrap">
            <button onClick={prevMonth} className="btn-secondary px-2 py-1.5 text-sm">←</button>
            <span className="font-semibold text-gray-700 text-sm min-w-[140px] text-center">
              {MESES[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button onClick={nextMonth} className="btn-secondary px-2 py-1.5 text-sm">→</button>
            <button onClick={handleCambiarUsuario} className="btn-secondary text-sm ml-2">
              Cambiar usuario
            </button>
            <Link href="/agenda" className="btn-secondary text-sm">← Agenda</Link>
          </div>
        }
      />

      {/* Filtro técnico — solo supervisores */}
      {esSupervisor && (
        <div className="mb-6 max-w-xs">
          <select className="input" value={filtroTecnico} onChange={(e) => setFiltroTecnico(e.target.value)}>
            <option value="">Todos los técnicos</option>
            {usuarios.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>
            ))}
          </select>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Agendadas</p>
          <p className="text-3xl font-bold text-gray-900">{totalAgendadas}</p>
          <p className="text-xs text-gray-400 mt-1">{MESES[viewDate.getMonth()]}</p>
        </div>
        <div className="card py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Cumplidas</p>
          <p className="text-3xl font-bold text-primary-700">{totalCumplidas}</p>
          <p className="text-xs text-gray-400 mt-1">GPS + labores + fotos + aplicación</p>
        </div>
        <div className="card py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Cumplimiento</p>
          <p className={`text-3xl font-bold mt-0 ${
            pctGlobal === null ? 'text-gray-400'
            : pctGlobal >= 80 ? 'text-green-600'
            : pctGlobal >= 50 ? 'text-yellow-600'
            : 'text-red-600'
          }`}>
            {pctGlobal !== null ? `${pctGlobal}%` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {pctGlobal === null ? 'Sin visitas agendadas'
              : pctGlobal >= 80 ? 'Excelente' : pctGlobal >= 50 ? 'Regular' : 'Bajo'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Resumen por técnico — solo si es supervisor o hay más de uno */}
        {(esSupervisor || resumen.length > 1) && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">
              {esSupervisor ? 'Resumen por técnico' : 'Mi resumen'}
            </h3>
            <div className="space-y-2">
              {resumen.length === 0 && (
                <div className="card text-center py-8 text-gray-400 text-sm">Sin visitas agendadas</div>
              )}
              {resumen.map(({ tecnico, agendadas, cumplidas }) => {
                const pct = agendadas > 0 ? Math.round((cumplidas / agendadas) * 100) : 0
                return (
                  <div key={tecnico.id} className="card py-3 px-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900 text-sm">{tecnico.nombre} {tecnico.apellido}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        pct >= 80 ? 'bg-green-100 text-green-700'
                        : pct >= 50 ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                      }`}>{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                      <div
                        className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{cumplidas} de {agendadas} visitas</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Detalle diario */}
        <div className={esSupervisor || resumen.length > 1 ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Detalle por día</h3>
          {loading && <p className="text-sm text-gray-400">Cargando…</p>}
          {!loading && dias.length === 0 && (
            <div className="card text-center py-12 text-gray-400 text-sm">
              No hay visitas agendadas para {MESES[viewDate.getMonth()]}
            </div>
          )}
          <div className="space-y-4">
            {dias.map((dia) => {
              const dayItems = porDia[dia]
              const cumplidas = dayItems.filter((i) => i.cumplida).length
              const fecha = new Date(dia + 'T12:00:00')
              return (
                <div key={dia} className="card p-0 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-700">
                      {fecha.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      cumplidas === dayItems.length ? 'bg-green-100 text-green-700'
                      : cumplidas > 0 ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-500'
                    }`}>
                      {cumplidas}/{dayItems.length} cumplidas
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {dayItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          item.cumplida ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {item.cumplida ? (
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.predio.nombre}</p>
                          {esSupervisor && (
                            <p className="text-xs text-gray-500">{item.tecnico.nombre} {item.tecnico.apellido}</p>
                          )}
                          {item.notas && <p className="text-xs text-gray-400 truncate italic">{item.notas}</p>}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          {item.cumplida && item.visitaId ? (
                            <Link
                              href={`/visitas/${item.visitaId}`}
                              className="text-xs text-primary-600 hover:text-primary-800 underline"
                            >
                              Ver informe
                            </Link>
                          ) : item.cumplida ? (
                            <span className="text-xs text-green-600 font-semibold">Cumplida</span>
                          ) : (
                            <span className="text-xs text-gray-400">Pendiente</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
