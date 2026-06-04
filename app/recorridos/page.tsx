'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/Header'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Usuario { id: number; nombre: string; apellido: string }
interface Recorrido {
  id: number; fecha: string; kmInicio: number; kmFin: number
  litrosCargados: number | null; notas: string | null; tecnico: Usuario
}
interface Estimacion { kmEstimado: number | null; prediosConGPS: number; totalPredios: number; predios: string[] }

const today = new Date()
const toYMD = (d: Date) => d.toISOString().split('T')[0]
const mesActual = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

function consumo100(km: number, litros: number) {
  return ((litros / km) * 100).toFixed(1)
}

export default function RecorridosPage() {
  const [tecnicos, setTecnicos] = useState<Usuario[]>([])
  const [recorridos, setRecorridos] = useState<Recorrido[]>([])
  const [filtroTecnico, setFiltroTecnico] = useState('')
  const [mes, setMes] = useState(mesActual)
  const [showForm, setShowForm] = useState(false)
  const [estimacion, setEstimacion] = useState<Estimacion | null>(null)
  const [loadingEst, setLoadingEst] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fecha: toYMD(today),
    tecnicoId: '',
    kmInicio: '',
    kmFin: '',
    litrosCargados: '',
    notas: '',
  })

  const fetchRecorridos = useCallback(() => {
    const p = new URLSearchParams({ mes })
    if (filtroTecnico) p.set('tecnicoId', filtroTecnico)
    fetch(`/api/recorridos?${p}`).then((r) => r.json()).then(setRecorridos)
  }, [mes, filtroTecnico])

  useEffect(() => {
    fetch('/api/equipo').then((r) => r.json()).then((t) => {
      setTecnicos(t)
      if (t.length) setForm((f) => ({ ...f, tecnicoId: String(t[0].id) }))
    })
  }, [])

  useEffect(() => { fetchRecorridos() }, [fetchRecorridos])

  const fetchEstimacion = useCallback(async () => {
    if (!form.fecha || !form.tecnicoId) return
    setLoadingEst(true)
    const r = await fetch(`/api/recorridos/estimacion?fecha=${form.fecha}&tecnicoId=${form.tecnicoId}`)
    const d = await r.json()
    setEstimacion(d)
    setLoadingEst(false)
  }, [form.fecha, form.tecnicoId])

  useEffect(() => {
    if (showForm) fetchEstimacion()
  }, [showForm, fetchEstimacion])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (parseFloat(form.kmFin) <= parseFloat(form.kmInicio)) return alert('Km fin debe ser mayor que km inicio')
    setSaving(true)
    await fetch('/api/recorridos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setShowForm(false)
    setForm((f) => ({ ...f, kmInicio: '', kmFin: '', litrosCargados: '', notas: '' }))
    fetchRecorridos()
  }

  const handleEliminar = async (id: number) => {
    await fetch(`/api/recorridos/${id}`, { method: 'DELETE' })
    fetchRecorridos()
  }

  // KPIs
  const recFiltrados = filtroTecnico
    ? recorridos.filter((r) => String(r.tecnico.id) === filtroTecnico)
    : recorridos

  const kmDia = recFiltrados.map((r) => r.kmFin - r.kmInicio)
  const kmTotal = kmDia.reduce((a, b) => a + b, 0)
  const kmPromedio = recFiltrados.length > 0 ? Math.round(kmTotal / recFiltrados.length) : 0

  const recConLitros = recFiltrados.filter((r) => r.litrosCargados && (r.kmFin - r.kmInicio) > 0)
  const consumoPromedio = recConLitros.length > 0
    ? (recConLitros.reduce((acc, r) => acc + parseFloat(consumo100(r.kmFin - r.kmInicio, r.litrosCargados!)), 0) / recConLitros.length).toFixed(1)
    : null

  // Chart data: km por día
  const chartData = [...recFiltrados]
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .map((r) => ({
      dia: new Date(r.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }),
      km: Math.round(r.kmFin - r.kmInicio),
      litros: r.litrosCargados ?? 0,
    }))

  const [y, m] = mes.split('-').map(Number)
  const mesLabel = new Date(y, m - 1, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })

  return (
    <div>
      <Header
        title="Recorridos"
        subtitle="Kilometraje diario y consumo de combustible"
        action={
          <div className="flex gap-2 items-center">
            <select className="input w-44" value={filtroTecnico} onChange={(e) => setFiltroTecnico(e.target.value)}>
              <option value="">Todos los técnicos</option>
              {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>)}
            </select>
            <input type="month" className="input w-40" value={mes} onChange={(e) => setMes(e.target.value)} />
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              {showForm ? 'Cancelar' : '+ Registrar día'}
            </button>
          </div>
        }
      />

      {/* Formulario */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Registrar recorrido del día</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="label">Fecha</label>
                <input type="date" className="input" required value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </div>
              <div>
                <label className="label">Técnico</label>
                <select className="input" required value={form.tecnicoId}
                  onChange={(e) => setForm({ ...form, tecnicoId: e.target.value })}>
                  {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Km inicio (odómetro)</label>
                <input type="number" className="input" required placeholder="Ej: 45230" value={form.kmInicio}
                  onChange={(e) => setForm({ ...form, kmInicio: e.target.value })} />
              </div>
              <div>
                <label className="label">Km fin (odómetro)</label>
                <input type="number" className="input" required placeholder="Ej: 45538" value={form.kmFin}
                  onChange={(e) => setForm({ ...form, kmFin: e.target.value })} />
              </div>
              <div>
                <label className="label">Litros cargados (opcional)</label>
                <input type="number" step="0.01" className="input" placeholder="Ej: 35.5" value={form.litrosCargados}
                  onChange={(e) => setForm({ ...form, litrosCargados: e.target.value })} />
              </div>
              <div>
                <label className="label">Notas</label>
                <input className="input" placeholder="Observaciones del día" value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })} />
              </div>
            </div>

            {/* Km calculados en vivo */}
            {form.kmInicio && form.kmFin && parseFloat(form.kmFin) > parseFloat(form.kmInicio) && (
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2 bg-primary-50 rounded-lg px-4 py-2">
                  <span className="text-xs text-primary-600 font-medium">Km del día:</span>
                  <span className="font-bold text-primary-800">{Math.round(parseFloat(form.kmFin) - parseFloat(form.kmInicio))} km</span>
                </div>
                {form.litrosCargados && parseFloat(form.litrosCargados) > 0 && (
                  <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-4 py-2">
                    <span className="text-xs text-amber-600 font-medium">Consumo:</span>
                    <span className="font-bold text-amber-800">
                      {consumo100(parseFloat(form.kmFin) - parseFloat(form.kmInicio), parseFloat(form.litrosCargados))} L/100km
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Estimación GPS */}
            <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm">
              <div className="flex items-center gap-2 text-gray-600 font-medium mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Estimación por visitas del día (GPS)
              </div>
              {loadingEst ? (
                <p className="text-gray-400 text-xs animate-pulse">Calculando…</p>
              ) : estimacion === null || estimacion.totalPredios === 0 ? (
                <p className="text-gray-400 text-xs">Sin visitas registradas para esta fecha y técnico.</p>
              ) : estimacion.kmEstimado === null ? (
                <p className="text-gray-400 text-xs">
                  {estimacion.totalPredios} predio(s) visitado(s) sin coordenadas GPS — agrega GPS a los predios para calcular.
                </p>
              ) : (
                <div className="flex flex-wrap gap-4 items-center">
                  <span className="text-primary-700 font-bold">~{estimacion.kmEstimado} km estimados</span>
                  <span className="text-gray-400 text-xs">
                    {estimacion.prediosConGPS}/{estimacion.totalPredios} predios con GPS · {estimacion.predios.join(' → ')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar recorrido'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Km promedio/día</p>
          <p className="text-3xl font-bold text-gray-900">{kmPromedio}</p>
          <p className="text-xs text-gray-400 mt-1">km por jornada</p>
        </div>
        <div className="card py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Km totales</p>
          <p className="text-3xl font-bold text-primary-700">{Math.round(kmTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">{mesLabel}</p>
        </div>
        <div className="card py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Consumo promedio</p>
          <p className="text-3xl font-bold text-amber-700">{consumoPromedio ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">L / 100 km</p>
        </div>
        <div className="card py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Días registrados</p>
          <p className="text-3xl font-bold text-gray-900">{recFiltrados.length}</p>
          <p className="text-xs text-gray-400 mt-1">jornadas este mes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Gráfico */}
        <div className="lg:col-span-3 card">
          <h3 className="font-semibold text-gray-800 mb-4">Km por día — {mesLabel}</h3>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sin registros este mes</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede3" vertical={false} />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} unit=" km" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(v) => [`${v} km`, 'Recorrido']}
                />
                <Bar dataKey="km" fill="#3c5430" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {consumoPromedio && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-6 text-sm">
              <div>
                <span className="text-gray-400 text-xs">Total litros cargados: </span>
                <span className="font-medium text-gray-700">
                  {recConLitros.reduce((a, r) => a + r.litrosCargados!, 0).toFixed(1)} L
                </span>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Consumo promedio: </span>
                <span className="font-medium text-amber-700">{consumoPromedio} L/100km</span>
              </div>
            </div>
          )}
        </div>

        {/* Tabla de registros */}
        <div className="lg:col-span-2">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Registros — {mesLabel}</h3>
          <div className="space-y-2 max-h-[380px] overflow-y-auto">
            {recFiltrados.length === 0 && (
              <div className="card text-center py-8 text-gray-400 text-sm">Sin registros este mes</div>
            )}
            {recFiltrados.map((r) => {
              const km = Math.round(r.kmFin - r.kmInicio)
              const cons = r.litrosCargados ? consumo100(km, r.litrosCargados) : null
              return (
                <div key={r.id} className="card py-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 text-sm">
                          {new Date(r.fecha).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                        <span className="bg-primary-100 text-primary-800 text-xs font-semibold px-2 py-0.5 rounded-full">{km} km</span>
                        {cons && <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">{cons} L/100km</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{r.tecnico.nombre} {r.tecnico.apellido}</p>
                      <p className="text-xs text-gray-400">Odómetro: {r.kmInicio.toLocaleString()} → {r.kmFin.toLocaleString()}</p>
                      {r.litrosCargados && <p className="text-xs text-amber-600">{r.litrosCargados} L cargados</p>}
                      {r.notas && <p className="text-xs text-gray-400 italic mt-0.5">{r.notas}</p>}
                    </div>
                    <button onClick={() => handleEliminar(r.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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
