'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/Header'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'

interface Predio { id: number; nombre: string; cultivo: string; empresa: { razonSocial: string } }
interface Usuario { id: number; nombre: string; apellido: string }
interface AgendaItem { id: number; fecha: string; notas: string | null; predio: Predio; tecnico: Usuario }
interface Stat { mes: string; planificadas: number; realizadas: number }

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function toYMD(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export default function AgendaPage() {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [agendas, setAgendas] = useState<AgendaItem[]>([])
  const [stats, setStats] = useState<Stat[]>([])
  const [predios, setPredios] = useState<Predio[]>([])
  const [tecnicos, setTecnicos] = useState<Usuario[]>([])
  const [filtroTecnico, setFiltroTecnico] = useState('')
  const [modal, setModal] = useState<{ fecha: string } | null>(null)
  const [form, setForm] = useState({ predioId: '', tecnicoId: '', notas: '' })
  const [saving, setSaving] = useState(false)

  const fetchAgendas = useCallback(() => {
    const mk = monthKey(viewDate)
    const params = new URLSearchParams({ month: mk })
    if (filtroTecnico) params.set('tecnicoId', filtroTecnico)
    fetch(`/api/agenda?${params}`).then((r) => r.json()).then(setAgendas)
  }, [viewDate, filtroTecnico])

  const fetchStats = useCallback(() => {
    const params = new URLSearchParams({ meses: '6' })
    if (filtroTecnico) params.set('tecnicoId', filtroTecnico)
    fetch(`/api/agenda/stats?${params}`).then((r) => r.json()).then(setStats)
  }, [filtroTecnico])

  useEffect(() => {
    fetch('/api/predios').then((r) => r.json()).then((p) => setPredios(p.filter((x: any) => x.activa)))
    fetch('/api/equipo').then((r) => r.json()).then(setTecnicos)
  }, [])

  useEffect(() => { fetchAgendas() }, [fetchAgendas])
  useEffect(() => { fetchStats() }, [fetchStats])

  // Calendar grid
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const agendasByDay: Record<string, AgendaItem[]> = {}
  for (const a of agendas) {
    const d = toYMD(new Date(a.fecha))
    if (!agendasByDay[d]) agendasByDay[d] = []
    agendasByDay[d].push(a)
  }

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))

  const handleDayClick = (day: number) => {
    const fecha = toYMD(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))
    setForm({ predioId: predios[0]?.id.toString() ?? '', tecnicoId: tecnicos[0]?.id.toString() ?? '', notas: '' })
    setModal({ fecha })
  }

  const handleAgendar = async () => {
    if (!modal || !form.predioId || !form.tecnicoId) return
    setSaving(true)
    await fetch('/api/agenda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha: modal.fecha, ...form }),
    })
    setSaving(false)
    setModal(null)
    fetchAgendas()
    fetchStats()
  }

  const handleEliminar = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch(`/api/agenda/${id}`, { method: 'DELETE' })
    fetchAgendas()
    fetchStats()
  }

  // KPI for current month
  const mk = monthKey(viewDate)
  const currentStat = stats.find((s) => {
    const idx = stats.indexOf(s)
    return idx === stats.length - 1 - (
      (new Date().getFullYear() - viewDate.getFullYear()) * 12 +
      (new Date().getMonth() - viewDate.getMonth())
    )
  }) ?? stats[stats.length - 1]

  const planificadas = agendas.length
  const realizadasMes = currentStat?.realizadas ?? 0
  const cumplimiento = planificadas > 0 ? Math.round((realizadasMes / planificadas) * 100) : null

  return (
    <div>
      <Header
        title="Agenda de Visitas"
        subtitle="Planificación mensual y seguimiento de cumplimiento"
        action={
          <select
            className="input w-48"
            value={filtroTecnico}
            onChange={(e) => setFiltroTecnico(e.target.value)}
          >
            <option value="">Todos los técnicos</option>
            {tecnicos.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>
            ))}
          </select>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Planificadas este mes</p>
          <p className="text-3xl font-bold text-gray-900">{planificadas}</p>
          <p className="text-xs text-gray-400 mt-1">{MESES[viewDate.getMonth()]} {viewDate.getFullYear()}</p>
        </div>
        <div className="card py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Realizadas este mes</p>
          <p className="text-3xl font-bold text-primary-700">{realizadasMes}</p>
          <p className="text-xs text-gray-400 mt-1">Visitas completadas</p>
        </div>
        <div className="card py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Cumplimiento</p>
          <p className={`text-3xl font-bold ${cumplimiento === null ? 'text-gray-400' : cumplimiento >= 80 ? 'text-green-600' : cumplimiento >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
            {cumplimiento === null ? '—' : `${cumplimiento}%`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {cumplimiento === null ? 'Sin visitas planificadas' : cumplimiento >= 80 ? 'Excelente' : cumplimiento >= 50 ? 'Regular' : 'Bajo'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario */}
        <div className="lg:col-span-2">
          <div className="card p-0 overflow-hidden">
            {/* Nav mes */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <button onClick={prevMonth} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="font-semibold text-gray-800">{MESES[viewDate.getMonth()]} {viewDate.getFullYear()}</h2>
              <button onClick={nextMonth} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Días semana */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DIAS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">{d}</div>
              ))}
            </div>

            {/* Celdas */}
            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="min-h-[80px] border-r border-b border-gray-100 bg-gray-50/50" />
                }
                const dateStr = toYMD(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))
                const todayStr = toYMD(today)
                const isToday = dateStr === todayStr
                const dayAgendas = agendasByDay[dateStr] ?? []

                return (
                  <div
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`min-h-[80px] border-r border-b border-gray-100 p-1.5 cursor-pointer transition-colors hover:bg-primary-50/40 ${idx % 7 === 0 || idx % 7 === 6 ? 'bg-gray-50/30' : ''}`}
                  >
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1 ${isToday ? 'bg-primary-700 text-white' : 'text-gray-600'}`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayAgendas.slice(0, 2).map((a) => (
                        <div
                          key={a.id}
                          onClick={(e) => handleEliminar(a.id, e)}
                          title={`${a.predio.nombre} — clic para eliminar`}
                          className="text-xs bg-primary-100 text-primary-800 rounded px-1 py-0.5 truncate cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
                        >
                          {a.predio.nombre}
                        </div>
                      ))}
                      {dayAgendas.length > 2 && (
                        <div className="text-xs text-gray-400">+{dayAgendas.length - 2} más</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
              Haz clic en un día para agendar · Haz clic en una visita para eliminarla
            </div>
          </div>
        </div>

        {/* Panel lateral: lista del mes */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Visitas agendadas — {MESES[viewDate.getMonth()]}</h3>
          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {agendas.length === 0 && (
              <div className="card text-center py-8 text-gray-400 text-sm">No hay visitas agendadas</div>
            )}
            {agendas.map((a) => (
              <div key={a.id} className="card py-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{a.predio.nombre}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(a.fecha).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs text-gray-500">{a.tecnico.nombre} {a.tecnico.apellido}</p>
                    {a.notas && <p className="text-xs text-gray-400 mt-0.5 italic">{a.notas}</p>}
                  </div>
                  <button
                    onClick={(e) => handleEliminar(a.id, e)}
                    className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico comparativo */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-gray-800">Planificado vs Realizado — últimos 6 meses</h2>
            <p className="text-xs text-gray-400 mt-0.5">Comparación entre visitas agendadas y visitas completadas</p>
          </div>
        </div>
        {stats.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sin datos suficientes</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede3" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(value, name) => [
                  value,
                  name === 'planificadas' ? 'Planificadas' : 'Realizadas',
                ]}
              />
              <Legend
                formatter={(value) => value === 'planificadas' ? 'Planificadas' : 'Realizadas'}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="planificadas" name="planificadas" fill="#cdc5a4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realizadas" name="realizadas" radius={[4, 4, 0, 0]}>
                {stats.map((s, i) => {
                  const pct = s.planificadas > 0 ? s.realizadas / s.planificadas : 1
                  const color = pct >= 0.8 ? '#3c5430' : pct >= 0.5 ? '#92683e' : '#b83030'
                  return <Cell key={i} fill={color} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        {/* Leyenda de colores KPI */}
        <div className="flex items-center gap-6 mt-2 justify-center">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-[#3c5430] inline-block" />≥ 80% cumplimiento
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-[#92683e] inline-block" />50–79%
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-[#b83030] inline-block" />{'< 50%'}
          </div>
        </div>
      </div>

      {/* Modal agendar visita */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Agendar visita</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(modal.fecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Predio</label>
                <select className="input" value={form.predioId} onChange={(e) => setForm({ ...form, predioId: e.target.value })}>
                  <option value="">Seleccionar predio…</option>
                  {predios.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} — {p.empresa.razonSocial}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Técnico responsable</label>
                <select className="input" value={form.tecnicoId} onChange={(e) => setForm({ ...form, tecnicoId: e.target.value })}>
                  <option value="">Seleccionar técnico…</option>
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Notas (opcional)</label>
                <input
                  className="input"
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  placeholder="Objetivo de la visita, observaciones…"
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleAgendar}
                disabled={!form.predioId || !form.tecnicoId || saving}
                className="btn-primary flex-1"
              >
                {saving ? 'Guardando…' : 'Agendar visita'}
              </button>
              <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
