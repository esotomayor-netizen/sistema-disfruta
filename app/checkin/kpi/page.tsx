'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'
import Header from '@/components/Header'
import Link from 'next/link'

interface Usuario { id: number; nombre: string; apellido: string; activo: boolean }
interface StatMes {
  mes: string
  key: string
  checkins: number
  planificadas: number
  kmGPS: number
}

export default function CheckInKpiPage() {
  const [tecnicos, setTecnicos] = useState<Usuario[]>([])
  const [tecnicoId, setTecnicoId] = useState('')
  const [stats, setStats] = useState<StatMes[]>([])

  useEffect(() => {
    fetch('/api/equipo?encargados=true')
      .then((r) => r.json())
      .then((u: Usuario[]) => setTecnicos(u.filter((x) => x.activo)))
  }, [])

  useEffect(() => {
    const url = tecnicoId
      ? `/api/checkins/stats?tecnicoId=${tecnicoId}`
      : '/api/checkins/stats'
    fetch(url).then((r) => r.json()).then(setStats)
  }, [tecnicoId])

  const totalCheckins = stats.reduce((s, m) => s + m.checkins, 0)
  const totalKm = stats.reduce((s, m) => s + m.kmGPS, 0)
  const mesActual = stats[stats.length - 1]
  const cumplimiento = mesActual?.planificadas
    ? Math.round((mesActual.checkins / mesActual.planificadas) * 100)
    : null

  return (
    <div>
      <Header
        title="KPI Check-In GPS"
        subtitle="Visitas realizadas vs planificadas y kilómetros recorridos"
        action={
          <div className="flex gap-2">
            <Link href="/checkin" className="btn-primary text-sm">Ir a Check-In</Link>
            <Link href="/recorridos" className="btn-secondary text-sm">Recorridos</Link>
          </div>
        }
      />

      {/* Filtro técnico */}
      <div className="mb-6 max-w-xs">
        <select
          className="input"
          value={tecnicoId}
          onChange={(e) => setTecnicoId(e.target.value)}
        >
          <option value="">Todos los técnicos</option>
          {tecnicos.map((u) => (
            <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
          ))}
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Check-ins (6 meses)</p>
          <p className="text-3xl font-bold text-primary-800 mt-1">{totalCheckins}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Planificadas este mes</p>
          <p className="text-3xl font-bold text-primary-800 mt-1">{mesActual?.planificadas ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Cumplimiento mes actual</p>
          <p className={`text-3xl font-bold mt-1 ${
            cumplimiento === null ? 'text-gray-400'
              : cumplimiento >= 80 ? 'text-green-600'
              : cumplimiento >= 50 ? 'text-orange-500'
              : 'text-red-500'
          }`}>
            {cumplimiento !== null ? `${cumplimiento}%` : '—'}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wider">km GPS (6 meses)</p>
          <p className="text-3xl font-bold text-primary-800 mt-1">{Math.round(totalKm)}</p>
        </div>
      </div>

      {/* Gráfico visitas planificadas vs realizadas */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Visitas planificadas vs check-ins realizados</h2>
        {stats.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats} barGap={4} barCategoryGap="30%">
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) => [
                  value,
                  name === 'planificadas' ? 'Planificadas' : 'Check-ins',
                ]}
              />
              <Legend
                formatter={(value) => value === 'planificadas' ? 'Planificadas' : 'Check-ins'}
              />
              <Bar dataKey="planificadas" name="planificadas" fill="#cdc5a4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="checkins" name="checkins" radius={[4, 4, 0, 0]}>
                {stats.map((m) => {
                  const pct = m.planificadas ? m.checkins / m.planificadas : 1
                  const color = pct >= 0.8 ? '#3c5430' : pct >= 0.5 ? '#d97706' : '#dc2626'
                  return <Cell key={m.key} fill={color} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 text-center py-10">Sin datos</p>
        )}
      </div>

      {/* Gráfico km GPS */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Kilómetros GPS por mes (× 1.35 factor ruta)</h2>
        {stats.some((m) => m.kmGPS > 0) ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats} barCategoryGap="35%">
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" km" />
              <Tooltip formatter={(v) => [`${v} km`, 'Distancia GPS']} />
              <Bar dataKey="kmGPS" name="km GPS" fill="#3c5430" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 text-center py-10">
            Marca check-ins GPS para ver distancias recorridas
          </p>
        )}
      </div>
    </div>
  )
}
