import Link from 'next/link'
import { VARIEDADES, PRECIOS_CALIBRES } from '@/lib/cosecha-data'

export const dynamic = 'force-static'

const CALIBRES = ['5J', '4J', '3J', '2J', 'J', 'XL'] as const
type Calibre = typeof CALIBRES[number]

const CALIBRE_BG: Record<Calibre, string> = {
  '5J': 'bg-emerald-600',
  '4J': 'bg-green-500',
  '3J': 'bg-lime-500',
  '2J': 'bg-yellow-400',
  'J':  'bg-orange-400',
  'XL': 'bg-red-400',
}

const CALIBRE_LABEL: Record<Calibre, string> = {
  '5J': 'bg-emerald-100 text-emerald-700',
  '4J': 'bg-green-100 text-green-700',
  '3J': 'bg-lime-100 text-lime-700',
  '2J': 'bg-yellow-100 text-yellow-700',
  'J':  'bg-orange-100 text-orange-700',
  'XL': 'bg-red-100 text-red-700',
}

function getPct(v: typeof VARIEDADES[number], calibre: Calibre): number {
  switch (calibre) {
    case '5J': return v.pct5J
    case '4J': return v.pct4J
    case '3J': return v.pct3J
    case '2J': return v.pct2J
    case 'J':  return v.pctJ
    case 'XL': return v.pctXL
  }
}

export default function CalibresPage() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link href="/cosecha" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          ← Inicio
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">📊</span>
          <h1 className="text-2xl font-bold text-gray-900">Curva de Calibres por Variedad</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Distribución porcentual de calibres por variedad · Temporada 2026-2027
        </p>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CALIBRES.map((c) => (
          <span key={c} className={`badge ${CALIBRE_LABEL[c]}`}>
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${CALIBRE_BG[c]} mr-1.5`} />
            {c}
          </span>
        ))}
      </div>

      {/* Tabla con barras */}
      <div className="card p-0 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Variedad</th>
                {CALIBRES.map((c) => (
                  <th key={c} className={`table-th ${CALIBRE_LABEL[c].split(' ')[1]}`}>
                    {c}
                  </th>
                ))}
                <th className="table-th text-green-700">% Export</th>
                <th className="table-th min-w-[200px]">Barra Visual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {VARIEDADES.map((v) => (
                <tr key={v.codigo} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td font-semibold text-gray-900">{v.nombre}</td>
                  {CALIBRES.map((c) => {
                    const pct = getPct(v, c)
                    return (
                      <td
                        key={c}
                        className={`table-td font-medium text-center ${pct > 0 ? CALIBRE_LABEL[c].split(' ')[1] : 'text-gray-300'}`}
                      >
                        {pct}%
                      </td>
                    )
                  })}
                  <td className="table-td font-semibold text-green-700 text-center">
                    {(v.pctExportacion * 100).toFixed(0)}%
                  </td>
                  <td className="table-td">
                    <div className="h-4 rounded-full overflow-hidden flex" title={v.nombre}>
                      {CALIBRES.map((c) => {
                        const pct = getPct(v, c)
                        return pct > 0 ? (
                          <div
                            key={c}
                            className={`${CALIBRE_BG[c]} h-full`}
                            style={{ width: `${pct}%` }}
                            title={`${c}: ${pct}%`}
                          />
                        ) : null
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla de precios por calibre */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Precios Referenciales por Calibre (USD/kg)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
          {PRECIOS_CALIBRES.map((p) => {
            const calibre = p.calibre as Calibre
            return (
              <div key={p.calibre} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <span className={`badge ${CALIBRE_LABEL[calibre] ?? 'bg-gray-100 text-gray-600'} mb-2`}>
                  {p.calibre}
                </span>
                <p className="text-xs text-gray-500 mb-1">{p.rango}</p>
                <p className="text-lg font-bold text-green-700">USD {p.precioUSD}</p>
                <p className="text-xs text-gray-400 mt-1">{p.precioBajo} – {p.precioAlto}</p>
                <p className="text-xs text-gray-400 mt-1 leading-tight">{p.descripcion}</p>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-400">
          Fuente: ODEPA / Asoex temporada 2025-2026. Actualizar según negociación.
        </p>
      </div>
    </div>
  )
}
