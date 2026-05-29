import {
  VARIEDADES,
  COMPROMISOS_CLIENTES,
  getResumenPorVariedad,
  fmtKg,
  fmtUSD,
  TEMPORADA,
  getRetornoEconomicoEstimado,
} from '@/lib/cosecha-data'

export const dynamic = 'force-static'

export default function ExportacionPage() {
  const resumen = getResumenPorVariedad()
  const retorno = getRetornoEconomicoEstimado()

  const comprometidoPorVariedad: Record<string, number> = {}
  for (const c of COMPROMISOS_CLIENTES) {
    comprometidoPorVariedad[c.variedad] = (comprometidoPorVariedad[c.variedad] ?? 0) + c.totalKgComprometido
  }

  const filas = resumen.map((v) => {
    const varDef = VARIEDADES.find((vd) => vd.codigo === v.variedad || vd.nombre.toUpperCase() === v.variedad)
    const pctExp = varDef?.pctExportacion ?? 0.85
    const kgCampo = v.totalKg
    const kgExp = Math.round(kgCampo * pctExp)
    const kgDesc = kgCampo - kgExp
    const kgComp = comprometidoPorVariedad[v.variedad] ?? 0
    const kgLibres = kgExp - kgComp
    const ret = retorno.find((r) => r.variedad === v.variedad)
    return { variedad: v.variedad, kgCampo, pctExp, pctDesc: 1 - pctExp, kgExp, kgDesc, kgComp, kgLibres, retornoUSD: ret?.retornoUSD ?? 0 }
  })

  const totCampo = filas.reduce((s, f) => s + f.kgCampo, 0)
  const totExp   = filas.reduce((s, f) => s + f.kgExp, 0)
  const totDesc  = filas.reduce((s, f) => s + f.kgDesc, 0)
  const totComp  = filas.reduce((s, f) => s + f.kgComp, 0)
  const totLibre = filas.reduce((s, f) => s + f.kgLibres, 0)
  const totRetorno = filas.reduce((s, f) => s + f.retornoUSD, 0)
  const pctExpTotal = totCampo > 0 ? totExp / totCampo : 0

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <a href="/cosecha" className="text-gray-400 hover:text-gray-600 text-sm">← Inicio</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600 font-medium">Exportación y Descarte</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">📦</span>
          <h1 className="text-2xl font-bold text-gray-900">Exportación y Descarte por Variedad</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Temporada {TEMPORADA} · KG exportables reales descontando descarte estimado · base para comprometer con clientes en destino
        </p>
      </div>

      {/* Nota */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6 text-sm text-blue-800 flex items-start gap-2">
        <span className="text-lg">ℹ️</span>
        <p>% Exportación referencial basado en liquidaciones Asoex 2024-2025. Actualizar con datos propios de cada temporada.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-900">{fmtKg(totCampo)}</p>
          <p className="text-sm text-gray-500 mt-1">KG Campo total</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-700">{fmtKg(totExp)}</p>
          <p className="text-xs text-gray-500 mt-1">KG Exportables ({(pctExpTotal*100).toFixed(0)}%)</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-orange-600">{fmtKg(totDesc)}</p>
          <p className="text-xs text-gray-500 mt-1">KG Descarte ({((1-pctExpTotal)*100).toFixed(0)}%)</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-700">{fmtKg(totLibre)}</p>
          <p className="text-sm text-gray-500 mt-1">KG Libres para venta</p>
        </div>
      </div>

      {/* Gráfico visual de proporción export/descarte */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Proporción Exportación vs Descarte por Variedad</h2>
        <div className="space-y-3">
          {filas.map((f) => (
            <div key={f.variedad}>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span className="font-medium w-32">{f.variedad}</span>
                <span className="text-green-700">Export: {(f.pctExp*100).toFixed(0)}%</span>
                <span className="text-orange-600">Descarte: {(f.pctDesc*100).toFixed(0)}%</span>
                <span className="text-gray-500">{fmtKg(f.kgCampo)}</span>
              </div>
              <div className="flex h-5 rounded-full overflow-hidden">
                <div className="bg-green-500 flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ width: `${f.pctExp*100}%` }}>
                  {f.pctExp*100 >= 15 ? `${(f.pctExp*100).toFixed(0)}%` : ''}
                </div>
                <div className="bg-orange-400 flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ width: `${f.pctDesc*100}%` }}>
                  {f.pctDesc*100 >= 8 ? `${(f.pctDesc*100).toFixed(0)}%` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
          <span className="flex items-center gap-1.5 text-xs text-gray-600"><span className="w-3 h-3 rounded bg-green-500" />Exportable</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-600"><span className="w-3 h-3 rounded bg-orange-400" />Descarte</span>
        </div>
      </div>

      {/* Tabla principal */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Tabla Detalle — Exportación y Descarte</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="table-th">Variedad</th>
                <th className="table-th text-right">KG Campo</th>
                <th className="table-th text-right">% Export. Est.</th>
                <th className="table-th text-right">% Descarte</th>
                <th className="table-th text-right">KG Exportables</th>
                <th className="table-th text-right">KG Descarte</th>
                <th className="table-th text-right">KG Comprometidos</th>
                <th className="table-th text-right">KG Libres</th>
                <th className="table-th text-right">Retorno Est.</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.variedad} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="table-td font-semibold text-gray-900">{f.variedad}</td>
                  <td className="table-td text-right text-gray-600">{fmtKg(f.kgCampo)}</td>
                  <td className="table-td text-right">
                    <span className="font-semibold text-green-700">{(f.pctExp*100).toFixed(0)}%</span>
                  </td>
                  <td className="table-td text-right">
                    <span className="text-orange-600">{(f.pctDesc*100).toFixed(0)}%</span>
                  </td>
                  <td className="table-td text-right font-semibold text-green-700">{fmtKg(f.kgExp)}</td>
                  <td className="table-td text-right text-orange-600">{fmtKg(f.kgDesc)}</td>
                  <td className="table-td text-right text-blue-700">{f.kgComp > 0 ? fmtKg(f.kgComp) : <span className="text-gray-300">—</span>}</td>
                  <td className={`table-td text-right font-bold ${f.kgLibres >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {fmtKg(f.kgLibres)}
                  </td>
                  <td className="table-td text-right font-semibold text-amber-700">
                    {f.retornoUSD > 0 ? fmtUSD(f.retornoUSD) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-900 text-white">
                <td className="table-td font-bold text-white">TOTAL</td>
                <td className="table-td text-right font-bold text-white">{fmtKg(totCampo)}</td>
                <td className="table-td text-right text-green-400">{(pctExpTotal*100).toFixed(0)}%</td>
                <td className="table-td text-right text-orange-400">{((1-pctExpTotal)*100).toFixed(0)}%</td>
                <td className="table-td text-right font-bold text-green-400">{fmtKg(totExp)}</td>
                <td className="table-td text-right text-orange-400">{fmtKg(totDesc)}</td>
                <td className="table-td text-right text-blue-400">{fmtKg(totComp)}</td>
                <td className="table-td text-right font-bold text-green-400">{fmtKg(totLibre)}</td>
                <td className="table-td text-right font-bold text-amber-400">{fmtUSD(totRetorno)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
