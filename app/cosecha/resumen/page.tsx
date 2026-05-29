import Link from 'next/link'
import { getResumenPorVariedad, SEMANAS, fmtKg } from '@/lib/cosecha-data'

export const dynamic = 'force-static'

function heatColor(kg: number, maxKg: number): string {
  if (kg === 0 || maxKg === 0) return ''
  const ratio = kg / maxKg
  if (ratio > 0.75) return 'bg-green-700 text-white'
  if (ratio > 0.5)  return 'bg-green-500 text-white'
  if (ratio > 0.25) return 'bg-green-200 text-green-900'
  return 'bg-green-50 text-green-800'
}

export default function ResumenPage() {
  const resumen = getResumenPorVariedad()

  const totalGeneral = resumen.reduce((s, v) => s + v.totalKg, 0)
  const totalKg2J = resumen.reduce((s, v) => s + v.kg2JMasGrandes, 0)
  const pctKg2J = totalGeneral > 0 ? (totalKg2J / totalGeneral) * 100 : 0

  // Semana pico
  const totalPorSemana: Record<string, number> = {}
  for (const sem of SEMANAS) totalPorSemana[sem.key] = 0
  for (const v of resumen) {
    for (const sem of SEMANAS) {
      totalPorSemana[sem.key] = (totalPorSemana[sem.key] ?? 0) + (v.porSemana[sem.key] ?? 0)
    }
  }
  const semanaPico = SEMANAS.reduce((max, sem) =>
    (totalPorSemana[sem.key] ?? 0) > (totalPorSemana[max.key] ?? 0) ? sem : max
  )

  const variedadPrincipal = resumen[0]?.variedad ?? '—'

  // Max por semana para heatmap
  const allValues = resumen.flatMap((v) => SEMANAS.map((s) => v.porSemana[s.key] ?? 0))
  const maxKg = Math.max(...allValues, 1)

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link href="/cosecha" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          ← Inicio
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">📈</span>
          <h1 className="text-2xl font-bold text-gray-900">Resumen Consolidado por Variedad — Temporada 2025-2026</h1>
        </div>
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-blue-700 text-sm max-w-2xl">
          <span className="text-base mt-0.5">ℹ️</span>
          <span>
            Los valores se obtienen sumando todos los productores de cada variedad desde Programación Semanal.
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-xs font-medium text-gray-500 mb-1">Total KG Temporada</p>
          <p className="text-2xl font-bold text-gray-900">{fmtKg(totalGeneral)}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 mb-1">Semana Pico</p>
          <p className="text-2xl font-bold text-gray-900">{semanaPico.label}</p>
          <p className="text-xs text-gray-400 mt-1">{fmtKg(totalPorSemana[semanaPico.key] ?? 0)}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 mb-1">Variedad Principal</p>
          <p className="text-2xl font-bold text-green-700">{variedadPrincipal}</p>
          <p className="text-xs text-gray-400 mt-1">{fmtKg(resumen[0]?.totalKg ?? 0)}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 mb-1">% KG 2J+</p>
          <p className="text-2xl font-bold text-gray-900">{pctKg2J.toFixed(1)}%</p>
          <p className="text-xs text-gray-400 mt-1">{fmtKg(totalKg2J)} de {fmtKg(totalGeneral)}</p>
        </div>
      </div>

      {/* Tabla consolidada */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th sticky left-0 bg-gray-50 z-10">Variedad</th>
                {SEMANAS.map((s) => (
                  <th key={s.key} className="table-th text-center whitespace-nowrap">{s.label}</th>
                ))}
                <th className="table-th text-right font-bold">TOTAL KG</th>
                <th className="table-th text-right">KG 2J+</th>
                <th className="table-th text-right">% del Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resumen.map((v) => (
                <tr key={v.variedad} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td font-semibold text-gray-900 sticky left-0 bg-white z-10 whitespace-nowrap">
                    {v.variedad}
                  </td>
                  {SEMANAS.map((s) => {
                    const kg = v.porSemana[s.key] ?? 0
                    return (
                      <td
                        key={s.key}
                        className={`px-2 py-3 text-center font-medium transition-colors ${heatColor(kg, maxKg)}`}
                      >
                        {kg > 0 ? fmtKg(kg) : <span className="text-gray-200">—</span>}
                      </td>
                    )
                  })}
                  <td className="table-td text-right font-bold text-gray-900 whitespace-nowrap">
                    {fmtKg(v.totalKg)}
                  </td>
                  <td className="table-td text-right text-gray-600 whitespace-nowrap">
                    {fmtKg(v.kg2JMasGrandes)}
                  </td>
                  <td className="table-td text-right font-semibold text-green-700">
                    {(v.pctTotal * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}

              {/* Fila TOTAL GENERAL */}
              <tr className="bg-gray-800 text-white">
                <td className="px-4 py-3 font-bold text-white sticky left-0 bg-gray-800 z-10 text-xs uppercase tracking-wider whitespace-nowrap">
                  TOTAL GENERAL
                </td>
                {SEMANAS.map((s) => (
                  <td key={s.key} className="px-2 py-3 text-center font-bold text-white text-xs whitespace-nowrap">
                    {(totalPorSemana[s.key] ?? 0) > 0 ? fmtKg(totalPorSemana[s.key] ?? 0) : '—'}
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-bold text-white text-xs whitespace-nowrap">
                  {fmtKg(totalGeneral)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-white text-xs whitespace-nowrap">
                  {fmtKg(totalKg2J)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-white text-xs">100%</td>
              </tr>

              {/* Fila % s/ Total */}
              <tr className="bg-gray-100">
                <td className="px-4 py-2 font-semibold text-gray-600 sticky left-0 bg-gray-100 z-10 text-xs italic whitespace-nowrap">
                  % s/ Total
                </td>
                {SEMANAS.map((s) => {
                  const kg = totalPorSemana[s.key] ?? 0
                  const pct = totalGeneral > 0 ? (kg / totalGeneral) * 100 : 0
                  return (
                    <td key={s.key} className="px-2 py-2 text-center text-xs text-gray-500 italic">
                      {pct > 0 ? `${pct.toFixed(1)}%` : '—'}
                    </td>
                  )
                })}
                <td className="px-4 py-2 text-right text-xs text-gray-500 italic">100%</td>
                <td className="px-4 py-2 text-right text-xs text-gray-500 italic">
                  {pctKg2J.toFixed(1)}%
                </td>
                <td className="px-4 py-2 text-right text-xs text-gray-500 italic">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
