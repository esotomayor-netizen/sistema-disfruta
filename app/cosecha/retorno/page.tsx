import {
  VARIEDADES,
  PRECIOS_CALIBRES,
  getRetornoEconomicoEstimado,
  getResumenPorVariedad,
  fmtKg,
  fmtUSD,
  TEMPORADA,
} from '@/lib/cosecha-data'

export const dynamic = 'force-static'

export default function RetornoPage() {
  const retorno = getRetornoEconomicoEstimado()
  const resumen = getResumenPorVariedad()

  const totalKg = resumen.reduce((s, v) => s + v.totalKg, 0)
  const totalExport = retorno.reduce((s, r) => s + r.kgExport, 0)
  const totalUSD = retorno.reduce((s, r) => s + r.retornoUSD, 0)

  // Escenarios bajo/alto
  const factorBajo = 0.75
  const factorAlto = 1.30
  const totalUSDAlto = Math.round(totalUSD * factorAlto)
  const totalUSDBajo = Math.round(totalUSD * factorBajo)

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <a href="/cosecha" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600 font-medium">Retorno Económico</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">💰</span>
          <h1 className="text-2xl font-bold text-gray-900">Retorno Económico Estimado</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Temporada {TEMPORADA} · Precio ref. ODEPA / Asoex 2025-2026 · Actualizar según negociación
        </p>
      </div>

      {/* Escenarios */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
          <p className="text-xs font-medium text-red-600 mb-1">Escenario Bajo</p>
          <p className="text-2xl font-bold text-red-700">{fmtUSD(totalUSDBajo)}</p>
          <p className="text-xs text-red-500 mt-1">-25% precios</p>
        </div>
        <div className="rounded-xl border border-green-300 bg-green-50 p-6 text-center shadow-sm">
          <p className="text-xs font-medium text-green-700 mb-1">Escenario Base</p>
          <p className="text-3xl font-bold text-green-700">{fmtUSD(totalUSD)}</p>
          <p className="text-xs text-green-600 mt-1">{fmtKg(totalExport)} exportables · {fmtKg(totalKg)} campo</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-center">
          <p className="text-xs font-medium text-blue-600 mb-1">Escenario Alto</p>
          <p className="text-2xl font-bold text-blue-700">{fmtUSD(totalUSDAlto)}</p>
          <p className="text-xs text-blue-500 mt-1">+30% precios</p>
        </div>
      </div>

      {/* Tabla de precios por calibre */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Tabla de Precios por Calibre (USD/kg)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-th">Calibre</th>
                <th className="table-th">Rango</th>
                <th className="table-th text-right">Precio Base</th>
                <th className="table-th text-right">Bajo</th>
                <th className="table-th text-right">Alto</th>
                <th className="table-th">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {PRECIOS_CALIBRES.map((p) => (
                <tr key={p.calibre} className="border-b border-gray-50 last:border-0">
                  <td className="table-td">
                    <span className="badge bg-gray-900 text-white font-mono font-bold">{p.calibre}</span>
                  </td>
                  <td className="table-td text-gray-500 font-mono">{p.rango}</td>
                  <td className="table-td text-right font-bold text-green-700">USD {p.precioUSD.toFixed(1)}</td>
                  <td className="table-td text-right text-red-600">USD {p.precioBajo.toFixed(1)}</td>
                  <td className="table-td text-right text-blue-600">USD {p.precioAlto.toFixed(1)}</td>
                  <td className="table-td text-gray-500">{p.descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retorno por variedad */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Retorno Estimado por Variedad</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-th">Variedad</th>
                <th className="table-th text-right">KG Campo</th>
                <th className="table-th text-right">% Export</th>
                <th className="table-th text-right">KG Exportable</th>
                <th className="table-th text-right">Precio Pond. USD/kg</th>
                <th className="table-th text-right">Retorno Est. USD</th>
              </tr>
            </thead>
            <tbody>
              {retorno.map((r) => (
                <tr key={r.variedad} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="table-td font-semibold text-gray-900">{r.variedad}</td>
                  <td className="table-td text-right text-gray-600">{fmtKg(r.totalKg)}</td>
                  <td className="table-td text-right text-gray-600">{(r.pctExportacion * 100).toFixed(0)}%</td>
                  <td className="table-td text-right font-medium text-blue-700">{fmtKg(r.kgExport)}</td>
                  <td className="table-td text-right font-mono text-gray-700">{r.precioPonderado.toFixed(2)}</td>
                  <td className="table-td text-right font-bold text-green-700">{fmtUSD(r.retornoUSD)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td colSpan={2} className="table-td font-bold text-gray-900">TOTAL TEMPORADA</td>
                <td className="table-td text-right text-gray-600">
                  {((totalExport / totalKg) * 100).toFixed(0)}%
                </td>
                <td className="table-td text-right font-bold text-blue-700">{fmtKg(totalExport)}</td>
                <td className="table-td" />
                <td className="table-td text-right font-bold text-green-700 text-base">{fmtUSD(totalUSD)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Distribución de calibres por variedad */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Distribución de Calibres por Variedad (%)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-th">Variedad</th>
                <th className="table-th">Temporada cosecha</th>
                <th className="table-th text-right">5J</th>
                <th className="table-th text-right">4J</th>
                <th className="table-th text-right">3J</th>
                <th className="table-th text-right">2J</th>
                <th className="table-th text-right">J</th>
                <th className="table-th text-right">XL</th>
                <th className="table-th text-right">% Export</th>
                <th className="table-th">Barra calibres</th>
              </tr>
            </thead>
            <tbody>
              {VARIEDADES.map((v) => (
                <tr key={v.codigo} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="table-td font-semibold text-gray-900">{v.nombre}</td>
                  <td className="table-td text-gray-500">{v.semanaInicio} → {v.semanaFin}</td>
                  <td className="table-td text-right font-mono">{v.pct5J}%</td>
                  <td className="table-td text-right font-mono text-green-700">{v.pct4J}%</td>
                  <td className="table-td text-right font-mono text-green-600">{v.pct3J}%</td>
                  <td className="table-td text-right font-mono">{v.pct2J}%</td>
                  <td className="table-td text-right font-mono text-gray-500">{v.pctJ}%</td>
                  <td className="table-td text-right font-mono text-gray-400">{v.pctXL}%</td>
                  <td className="table-td text-right font-semibold text-blue-700">
                    {(v.pctExportacion * 100).toFixed(0)}%
                  </td>
                  <td className="table-td min-w-[120px]">
                    <CalibreBar variedad={v} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function CalibreBar({ variedad }: { variedad: typeof VARIEDADES[0] }) {
  const segmentos = [
    { pct: variedad.pct5J, color: 'bg-emerald-600', label: '5J' },
    { pct: variedad.pct4J, color: 'bg-green-500', label: '4J' },
    { pct: variedad.pct3J, color: 'bg-lime-500', label: '3J' },
    { pct: variedad.pct2J, color: 'bg-yellow-400', label: '2J' },
    { pct: variedad.pctJ,  color: 'bg-orange-400', label: 'J' },
    { pct: variedad.pctXL, color: 'bg-red-400', label: 'XL' },
  ]
  return (
    <div className="flex h-4 rounded overflow-hidden w-full">
      {segmentos.filter((s) => s.pct > 0).map((s) => (
        <div
          key={s.label}
          className={`${s.color} flex items-center justify-center`}
          style={{ width: `${s.pct}%` }}
          title={`${s.label}: ${s.pct}%`}
        >
          {s.pct >= 10 && <span className="text-[9px] text-white font-bold">{s.pct}</span>}
        </div>
      ))}
    </div>
  )
}
