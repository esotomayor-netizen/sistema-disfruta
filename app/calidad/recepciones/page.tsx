'use client'

import { useEffect, useState, useCallback } from 'react'

type Recepcion = {
  id: number
  lote: number
  guia: string
  fechaMuestra: string
  productor: string
  predioDescripcion: string
  variedad: string
  binsTotems: number
  decisionFinal: string | null
  clasificacionFinal: string | null
  tempPulpa: number | null
  resTotalDefectosM1: number | null
  resFrutaSanaM1: number | null
  condMachuconM1: number | null
  condSobremadurezM1: number | null
  condPudricionM1: number | null
  condPartiduraSuperficialM1: number | null
  condPittingM1: number | null
  calRussetM1: number | null
}

const VARIEDADES = ['SANTINA', 'ROYAL DAWN', 'BING', 'LAPINS', 'REGINA', 'KORDIA', 'SWEET HEART', 'SWEET ARYANA', 'STELLA']

function DecisionBadge({ d }: { d: string | null }) {
  if (d === 'A') return <span className="badge bg-green-100 text-green-800">Aceptada</span>
  if (d === 'O') return <span className="badge bg-yellow-100 text-yellow-800">Observada</span>
  return <span className="badge bg-gray-100 text-gray-600">–</span>
}

function ClasifBadge({ c }: { c: string | null }) {
  const map: Record<string, string> = { L: 'bg-blue-100 text-blue-800', M: 'bg-purple-100 text-purple-800', C: 'bg-pink-100 text-pink-800' }
  const label: Record<string, string> = { L: 'Large', M: 'Medium', C: 'Compact' }
  if (!c) return null
  return <span className={`badge ${map[c] ?? 'bg-gray-100 text-gray-600'}`}>{label[c] ?? c}</span>
}

export default function RecepcionesPage() {
  const [data, setData] = useState<Recepcion[]>([])
  const [loading, setLoading] = useState(true)
  const [productores, setProductores] = useState<string[]>([])
  const [filters, setFilters] = useState({ productor: '', variedad: '', decision: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.productor) params.set('productor', filters.productor)
    if (filters.variedad) params.set('variedad', filters.variedad)
    if (filters.decision) params.set('decision', filters.decision)
    const res = await fetch(`/api/calidad/recepciones?${params}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [filters])

  useEffect(() => {
    fetch('/api/calidad/recepciones')
      .then((r) => r.json())
      .then((d: Recepcion[]) => {
        const prods = [...new Set(d.map((r) => r.productor))].sort()
        setProductores(prods)
      })
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const fmt = (d: string) => new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Recepciones de Calidad</h1>
        <p className="text-gray-500 text-sm mt-1">Evaluaciones en planta · {data.length} registros</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Productor</label>
            <select
              className="input w-full"
              value={filters.productor}
              onChange={(e) => setFilters((f) => ({ ...f, productor: e.target.value }))}
            >
              <option value="">Todos</option>
              {productores.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Variedad</label>
            <select
              className="input w-full"
              value={filters.variedad}
              onChange={(e) => setFilters((f) => ({ ...f, variedad: e.target.value }))}
            >
              <option value="">Todas</option>
              {VARIEDADES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Decisión Final</label>
            <select
              className="input w-full"
              value={filters.decision}
              onChange={(e) => setFilters((f) => ({ ...f, decision: e.target.value }))}
            >
              <option value="">Todas</option>
              <option value="A">Aceptada</option>
              <option value="O">Observada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Lote</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Productor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Predio</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Variedad</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Bins</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">T°Pulpa</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Sana%</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Defectos</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Decisión</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Clasif.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr><td colSpan={11} className="text-center text-gray-400 py-8">Cargando...</td></tr>
              )}
              {!loading && data.length === 0 && (
                <tr><td colSpan={11} className="text-center text-gray-400 py-8">Sin resultados</td></tr>
              )}
              {!loading && data.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{fmt(r.fechaMuestra)}</td>
                  <td className="px-4 py-2.5 font-mono text-gray-700">{r.lote}</td>
                  <td className="px-4 py-2.5 text-gray-800 max-w-[180px] truncate" title={r.productor}>{r.productor}</td>
                  <td className="px-4 py-2.5 text-gray-600 max-w-[150px] truncate" title={r.predioDescripcion}>{r.predioDescripcion}</td>
                  <td className="px-4 py-2.5">
                    <span className="badge bg-red-50 text-red-700">{r.variedad}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{r.binsTotems}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{r.tempPulpa != null ? `${r.tempPulpa}°` : '–'}</td>
                  <td className="px-4 py-2.5 text-right">
                    {r.resFrutaSanaM1 != null ? (
                      <span className={`font-semibold ${r.resFrutaSanaM1 >= 80 ? 'text-green-600' : r.resFrutaSanaM1 >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {r.resFrutaSanaM1.toFixed(1)}%
                      </span>
                    ) : '–'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {r.resTotalDefectosM1 != null ? (
                      <span className="font-mono text-gray-700">{r.resTotalDefectosM1}</span>
                    ) : '–'}
                  </td>
                  <td className="px-4 py-2.5 text-center"><DecisionBadge d={r.decisionFinal} /></td>
                  <td className="px-4 py-2.5 text-center"><ClasifBadge c={r.clasificacionFinal} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
