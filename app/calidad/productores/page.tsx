'use client'

import { useEffect, useState } from 'react'

type DefectoInfo = {
  valor: number
  pctPropio: number
  pctGlobal: number
  label: string
  tipo: string
}

type Productor = {
  productor: string
  muestras: number
  totalDefectos: number
  pctDelGlobal: number
  frutaSanaPromedio: number
  variedades: string[]
  decisiones: Record<string, number>
  defectos: Record<string, DefectoInfo>
}

type GlobalData = {
  totalMuestras: number
  totalDefectos: number
  defectos: Record<string, { valor: number; pctGlobal: number; label: string; tipo: string }>
}

type MetaDefecto = { key: string; label: string; tipo: string }

type ApiResponse = {
  productores: Productor[]
  global: GlobalData
  metaDefectos: MetaDefecto[]
}

const TIPO_COLOR: Record<string, string> = {
  condicion: 'text-red-700 bg-red-50',
  calidad: 'text-orange-700 bg-orange-50',
}

function PctBar({ value, max, tipo }: { value: number; max: number; tipo: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  const color = tipo === 'condicion' ? 'bg-red-400' : 'bg-orange-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden min-w-[60px]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

export default function ProductoresPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [filterTipo, setFilterTipo] = useState<'todos' | 'condicion' | 'calidad'>('todos')
  const [sortBy, setSortBy] = useState<'pctPropio' | 'pctGlobal' | 'valor'>('pctPropio')

  useEffect(() => {
    fetch('/api/calidad/productores')
      .then((r) => r.json())
      .then((d: ApiResponse) => {
        setData(d)
        if (d.productores.length > 0) setSelected(d.productores[0].productor)
      })
  }, [])

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400">Cargando análisis...</p>
    </div>
  )

  const productor = data.productores.find((p) => p.productor === selected)

  const defectosOrdenados = productor
    ? Object.entries(productor.defectos)
        .filter(([, d]) => filterTipo === 'todos' || d.tipo === filterTipo)
        .filter(([, d]) => d.valor > 0)
        .sort((a, b) => b[1][sortBy] - a[1][sortBy])
    : []

  const maxPctPropio = defectosOrdenados.reduce((m, [, d]) => Math.max(m, d.pctPropio), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Análisis por Productor</h1>
        <p className="text-gray-500 text-sm mt-1">Defectos: % sobre total propio y % sobre total global</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: producer list */}
        <div className="lg:col-span-1">
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Productores</p>
              <p className="text-xs text-gray-400 mt-0.5">Ordenados por total defectos</p>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {data.productores.map((p) => (
                <button
                  key={p.productor}
                  onClick={() => setSelected(p.productor)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selected === p.productor ? 'bg-red-50 border-l-4 border-red-500' : ''}`}
                >
                  <p className="text-sm font-medium text-gray-800 truncate leading-tight">{p.productor}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{p.muestras} muestras</span>
                    <span className="text-xs font-semibold text-red-600">{p.pctDelGlobal}% global</span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-1 overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full"
                      style={{ width: `${Math.min(p.pctDelGlobal * 4, 100)}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main panel */}
        <div className="lg:col-span-3 space-y-5">
          {productor && (
            <>
              {/* Producer summary */}
              <div className="card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{productor.productor}</h2>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {productor.variedades.map((v) => (
                        <span key={v} className="badge bg-red-50 text-red-700">{v}</span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xl font-bold text-gray-800">{productor.muestras}</p>
                      <p className="text-xs text-gray-500">Muestras</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-green-600">{productor.frutaSanaPromedio.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">Fruta sana</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-red-600">{productor.pctDelGlobal}%</p>
                      <p className="text-xs text-gray-500">Del total global</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {Object.entries(productor.decisiones).map(([d, n]) => (
                    <span
                      key={d}
                      className={`badge ${d === 'A' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                    >
                      {d === 'A' ? 'Aceptadas' : 'Observadas'}: {n}
                    </span>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  {(['todos', 'condicion', 'calidad'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterTipo(t)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${filterTipo === t ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      {t === 'todos' ? 'Todos' : t === 'condicion' ? 'Condición' : 'Calidad'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-gray-500">Ordenar por:</span>
                  <select
                    className="input text-xs py-1"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  >
                    <option value="pctPropio">% Propio</option>
                    <option value="pctGlobal">% Global</option>
                    <option value="valor">Cantidad</option>
                  </select>
                </div>
              </div>

              {/* Defect table */}
              <div className="card overflow-hidden p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Defecto</th>
                      <th className="text-center px-3 py-3 font-medium text-gray-600">Tipo</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Gramos</th>
                      <th className="px-4 py-3 font-medium text-gray-600 min-w-[180px]">
                        % de {productor.productor.split(' ')[0]}
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-600 min-w-[140px]">% del Global</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {defectosOrdenados.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-gray-400 py-8">Sin defectos registrados</td>
                      </tr>
                    )}
                    {defectosOrdenados.map(([key, d]) => (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{d.label}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`badge text-xs ${TIPO_COLOR[d.tipo]}`}>
                            {d.tipo === 'condicion' ? 'Cond.' : 'Cal.'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-gray-700">{d.valor.toLocaleString('es-CL')}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <PctBar value={d.pctPropio} max={maxPctPropio} tipo={d.tipo} />
                            <span className="text-sm font-bold text-gray-800 w-12 text-right">{d.pctPropio.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden min-w-[60px]">
                              <div className="h-full bg-gray-500 rounded-full" style={{ width: `${Math.min(d.pctGlobal * 10, 100)}%` }} />
                            </div>
                            <span className="text-sm text-gray-600 w-12 text-right">{d.pctGlobal.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {defectosOrdenados.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 border-t-2 border-gray-200">
                        <td className="px-4 py-2.5 font-semibold text-gray-800" colSpan={2}>Total</td>
                        <td className="px-4 py-2.5 text-right font-bold font-mono text-gray-900">
                          {productor.totalDefectos.toLocaleString('es-CL')}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-sm font-bold text-gray-800">100%</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-sm font-bold text-red-600">{productor.pctDelGlobal}%</span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Global comparison note */}
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                <p className="font-medium text-gray-700 mb-1">Cómo leer esta tabla</p>
                <p><strong>% de {productor.productor.split(' ')[0]}</strong>: qué porcentaje representa ese defecto sobre el total de defectos del productor.</p>
                <p className="mt-1"><strong>% del Global</strong>: qué porcentaje representa ese defecto sobre el total de todos los defectos de todos los productores ({data.global.totalDefectos.toLocaleString('es-CL')} grs totales).</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
