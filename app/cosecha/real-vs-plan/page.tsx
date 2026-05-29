'use client'

import { useState } from 'react'
import {
  SEMANAS,
  TEMPORADA,
  getResumenPorVariedad,
  fmtKg,
} from '@/lib/cosecha-data'

// Esta página permite ingresar los KG reales de cosecha y calcula la brecha
export default function RealVsPlanPage() {
  const resumen = getResumenPorVariedad()

  // Estado local para kilos reales ingresados (variedad → semana → kg)
  const [realData, setRealData] = useState<Record<string, Record<string, number>>>({})

  function setKgReal(variedad: string, semKey: string, value: string) {
    const num = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0
    setRealData((prev) => ({
      ...prev,
      [variedad]: { ...(prev[variedad] ?? {}), [semKey]: num },
    }))
  }

  function getReal(variedad: string, semKey: string): number {
    return realData[variedad]?.[semKey] ?? 0
  }

  function getTotalReal(variedad: string): number {
    return SEMANAS.reduce((s, sem) => s + getReal(variedad, sem.key), 0)
  }

  function getEstadoBrecha(plan: number, real: number) {
    if (plan === 0 && real === 0) return null
    if (real === 0) return 'sin_dato'
    const pct = real / plan
    if (pct >= 0.95) return 'ok'
    if (pct >= 0.8) return 'leve'
    return 'critico'
  }

  const totalPlan = resumen.reduce((s, v) => s + v.totalKg, 0)
  const totalReal = resumen.reduce((s, v) => s + getTotalReal(v.variedad), 0)

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <a href="/cosecha" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600 font-medium">Real vs Planificado</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <h1 className="text-2xl font-bold text-gray-900">Cosecha Real vs Planificado</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Temporada {TEMPORADA} · Ingresar KG reales recibidos en packing cada semana
        </p>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6 text-sm text-blue-800 flex items-start gap-2">
        <span className="text-lg">✏️</span>
        <div>
          <p className="font-medium mb-1">Ingreso manual de datos</p>
          <p>Ingresa los kilos reales de cada variedad por semana. El sistema calcula automáticamente la brecha respecto al plan. Los datos se guardan en la sesión actual.</p>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Total Planificado</p>
          <p className="text-2xl font-bold text-gray-900">{fmtKg(totalPlan)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Total Real Ingresado</p>
          <p className={`text-2xl font-bold ${totalReal === 0 ? 'text-gray-400' : totalReal >= totalPlan * 0.9 ? 'text-green-700' : 'text-orange-600'}`}>
            {totalReal === 0 ? '—' : fmtKg(totalReal)}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Brecha Acumulada</p>
          {totalReal === 0 ? (
            <p className="text-2xl font-bold text-gray-400">⏳ Sin datos</p>
          ) : (
            <p className={`text-2xl font-bold ${totalReal >= totalPlan ? 'text-green-700' : 'text-red-600'}`}>
              {totalReal >= totalPlan ? '+' : ''}{fmtKg(totalReal - totalPlan)}
            </p>
          )}
        </div>
      </div>

      {/* Tabla principal */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="table-th w-28 min-w-[110px]">Variedad</th>
                <th className="table-th text-center w-16">Fila</th>
                {SEMANAS.map((s) => (
                  <th key={s.key} className="table-th text-center min-w-[72px]">{s.label}</th>
                ))}
                <th className="table-th text-right">TOTAL</th>
                <th className="table-th text-right">BRECHA</th>
              </tr>
            </thead>
            <tbody>
              {resumen.map((v) => {
                const totalRealV = getTotalReal(v.variedad)
                const brecha = totalRealV - v.totalKg
                const pctBrecha = v.totalKg > 0 ? totalRealV / v.totalKg : 0

                return (
                  <>
                    {/* Fila PLAN */}
                    <tr key={`${v.variedad}-plan`} className="border-b border-gray-50 bg-gray-50/50">
                      <td className="table-td font-semibold text-gray-800" rowSpan={3}>
                        <div className="font-bold text-sm text-gray-900">{v.variedad}</div>
                      </td>
                      <td className="table-td text-center">
                        <span className="badge bg-blue-100 text-blue-800">PLAN</span>
                      </td>
                      {SEMANAS.map((s) => {
                        const kg = v.porSemana[s.key] ?? 0
                        return (
                          <td key={s.key} className={`table-td text-right font-mono ${kg > 0 ? 'text-blue-700' : 'text-gray-300'}`}>
                            {kg > 0 ? (kg / 1000).toFixed(0) + 't' : '—'}
                          </td>
                        )
                      })}
                      <td className="table-td text-right font-bold text-blue-700">{fmtKg(v.totalKg)}</td>
                      <td className="table-td" />
                    </tr>

                    {/* Fila REAL */}
                    <tr key={`${v.variedad}-real`} className="border-b border-gray-50">
                      <td className="table-td text-center">
                        <span className="badge bg-green-100 text-green-800">REAL</span>
                      </td>
                      {SEMANAS.map((s) => {
                        const planKg = v.porSemana[s.key] ?? 0
                        const realKg = getReal(v.variedad, s.key)
                        return (
                          <td key={s.key} className="table-td p-1">
                            {planKg > 0 ? (
                              <input
                                type="number"
                                min="0"
                                step="1000"
                                value={realKg || ''}
                                onChange={(e) => setKgReal(v.variedad, s.key, e.target.value)}
                                placeholder="0"
                                className="w-full border border-gray-200 rounded px-1.5 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-blue-50"
                              />
                            ) : (
                              <span className="block text-center text-gray-200">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="table-td text-right font-bold text-green-700">
                        {totalRealV > 0 ? fmtKg(totalRealV) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="table-td text-right">
                        {totalRealV > 0 ? (
                          <span className={`badge ${
                            pctBrecha >= 0.95 ? 'bg-green-100 text-green-700' :
                            pctBrecha >= 0.8 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {(pctBrecha * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">⏳</span>
                        )}
                      </td>
                    </tr>

                    {/* Fila BRECHA */}
                    <tr key={`${v.variedad}-brecha`} className="border-b-2 border-gray-200">
                      <td className="table-td text-center">
                        <span className="badge bg-gray-100 text-gray-600">Δ</span>
                      </td>
                      {SEMANAS.map((s) => {
                        const planKg = v.porSemana[s.key] ?? 0
                        const realKg = getReal(v.variedad, s.key)
                        const diff = realKg - planKg
                        return (
                          <td key={s.key} className={`table-td text-right font-mono text-xs ${
                            planKg === 0 ? 'text-gray-200' :
                            realKg === 0 ? 'text-gray-400' :
                            diff >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {planKg > 0 && realKg > 0 ? (diff >= 0 ? '+' : '') + (diff / 1000).toFixed(0) + 't' : '—'}
                          </td>
                        )
                      })}
                      <td className={`table-td text-right font-bold ${
                        totalRealV === 0 ? 'text-gray-400' : brecha >= 0 ? 'text-green-700' : 'text-red-600'
                      }`}>
                        {totalRealV > 0 ? (brecha >= 0 ? '+' : '') + fmtKg(Math.abs(brecha)) : '—'}
                      </td>
                      <td className="table-td" />
                    </tr>
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        <p>💡 Los valores ingresados son provisionales para esta sesión. En la versión con base de datos, se guardan y persisten entre sesiones.</p>
      </div>
    </div>
  )
}
