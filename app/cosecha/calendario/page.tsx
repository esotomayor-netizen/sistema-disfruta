'use client'

import { useState, useEffect } from 'react'
import {
  SEMANAS,
  VARIEDADES,
  PROGRAMACION_SEMANAL,
  fmtKg,
  TEMPORADA,
} from '@/lib/cosecha-data'
import type { ProgramacionRow } from '@/lib/cosecha-data'
import { loadProgramacion } from '@/lib/cosecha-store'

// ── Color palette ──────────────────────────────────────────────────────────────

const VARIETY_COLORS: Record<string, { r: number; g: number; b: number; label: string }> = {
  'LAPINS':       { r: 22,  g: 163, b: 74,  label: 'Lapins' },
  'SANTINA':      { r: 16,  g: 185, b: 129, label: 'Santina' },
  'REGINA':       { r: 20,  g: 184, b: 166, label: 'Regina' },
  'BING':         { r: 8,   g: 145, b: 178, label: 'Bing' },
  'SWEET HEART':  { r: 14,  g: 165, b: 233, label: 'Sweet Heart' },
  'BROOKS':       { r: 99,  g: 102, b: 241, label: 'Brooks' },
  'VAN':          { r: 139, g: 92,  b: 246, label: 'Van' },
  'KORDIA':       { r: 168, g: 85,  b: 247, label: 'Kordia' },
  'ROYAL DAWN':   { r: 217, g: 70,  b: 239, label: 'Royal Dawn' },
  'SKEENA':       { r: 236, g: 72,  b: 153, label: 'Skeena' },
  'FRISCO':       { r: 239, g: 68,  b: 68,  label: 'Frisco' },
}

// ── Week date ranges ───────────────────────────────────────────────────────────

const WEEK_RANGES: { key: string; start: Date; end: Date }[] = [
  { key: 'sem44', start: new Date('2026-10-26'), end: new Date('2026-11-01') },
  { key: 'sem45', start: new Date('2026-11-02'), end: new Date('2026-11-08') },
  { key: 'sem46', start: new Date('2026-11-09'), end: new Date('2026-11-15') },
  { key: 'sem47', start: new Date('2026-11-16'), end: new Date('2026-11-22') },
  { key: 'sem48', start: new Date('2026-11-23'), end: new Date('2026-11-29') },
  { key: 'sem49', start: new Date('2026-11-30'), end: new Date('2026-12-06') },
  { key: 'sem50', start: new Date('2026-12-07'), end: new Date('2026-12-13') },
  { key: 'sem51', start: new Date('2026-12-14'), end: new Date('2026-12-20') },
  { key: 'sem52', start: new Date('2026-12-21'), end: new Date('2026-12-27') },
  { key: 'sem1',  start: new Date('2026-12-28'), end: new Date('2027-01-03') },
  { key: 'sem2',  start: new Date('2027-01-04'), end: new Date('2027-01-10') },
]

function getWeekForDate(date: Date): string | null {
  const d = date.getTime()
  for (const r of WEEK_RANGES) {
    if (d >= r.start.getTime() && d <= r.end.getTime()) return r.key
  }
  return null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtTons(kg: number): string {
  if (kg >= 1_000_000) return (kg / 1_000_000).toFixed(2) + 'M'
  if (kg >= 1_000) return Math.round(kg / 1_000) + 't'
  return kg + 'kg'
}

function aggregateByVariety(data: ProgramacionRow[], productor: string): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {}
  const filtered = productor === 'TODOS' ? data : data.filter((r) => r.productor === productor)
  for (const row of filtered) {
    if (!result[row.variedad]) {
      result[row.variedad] = {}
      for (const sem of SEMANAS) result[row.variedad][sem.key] = 0
    }
    for (const sem of SEMANAS) {
      result[row.variedad][sem.key] = (result[row.variedad][sem.key] ?? 0) + (row[sem.key] as number)
    }
  }
  return result
}

function totalByWeek(byVariety: Record<string, Record<string, number>>): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const sem of SEMANAS) totals[sem.key] = 0
  for (const vKey of Object.keys(byVariety)) {
    for (const sem of SEMANAS) {
      totals[sem.key] = (totals[sem.key] ?? 0) + (byVariety[vKey][sem.key] ?? 0)
    }
  }
  return totals
}

function totalByVariety(byVariety: Record<string, Record<string, number>>): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const vKey of Object.keys(byVariety)) {
    totals[vKey] = 0
    for (const sem of SEMANAS) {
      totals[vKey] += byVariety[vKey][sem.key] ?? 0
    }
  }
  return totals
}

// ── Calendar month builder ─────────────────────────────────────────────────────

interface MonthDef {
  year: number
  month: number  // 0-indexed
  label: string
}

const CALENDAR_MONTHS: MonthDef[] = [
  { year: 2026, month: 10, label: 'Noviembre 2026' },
  { year: 2026, month: 11, label: 'Diciembre 2026' },
  { year: 2027, month: 0,  label: 'Enero 2027' },
]

function buildMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  // Monday=0, ..., Sunday=6
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CalendarioPage() {
  const [data, setData] = useState<ProgramacionRow[]>(PROGRAMACION_SEMANAL)
  const [productor, setProductor] = useState<string>('TODOS')

  useEffect(() => {
    const stored = loadProgramacion()
    if (stored && stored.length > 0) setData(stored)
  }, [])

  // Producers list
  const productores = Array.from(new Set(data.map((r) => r.productor))).sort()

  // Aggregated data per variety per week
  const byVariety = aggregateByVariety(data, productor)
  const weekTotals = totalByWeek(byVariety)
  const varietyTotals = totalByVariety(byVariety)

  // Sorted varieties by total descending
  const sortedVarieties = Object.keys(byVariety).sort((a, b) => (varietyTotals[b] ?? 0) - (varietyTotals[a] ?? 0))

  // Max KG across all weeks (for color intensity in Gantt)
  const maxKgAcrossAll = Math.max(
    ...Object.keys(byVariety).flatMap((v) =>
      SEMANAS.map((s) => byVariety[v][s.key] ?? 0)
    ),
    1
  )

  // Max weekly total for bar chart
  const maxWeekTotal = Math.max(...Object.values(weekTotals), 1)

  // ── KPIs ──────────────────────────────────────────────────────────────────────

  const peakWeek = SEMANAS.reduce((best, sem) =>
    (weekTotals[sem.key] ?? 0) > (weekTotals[best.key] ?? 0) ? sem : best
  )
  const activeWeeks = SEMANAS.filter((s) => (weekTotals[s.key] ?? 0) > 0).length
  const activeVarieties = sortedVarieties.filter((v) => (varietyTotals[v] ?? 0) > 0).length
  const activeWeekList = SEMANAS.filter((s) => (weekTotals[s.key] ?? 0) > 0)
  const harvestWindow =
    activeWeekList.length > 0
      ? `${activeWeekList[0].label} → ${activeWeekList[activeWeekList.length - 1].label}`
      : '—'

  // ── Active varieties per week (for calendar dots) ─────────────────────────────

  const activeVarietiesPerWeek: Record<string, string[]> = {}
  for (const sem of SEMANAS) {
    activeVarietiesPerWeek[sem.key] = sortedVarieties.filter(
      (v) => (byVariety[v][sem.key] ?? 0) > 0
    )
  }

  const today = new Date('2026-05-29')
  const todayTime = today.getTime()

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <a href="/cosecha" className="text-gray-400 hover:text-gray-600 text-sm">← Inicio</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600 font-medium">Calendario de Cosecha</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <h1 className="text-2xl font-bold text-gray-900">Calendario de Cosecha</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Temporada {TEMPORADA} · Distribución semanal por variedad y productor
        </p>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Semana Pico</p>
          <p className="text-xl font-bold text-gray-900">{peakWeek.label}</p>
          <p className="text-sm text-gray-500 mt-1">{fmtKg(weekTotals[peakWeek.key] ?? 0)}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Semanas Activas</p>
          <p className="text-xl font-bold text-gray-900">{activeWeeks}</p>
          <p className="text-sm text-gray-500 mt-1">de {SEMANAS.length} semanas</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Variedades</p>
          <p className="text-xl font-bold text-gray-900">{activeVarieties}</p>
          <p className="text-sm text-gray-500 mt-1">con producción planificada</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ventana de Cosecha</p>
          <p className="text-lg font-bold text-gray-900">{harvestWindow}</p>
          <p className="text-sm text-gray-500 mt-1">primer → última semana activa</p>
        </div>
      </div>

      {/* ── Productor Filter ── */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filtrar por productor:</label>
          <select
            className="input max-w-xs"
            value={productor}
            onChange={(e) => setProductor(e.target.value)}
          >
            <option value="TODOS">Todos los productores</option>
            {productores.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {productor !== 'TODOS' && (
            <button
              className="btn-secondary"
              onClick={() => setProductor('TODOS')}
            >
              Limpiar filtro
            </button>
          )}
        </div>
      </div>

      {/* ── Section 1: Gantt ── */}
      <div className="card mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Distribución Semanal por Variedad</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse" style={{ minWidth: '900px' }}>
            <thead>
              <tr className="border-b border-gray-200">
                <th className="table-th text-left w-28 sticky left-0 bg-white z-10">Variedad</th>
                {SEMANAS.map((sem) => (
                  <th key={sem.key} className="table-th text-center px-1 py-2" style={{ minWidth: '72px' }}>
                    <span className="block font-semibold">{sem.label}</span>
                    <span className="block text-gray-400 font-normal text-[10px]">{sem.fecha}</span>
                  </th>
                ))}
                <th className="table-th text-right px-2 py-2 w-20">Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedVarieties.map((varKey) => {
                const color = VARIETY_COLORS[varKey] ?? { r: 100, g: 100, b: 100, label: varKey }
                const vTotal = varietyTotals[varKey] ?? 0
                if (vTotal === 0) return null
                return (
                  <tr key={varKey} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-1 px-2 sticky left-0 bg-white z-10">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{
                          backgroundColor: `rgba(${color.r},${color.g},${color.b},0.15)`,
                          color: `rgb(${Math.round(color.r * 0.6)},${Math.round(color.g * 0.6)},${Math.round(color.b * 0.6)})`,
                        }}
                      >
                        {color.label}
                      </span>
                    </td>
                    {SEMANAS.map((sem) => {
                      const kg = byVariety[varKey][sem.key] ?? 0
                      const opacity = kg > 0 ? Math.max(0.12, kg / maxKgAcrossAll) : 0
                      const textColor = opacity > 0.5 ? '#fff' : `rgb(${Math.round(color.r * 0.5)},${Math.round(color.g * 0.5)},${Math.round(color.b * 0.5)})`
                      return (
                        <td key={sem.key} className="py-1 px-1 text-center">
                          {kg > 0 ? (
                            <div
                              className="rounded flex items-center justify-center font-medium mx-auto"
                              style={{
                                backgroundColor: `rgba(${color.r},${color.g},${color.b},${opacity})`,
                                color: textColor,
                                minHeight: '32px',
                                padding: '4px 2px',
                                fontSize: '10px',
                              }}
                            >
                              {kg >= 10000 ? fmtTons(kg) : ''}
                            </div>
                          ) : (
                            <div className="rounded bg-gray-100 mx-auto" style={{ minHeight: '32px' }} />
                          )}
                        </td>
                      )
                    })}
                    <td className="py-1 px-2 text-right font-semibold text-gray-700 text-[11px]">
                      {fmtTons(vTotal)}
                    </td>
                  </tr>
                )
              })}

              {/* Total row */}
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                <td className="py-2 px-2 text-xs text-gray-700 sticky left-0 bg-gray-50 z-10">TOTAL SEM</td>
                {SEMANAS.map((sem) => {
                  const kg = weekTotals[sem.key] ?? 0
                  return (
                    <td key={sem.key} className="py-2 px-1 text-center text-[11px] text-gray-600">
                      {kg > 0 ? fmtTons(kg) : <span className="text-gray-300">—</span>}
                    </td>
                  )
                })}
                <td className="py-2 px-2 text-right text-[11px] text-gray-800">
                  {fmtTons(Object.values(weekTotals).reduce((s, v) => s + v, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2">
          {sortedVarieties.filter((v) => (varietyTotals[v] ?? 0) > 0).map((varKey) => {
            const color = VARIETY_COLORS[varKey] ?? { r: 100, g: 100, b: 100, label: varKey }
            return (
              <span
                key={varKey}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border"
                style={{
                  borderColor: `rgba(${color.r},${color.g},${color.b},0.4)`,
                  backgroundColor: `rgba(${color.r},${color.g},${color.b},0.08)`,
                  color: `rgb(${Math.round(color.r * 0.6)},${Math.round(color.g * 0.6)},${Math.round(color.b * 0.6)})`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: `rgb(${color.r},${color.g},${color.b})` }}
                />
                {color.label}
              </span>
            )
          })}
        </div>
      </div>

      {/* ── Section 2: Monthly Calendar ── */}
      <div className="card mb-8">
        <h2 className="font-semibold text-gray-900 mb-5">Vista por Mes</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {CALENDAR_MONTHS.map((monthDef) => {
            const cells = buildMonthDays(monthDef.year, monthDef.month)
            return (
              <div key={monthDef.label}>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 text-center">{monthDef.label}</h3>
                <div className="grid grid-cols-7 gap-0.5">
                  {/* Day headers */}
                  {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((d) => (
                    <div key={d} className="text-center text-[10px] font-semibold text-gray-500 py-1">{d}</div>
                  ))}
                  {/* Date cells */}
                  {cells.map((date, idx) => {
                    if (!date) {
                      return <div key={`empty-${idx}`} className="h-12 rounded" />
                    }
                    const weekKey = getWeekForDate(date)
                    const isFirstDayOfWeek = weekKey !== null && date.getDay() === 1  // Monday
                    const weekKg = weekKey ? (weekTotals[weekKey] ?? 0) : 0
                    const activeVarsThisWeek = weekKey ? (activeVarietiesPerWeek[weekKey] ?? []) : []
                    const isToday = date.getTime() === todayTime

                    return (
                      <div
                        key={date.toISOString()}
                        className={`h-12 rounded p-0.5 flex flex-col border text-[10px] ${
                          weekKey
                            ? 'bg-white border-gray-200'
                            : 'bg-gray-50 border-gray-100'
                        } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
                      >
                        <span className={`font-medium leading-tight ${weekKey ? 'text-gray-800' : 'text-gray-400'}`}>
                          {date.getDate()}
                        </span>
                        {isFirstDayOfWeek && weekKg > 0 && (
                          <span className="bg-gray-800 text-white rounded px-0.5 leading-tight text-[9px] mb-0.5 self-start">
                            {fmtTons(weekKg)}
                          </span>
                        )}
                        {/* Colored dots for active varieties */}
                        {weekKey && activeVarsThisWeek.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-auto">
                            {activeVarsThisWeek.slice(0, 5).map((varKey) => {
                              const col = VARIETY_COLORS[varKey]
                              if (!col) return null
                              return (
                                <span
                                  key={varKey}
                                  className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                                  style={{ backgroundColor: `rgb(${col.r},${col.g},${col.b})` }}
                                  title={col.label}
                                />
                              )
                            })}
                            {activeVarsThisWeek.length > 5 && (
                              <span className="text-gray-400 text-[8px] leading-tight">+{activeVarsThisWeek.length - 5}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Calendar legend */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3 items-center text-xs text-gray-500">
          <span className="font-medium text-gray-700">Leyenda:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-white border border-gray-200 inline-block" />
            Semana de cosecha activa
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gray-50 border border-gray-100 inline-block" />
            Sin actividad
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-gray-800 text-white rounded px-1 text-[9px]">XXXt</span>
            KG total de la semana
          </span>
          <span className="flex items-center gap-1.5">
            {Object.entries(VARIETY_COLORS).slice(0, 4).map(([, col]) => (
              <span
                key={col.label}
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: `rgb(${col.r},${col.g},${col.b})` }}
              />
            ))}
            Variedades activas esa semana
          </span>
        </div>
      </div>

      {/* ── Section 3: Top Semanas ── */}
      <div className="card mb-8">
        <h2 className="font-semibold text-gray-900 mb-5">Semanas de Mayor Actividad</h2>
        <div className="space-y-3">
          {SEMANAS.filter((s) => (weekTotals[s.key] ?? 0) > 0)
            .sort((a, b) => (weekTotals[b.key] ?? 0) - (weekTotals[a.key] ?? 0))
            .map((sem) => {
              const total = weekTotals[sem.key] ?? 0
              const barPct = (total / maxWeekTotal) * 100
              const activeVars = sortedVarieties.filter((v) => (byVariety[v][sem.key] ?? 0) > 0)

              return (
                <div key={sem.key} className="flex items-center gap-4">
                  <div className="w-16 text-right text-xs font-semibold text-gray-700 shrink-0">{sem.label}</div>
                  <div className="flex-1 relative h-8">
                    {/* Background track */}
                    <div className="absolute inset-0 rounded-lg bg-gray-100" />
                    {/* Stacked variety bars */}
                    <div className="absolute inset-0 rounded-lg overflow-hidden flex">
                      {activeVars.map((varKey) => {
                        const kg = byVariety[varKey][sem.key] ?? 0
                        const varPct = total > 0 ? (kg / total) * barPct : 0
                        const col = VARIETY_COLORS[varKey] ?? { r: 100, g: 100, b: 100 }
                        return (
                          <div
                            key={varKey}
                            style={{
                              width: `${varPct}%`,
                              backgroundColor: `rgb(${col.r},${col.g},${col.b})`,
                            }}
                            title={`${VARIETY_COLORS[varKey]?.label ?? varKey}: ${fmtKg(kg)}`}
                          />
                        )
                      })}
                    </div>
                  </div>
                  <div className="w-20 text-left text-xs font-semibold text-gray-800 shrink-0">{fmtKg(total)}</div>
                  <div className="w-40 hidden xl:flex flex-wrap gap-1 shrink-0">
                    {activeVars.map((varKey) => {
                      const col = VARIETY_COLORS[varKey]
                      if (!col) return null
                      return (
                        <span
                          key={varKey}
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `rgba(${col.r},${col.g},${col.b},0.15)`,
                            color: `rgb(${Math.round(col.r * 0.6)},${Math.round(col.g * 0.6)},${Math.round(col.b * 0.6)})`,
                          }}
                        >
                          {col.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
        </div>

        {/* Variety color reference */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-600 mb-2">Variedades</p>
          <div className="flex flex-wrap gap-2">
            {sortedVarieties.filter((v) => (varietyTotals[v] ?? 0) > 0).map((varKey) => {
              const col = VARIETY_COLORS[varKey]
              if (!col) return null
              return (
                <span
                  key={varKey}
                  className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full font-medium border"
                  style={{
                    borderColor: `rgba(${col.r},${col.g},${col.b},0.4)`,
                    backgroundColor: `rgba(${col.r},${col.g},${col.b},0.1)`,
                    color: `rgb(${Math.round(col.r * 0.55)},${Math.round(col.g * 0.55)},${Math.round(col.b * 0.55)})`,
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `rgb(${col.r},${col.g},${col.b})` }} />
                  {col.label}: {fmtKg(varietyTotals[varKey] ?? 0)}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Section 4: Resumen table ── */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Resumen Detallado</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="table-th text-left">Variedad</th>
                <th className="table-th text-left">Semana Inicio</th>
                <th className="table-th text-left">Semana Fin</th>
                <th className="table-th text-right">Total KG</th>
                <th className="table-th text-right">% del plan</th>
              </tr>
            </thead>
            <tbody>
              {sortedVarieties.filter((v) => (varietyTotals[v] ?? 0) > 0).map((varKey) => {
                const col = VARIETY_COLORS[varKey]
                const total = varietyTotals[varKey] ?? 0
                const grandTotal = Object.values(varietyTotals).reduce((s, v) => s + v, 0)
                const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0
                const activeSemsForVar = SEMANAS.filter((s) => (byVariety[varKey][s.key] ?? 0) > 0)
                const firstSem = activeSemsForVar[0]?.label ?? '—'
                const lastSem = activeSemsForVar[activeSemsForVar.length - 1]?.label ?? '—'
                return (
                  <tr key={varKey} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="table-td">
                      {col ? (
                        <span
                          className="badge"
                          style={{
                            backgroundColor: `rgba(${col.r},${col.g},${col.b},0.15)`,
                            color: `rgb(${Math.round(col.r * 0.6)},${Math.round(col.g * 0.6)},${Math.round(col.b * 0.6)})`,
                          }}
                        >
                          {col.label}
                        </span>
                      ) : (
                        <span>{varKey}</span>
                      )}
                    </td>
                    <td className="table-td text-gray-600">{firstSem}</td>
                    <td className="table-td text-gray-600">{lastSem}</td>
                    <td className="table-td text-right font-semibold">{fmtKg(total)}</td>
                    <td className="table-td text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: col ? `rgb(${col.r},${col.g},${col.b})` : '#9ca3af',
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-10 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                <td className="table-td text-gray-900">Total</td>
                <td className="table-td" colSpan={2} />
                <td className="table-td text-right text-gray-900">
                  {fmtKg(Object.values(varietyTotals).reduce((s, v) => s + v, 0))}
                </td>
                <td className="table-td text-right text-gray-600">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
