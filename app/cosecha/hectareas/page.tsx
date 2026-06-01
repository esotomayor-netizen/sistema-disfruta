'use client'

import { useState, useEffect } from 'react'
import { PRODUCTORES, PROGRAMACION_SEMANAL, HECTAREAS_DATA, fmtKg, TEMPORADA } from '@/lib/cosecha-data'
import { saveKgProgramado, loadKgProgramado } from '@/lib/cosecha-store'

const CURRENT_YEAR = 2027

function estadoCapacidad(pct: number | null): { label: string; color: string } {
  if (pct === null) return { label: 'Sin dato Ha.', color: 'bg-gray-100 text-gray-500' }
  if (pct > 1.2) return { label: 'Sobredimensionado', color: 'bg-red-100 text-red-700' }
  if (pct > 1.0) return { label: 'Al límite', color: 'bg-orange-100 text-orange-700' }
  if (pct >= 0.7) return { label: 'Uso normal', color: 'bg-green-100 text-green-700' }
  return { label: 'Subutilizado', color: 'bg-yellow-100 text-yellow-700' }
}

function getKgPorProductor(nombreHuerto: string): number {
  return PROGRAMACION_SEMANAL
    .filter((r) => r.productor === nombreHuerto)
    .reduce((s, r) => s + r.totalKg, 0)
}

export default function HectareasPage() {
  const [kgProgramado, setKgProgramado] = useState<Record<string, number>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = loadKgProgramado()
    const initial: Record<string, number> = {}
    for (const p of PRODUCTORES) {
      const fromProg = getKgPorProductor(p.nombreHuerto)
      initial[p.nombreHuerto] = saved[p.nombreHuerto] ?? fromProg
    }
    setKgProgramado(initial)
    setMounted(true)
  }, [])

  function updateKg(huerto: string, value: number) {
    const updated = { ...kgProgramado, [huerto]: value }
    setKgProgramado(updated)
    saveKgProgramado(updated)
  }

  // KPI totals
  const totalHa = HECTAREAS_DATA.reduce((s, d) => s + (d.haCerezoTotal ?? 0), 0)
  const totalKgProg = mounted
    ? Object.values(kgProgramado).reduce((s, v) => s + v, 0)
    : PROGRAMACION_SEMANAL.reduce((s, r) => s + r.totalKg, 0)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <a href="/cosecha" className="text-gray-400 hover:text-gray-600 text-sm">← Inicio</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600 font-medium">Hectáreas y Rendimiento</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌿</span>
          <h1 className="text-2xl font-bold text-gray-900">Hectáreas y Rendimiento por Productor</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Temporada {TEMPORADA} · Superficie plantada, rendimiento esperado y validación de KG programados vs capacidad real del huerto
        </p>
      </div>

      {/* Info banner */}
      <div className="mb-5 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800 flex items-start gap-2">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          Solo la columna <strong>KG Programado</strong> es editable. Los datos de hectáreas y año de plantación provienen del Excel oficial.
        </span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{PRODUCTORES.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total productores</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-700">{fmtKg(totalKgProg)}</p>
          <p className="text-sm text-gray-500 mt-1">Total KG programados</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-700">18.000</p>
          <p className="text-sm text-gray-500 mt-1">kg/ha rendimiento estimado</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-700">{totalHa.toFixed(1)} ha</p>
          <p className="text-sm text-gray-500 mt-1">Total Ha registradas</p>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Detalle por Productor</h2>
          <span className="text-xs text-gray-400">
            Rendimiento referencial: &lt;4 años = 3.000 kg/ha · 4-7 años = 8.000 kg/ha · 7-12 años = 14.000 kg/ha · &gt;12 años = 18.000 kg/ha
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="table-th w-8">#</th>
                <th className="table-th">Razón Social / Huerto</th>
                <th className="table-th text-right">Ha. Cerezo</th>
                <th className="table-th text-right">Año Plant.</th>
                <th className="table-th text-right">Edad</th>
                <th className="table-th text-right">Rend. Est. kg/ha</th>
                <th className="table-th text-right">KG Esp. Total</th>
                <th className="table-th text-right bg-blue-50">KG Program.</th>
                <th className="table-th text-right">Diferencia</th>
                <th className="table-th text-right">% Uso</th>
                <th className="table-th text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTORES.map((p, idx) => {
                const hData = HECTAREAS_DATA.find((d) => d.nombreHuerto === p.nombreHuerto)
                const haCerezo = hData?.haCerezoTotal ?? null
                const anioPlantacion = hData?.anioPlantacionPrincipal ?? null
                const rendEstKgHa = hData?.rendEstKgHa ?? 18000
                const kgEsperado = hData?.kgEsperadoTotal ?? null
                const edad = anioPlantacion ? CURRENT_YEAR - anioPlantacion : null

                const kgProg = mounted ? (kgProgramado[p.nombreHuerto] ?? 0) : getKgPorProductor(p.nombreHuerto)
                const diferencia = kgEsperado !== null ? kgProg - kgEsperado : null
                const pctUso = kgEsperado !== null && kgEsperado > 0 ? kgProg / kgEsperado : null
                const estado = estadoCapacidad(pctUso)

                return (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="table-td text-gray-400">{idx + 1}</td>
                    <td className="table-td">
                      <p className="font-semibold text-gray-900">{p.nombreHuerto}</p>
                      <p className="text-gray-400 text-[10px] truncate max-w-[200px]">{p.razonSocial}</p>
                    </td>
                    <td className="table-td text-right">
                      {haCerezo !== null
                        ? <span className="font-medium">{haCerezo.toFixed(1)} ha</span>
                        : <span className="text-amber-500">✏️ pendiente</span>
                      }
                    </td>
                    <td className="table-td text-right text-gray-600">
                      {anioPlantacion !== null
                        ? anioPlantacion
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="table-td text-right text-gray-600">
                      {edad !== null
                        ? <span>{edad} años</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="table-td text-right text-gray-600">
                      {rendEstKgHa.toLocaleString('es-CL')}
                    </td>
                    <td className="table-td text-right text-gray-600">
                      {kgEsperado !== null ? fmtKg(kgEsperado) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="table-td text-right bg-blue-50/30">
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={mounted ? (kgProgramado[p.nombreHuerto] ?? '') : ''}
                        onChange={(e) => updateKg(p.nombreHuerto, Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-24 text-right font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </td>
                    <td className="table-td text-right">
                      {diferencia !== null ? (
                        <span className={diferencia >= 0 ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
                          {diferencia >= 0 ? '+' : ''}{fmtKg(diferencia)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="table-td text-right">
                      {pctUso !== null ? (
                        <span className={`font-bold ${pctUso > 1 ? 'text-red-600' : 'text-green-700'}`}>
                          {(pctUso * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="table-td text-center">
                      <span className={`badge text-[10px] ${estado.color}`}>{estado.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-900 text-white">
                <td colSpan={6} className="table-td font-bold text-white">TOTAL GENERAL</td>
                <td className="table-td text-right font-bold text-green-400">
                  {fmtKg(HECTAREAS_DATA.reduce((s, d) => s + (d.kgEsperadoTotal ?? 0), 0))}
                </td>
                <td className="table-td text-right font-bold text-blue-300">
                  {fmtKg(totalKgProg)}
                </td>
                <td colSpan={3} className="table-td text-gray-400 text-xs">
                  {totalHa > 0 ? `${totalHa.toFixed(1)} ha registradas` : 'Ha. pendientes de ingreso'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Footnote */}
      <p className="text-xs text-gray-400 mt-3">
        📌 Rendimiento referencial: &lt;4 años = 3.000 kg/ha · 4-7 años = 8.000 kg/ha · 7-12 años = 14.000 kg/ha · &gt;12 años = 18.000 kg/ha
      </p>
    </div>
  )
}
