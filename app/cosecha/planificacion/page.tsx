import {
  SEMANAS,
  PROGRAMACION_SEMANAL,
  getResumenPorVariedad,
  fmtKg,
  TEMPORADA,
} from '@/lib/cosecha-data'

export const dynamic = 'force-static'

const COLORES_VARIEDAD: Record<string, string> = {
  SANTINA:    'bg-rose-100 text-rose-800',
  LAPINS:     'bg-green-100 text-green-800',
  REGINA:     'bg-purple-100 text-purple-800',
  BING:       'bg-orange-100 text-orange-800',
  'SWEET HEART': 'bg-pink-100 text-pink-800',
  BROOKS:     'bg-sky-100 text-sky-800',
  VAN:        'bg-teal-100 text-teal-800',
  KORDIA:     'bg-amber-100 text-amber-800',
  'ROYAL DAWN': 'bg-indigo-100 text-indigo-800',
  SKEENA:     'bg-lime-100 text-lime-800',
  FRISCO:     'bg-yellow-100 text-yellow-800',
}

function celColor(kg: number): string {
  if (kg === 0) return 'text-gray-300'
  if (kg >= 100000) return 'font-bold text-green-700 bg-green-50'
  if (kg >= 50000)  return 'font-semibold text-green-600'
  if (kg >= 10000)  return 'text-blue-600'
  return 'text-gray-700'
}

export default function PlanificacionPage() {
  const resumen = getResumenPorVariedad()

  // Agrupar por variedad
  const porVariedad: Record<string, typeof PROGRAMACION_SEMANAL> = {}
  for (const row of PROGRAMACION_SEMANAL) {
    if (!porVariedad[row.variedad]) porVariedad[row.variedad] = []
    porVariedad[row.variedad].push(row)
  }

  const totalPorSemana: Record<string, number> = {}
  for (const sem of SEMANAS) totalPorSemana[sem.key] = 0
  for (const row of PROGRAMACION_SEMANAL) {
    for (const sem of SEMANAS) {
      totalPorSemana[sem.key] += row[sem.key] as number
    }
  }
  const totalGeneral = PROGRAMACION_SEMANAL.reduce((s, r) => s + r.totalKg, 0)

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <a href="/cosecha" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600 font-medium">Planificación Semanal</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <h1 className="text-2xl font-bold text-gray-900">Programación Semanal de Kilos</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Temporada {TEMPORADA} · Sem 44 (26 Oct) → Sem 2 (10 Ene 2027) · Total: {fmtKg(totalGeneral)}
        </p>
      </div>

      {/* Resumen por variedad */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Resumen Consolidado por Variedad</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {resumen.map((v) => (
            <div key={v.variedad} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className={`badge mb-2 ${COLORES_VARIEDAD[v.variedad] ?? 'bg-gray-100 text-gray-700'}`}>{v.variedad}</p>
              <p className="text-lg font-bold text-gray-900">{fmtKg(v.totalKg)}</p>
              <p className="text-xs text-gray-500">{(v.pctTotal * 100).toFixed(1)}% del total</p>
              <p className="text-xs text-gray-400 mt-1">KG 2J+: {fmtKg(v.kg2JMasGrandes)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla principal por variedad */}
      {Object.entries(porVariedad).map(([variedad, filas]) => {
        const totSem: Record<string, number> = {}
        for (const sem of SEMANAS) {
          totSem[sem.key] = filas.reduce((s, r) => s + ((r as Record<string, unknown>)[sem.key] as number), 0)
        }
        const totKg = filas.reduce((s, r) => s + r.totalKg, 0)

        return (
          <div key={variedad} className="card mb-4">
            <div className="flex items-center gap-3 mb-3">
              <span className={`badge text-sm ${COLORES_VARIEDAD[variedad] ?? 'bg-gray-100 text-gray-700'}`}>
                {variedad}
              </span>
              <span className="text-sm font-semibold text-gray-700">{fmtKg(totKg)}</span>
              <span className="text-xs text-gray-400">{filas.length} productor{filas.length > 1 ? 'es' : ''}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-th w-40 min-w-[140px]">Productor</th>
                    {SEMANAS.map((s) => (
                      <th key={s.key} className="table-th text-right">{s.label}</th>
                    ))}
                    <th className="table-th text-right font-bold">TOTAL</th>
                    <th className="table-th text-right">2J+</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="table-td font-medium text-gray-700 truncate max-w-[150px]" title={fila.productor}>
                        {fila.productor}
                      </td>
                      {SEMANAS.map((s) => {
                        const kg = fila[s.key] as number
                        return (
                          <td key={s.key} className={`table-td text-right ${celColor(kg)}`}>
                            {kg > 0 ? (kg / 1000).toFixed(0) + 't' : '—'}
                          </td>
                        )
                      })}
                      <td className="table-td text-right font-bold text-gray-900">
                        {(fila.totalKg / 1000).toFixed(0)}t
                      </td>
                      <td className="table-td text-right text-gray-500">
                        {(fila.kg2JMasGrandes / 1000).toFixed(0)}t
                      </td>
                    </tr>
                  ))}
                  {/* Subtotal */}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="table-td text-gray-700">SUBTOTAL {variedad}</td>
                    {SEMANAS.map((s) => (
                      <td key={s.key} className={`table-td text-right ${totSem[s.key] > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                        {totSem[s.key] > 0 ? (totSem[s.key] / 1000).toFixed(0) + 't' : '—'}
                      </td>
                    ))}
                    <td className="table-td text-right font-bold text-green-700">
                      {(totKg / 1000).toFixed(0)}t
                    </td>
                    <td className="table-td text-right text-gray-600">
                      {(filas.reduce((s,r) => s + r.kg2JMasGrandes, 0) / 1000).toFixed(0)}t
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* Total general */}
      <div className="card bg-gray-900 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">TOTAL GENERAL TEMPORADA</h2>
          <span className="text-2xl font-bold text-green-400">{fmtKg(totalGeneral)}</span>
        </div>
        <div className="grid grid-cols-11 gap-1">
          {SEMANAS.map((s) => (
            <div key={s.key} className="text-center">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="text-sm font-semibold text-white">
                {totalPorSemana[s.key] > 0 ? (totalPorSemana[s.key] / 1000).toFixed(0) + 't' : '—'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
