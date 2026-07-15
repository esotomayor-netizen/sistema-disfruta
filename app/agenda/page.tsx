'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'

interface Predio { id: number; nombre: string; cultivos: { cultivo: string }[]; empresa: { razonSocial: string } }
interface Usuario { id: number; nombre: string; apellido: string }
interface AgendaItem { id: number; fecha: string; notas: string | null; predio: Predio; tecnico: Usuario }
interface Stat { mes: string; planificadas: number; realizadas: number }
interface GenerarResult { ok: boolean; creadas?: number; tecnicos?: number; diasHabiles?: number; mes?: string; error?: string }

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function toYMD(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export default function AgendaPage() {
  const { data: session } = useSession()
  const esSupervisor = (session?.user as any)?.rol === 'SUPERVISOR'
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [agendas, setAgendas] = useState<AgendaItem[]>([])
  const [stats, setStats] = useState<Stat[]>([])
  const [predios, setPredios] = useState<Predio[]>([])
  const [tecnicos, setTecnicos] = useState<Usuario[]>([])
  const [filtroTecnico, setFiltroTecnico] = useState('')

  // Crear visita
  const [modal, setModal] = useState<{ fecha: string } | null>(null)
  const [form, setForm] = useState({ predioId: '', tecnicoId: '', notas: '' })
  const [saving, setSaving] = useState(false)

  // Editar visita
  const [editModal, setEditModal] = useState<AgendaItem | null>(null)
  const [editForm, setEditForm] = useState({ fecha: '', predioId: '', tecnicoId: '', notas: '' })
  const [editSaving, setEditSaving] = useState(false)

  // Generar agenda
  const [generarModal, setGenerarModal] = useState(false)
  const [generarMes, setGenerarMes] = useState(monthKey(today))
  const [generarTecnicoId, setGenerarTecnicoId] = useState('')
  const [generarSobreescribir, setGenerarSobreescribir] = useState(false)
  const [generarLoading, setGenerarLoading] = useState(false)
  const [generarResult, setGenerarResult] = useState<GenerarResult | null>(null)

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
    setForm({ predioId: '', tecnicoId: tecnicos[0]?.id.toString() ?? '', notas: '' })
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

  const handleEditClick = (item: AgendaItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!esSupervisor) return
    setEditModal(item)
    setEditForm({
      fecha: toYMD(new Date(item.fecha)),
      predioId: String(item.predio.id),
      tecnicoId: String(item.tecnico.id),
      notas: item.notas ?? '',
    })
  }

  const handleEditGuardar = async () => {
    if (!editModal) return
    setEditSaving(true)
    await fetch(`/api/agenda/${editModal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setEditSaving(false)
    setEditModal(null)
    fetchAgendas()
  }

  const handleEliminarDesdeEdit = async () => {
    if (!editModal) return
    if (!confirm('¿Eliminar esta visita agendada?')) return
    await fetch(`/api/agenda/${editModal.id}`, { method: 'DELETE' })
    setEditModal(null)
    fetchAgendas()
    fetchStats()
  }

  const handleGenerar = async () => {
    if (!generarTecnicoId) return
    setGenerarLoading(true)
    setGenerarResult(null)
    const res = await fetch('/api/agenda/generar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mes: generarMes, sobreescribir: generarSobreescribir, tecnicoId: generarTecnicoId }),
    })
    const data = await res.json()
    setGenerarResult(data)
    setGenerarLoading(false)
    if (data.ok) {
      const [y, m] = generarMes.split('-').map(Number)
      setViewDate(new Date(y, m - 1, 1))
      fetchAgendas()
      fetchStats()
    }
  }

  // KPI for current month
  const planificadas = agendas.length
  const currentStat = stats.find((s) => {
    const idx = stats.indexOf(s)
    return idx === stats.length - 1 - (
      (new Date().getFullYear() - viewDate.getFullYear()) * 12 +
      (new Date().getMonth() - viewDate.getMonth())
    )
  }) ?? stats[stats.length - 1]
  const realizadasMes = currentStat?.realizadas ?? 0
  const cumplimiento = planificadas > 0 ? Math.round((realizadasMes / planificadas) * 100) : null

  // Year/month options for generar modal (current month ± 6 months)
  const mesOptions: { value: string; label: string }[] = []
  for (let delta = -2; delta <= 6; delta++) {
    const d = new Date(today.getFullYear(), today.getMonth() + delta, 1)
    mesOptions.push({ value: monthKey(d), label: `${MESES[d.getMonth()]} ${d.getFullYear()}` })
  }

  return (
    <div>
      <Header
        title="Agenda de Visitas"
        subtitle="Planificación mensual y seguimiento de cumplimiento"
        action={
          <div className="flex gap-2 items-center flex-wrap">
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
            {esSupervisor && (
              <button
                onClick={() => { setGenerarModal(true); setGenerarResult(null); setGenerarTecnicoId(filtroTecnico) }}
                className="btn-primary text-sm whitespace-nowrap"
              >
                Generar Agenda
              </button>
            )}
            <Link href="/agenda/cumplimiento" className="btn-secondary text-sm whitespace-nowrap">
              Ver cumplimiento
            </Link>
          </div>
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
                const isWeekend = idx % 7 === 0 || idx % 7 === 6
                const dayAgendas = agendasByDay[dateStr] ?? []

                return (
                  <div
                    key={day}
                    onClick={() => !isWeekend && handleDayClick(day)}
                    className={`min-h-[100px] border-r border-b border-gray-100 p-1.5 transition-colors ${isWeekend ? 'bg-gray-50/40' : 'cursor-pointer hover:bg-primary-50/40'}`}
                  >
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1 ${isToday ? 'bg-primary-700 text-white' : isWeekend ? 'text-gray-300' : 'text-gray-600'}`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayAgendas.slice(0, 3).map((a) => (
                        <div
                          key={a.id}
                          title={`${a.predio.nombre} · ${a.tecnico.nombre} ${a.tecnico.apellido}`}
                          onClick={(e) => handleEditClick(a, e)}
                          className={`text-xs bg-primary-100 text-primary-800 rounded px-1 py-0.5 flex items-center gap-1 ${esSupervisor ? 'cursor-pointer hover:bg-primary-200' : ''}`}
                        >
                          <span className="truncate flex-1">{a.predio.nombre}</span>
                          {esSupervisor && (
                            <button
                              onClick={(e) => handleEliminar(a.id, e)}
                              className="flex-shrink-0 text-primary-400 hover:text-red-600 transition-colors leading-none"
                            >×</button>
                          )}
                        </div>
                      ))}
                      {dayAgendas.length > 3 && (
                        <div className="text-xs text-gray-400">+{dayAgendas.length - 3} más</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
              {esSupervisor
                ? 'Clic en un día hábil para agregar · Clic en una visita para editar · × para eliminar'
                : 'Clic en un día hábil para agendar una visita'}
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
              <div
                key={a.id}
                onClick={(e) => handleEditClick(a, e as any)}
                className={`card py-3 px-4 ${esSupervisor ? 'cursor-pointer hover:border-primary-300 transition-colors' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{a.predio.nombre}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(a.fecha).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs text-gray-500">{a.tecnico.nombre} {a.tecnico.apellido}</p>
                    {a.notas && <p className="text-xs text-gray-400 mt-0.5 italic truncate">{a.notas}</p>}
                  </div>
                  {esSupervisor && (
                    <button
                      onClick={(e) => handleEliminar(a.id, e)}
                      className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
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
                formatter={(value, name) => [value, name === 'planificadas' ? 'Planificadas' : 'Realizadas']}
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

      {/* Modal: agendar visita (nueva) */}
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
                    <option key={p.id} value={p.id}>
                      {p.nombre}{p.cultivos.length ? ` (${p.cultivos.map(c => c.cultivo).join(', ')})` : ''} — {p.empresa.razonSocial}
                    </option>
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

      {/* Modal: editar visita existente */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Editar visita agendada</h3>
                <p className="text-xs text-gray-400 mt-0.5">{editModal.predio.nombre}</p>
              </div>
              <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Fecha</label>
                <input
                  className="input"
                  type="date"
                  value={editForm.fecha}
                  onChange={(e) => setEditForm({ ...editForm, fecha: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Predio</label>
                <select className="input" value={editForm.predioId} onChange={(e) => setEditForm({ ...editForm, predioId: e.target.value })}>
                  {predios.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}{p.cultivos.length ? ` (${p.cultivos.map(c => c.cultivo).join(', ')})` : ''} — {p.empresa.razonSocial}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Técnico responsable</label>
                <select className="input" value={editForm.tecnicoId} onChange={(e) => setEditForm({ ...editForm, tecnicoId: e.target.value })}>
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Notas (opcional)</label>
                <input
                  className="input"
                  value={editForm.notas}
                  onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })}
                  placeholder="Objetivo de la visita, observaciones…"
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleEditGuardar}
                disabled={!editForm.predioId || !editForm.tecnicoId || !editForm.fecha || editSaving}
                className="btn-primary flex-1"
              >
                {editSaving ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button onClick={() => setEditModal(null)} className="btn-secondary">Cancelar</button>
              <button onClick={handleEliminarDesdeEdit} className="btn-danger">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: generar agenda mensual */}
      {generarModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Generar agenda mensual</h3>
                <p className="text-xs text-gray-400 mt-0.5">Genera automáticamente las visitas para el técnico seleccionado</p>
              </div>
              <button onClick={() => setGenerarModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="label">Técnico <span className="text-red-500">*</span></label>
                <select
                  className="input"
                  value={generarTecnicoId}
                  onChange={(e) => { setGenerarTecnicoId(e.target.value); setGenerarResult(null) }}
                  required
                >
                  <option value="">Seleccionar técnico…</option>
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Mes a generar</label>
                <select
                  className="input"
                  value={generarMes}
                  onChange={(e) => { setGenerarMes(e.target.value); setGenerarResult(null) }}
                >
                  {mesOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generarSobreescribir}
                  onChange={(e) => setGenerarSobreescribir(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">Reemplazar agenda existente del mes</p>
                  <p className="text-xs text-gray-400 mt-0.5">Si está marcado, elimina las visitas ya agendadas de este técnico en ese mes antes de generar la nueva agenda.</p>
                </div>
              </label>

              {/* Cómo funciona */}
              <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs text-gray-500 space-y-1 border border-gray-100">
                <p className="font-semibold text-gray-700 mb-1">Cómo funciona</p>
                <p>• El técnico recibe una visita a cada uno de sus predios asignados durante el mes.</p>
                <p>• Las visitas se distribuyen de Lunes a Viernes usando el GPS de cada predio para agrupar los más cercanos en el mismo día.</p>
                <p>• Los predios sin GPS se agregan al final de la ruta.</p>
              </div>

              {/* Resultado */}
              {generarResult && (
                <div className={`rounded-lg px-4 py-3 text-sm border ${generarResult.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {generarResult.ok ? (
                    <div className="space-y-1">
                      <p className="font-semibold">Agenda generada correctamente</p>
                      <p>{generarResult.creadas} visitas creadas · {generarResult.tecnicos} técnico{(generarResult.tecnicos ?? 0) > 1 ? 's' : ''} · {generarResult.diasHabiles} días hábiles</p>
                    </div>
                  ) : (
                    <p>{generarResult.error ?? 'Error al generar la agenda'}</p>
                  )}
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              {generarResult?.ok ? (
                <button onClick={() => setGenerarModal(false)} className="btn-primary flex-1">
                  Ver agenda generada
                </button>
              ) : (
                <button
                  onClick={handleGenerar}
                  disabled={generarLoading || !generarTecnicoId}
                  className="btn-primary flex-1"
                >
                  {generarLoading ? 'Generando…' : 'Generar agenda'}
                </button>
              )}
              <button onClick={() => setGenerarModal(false)} className="btn-secondary">
                {generarResult?.ok ? 'Cerrar' : 'Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
