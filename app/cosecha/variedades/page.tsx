import Link from 'next/link'
import { VARIEDADES, PROGRAMACION_SEMANAL, fmtKg } from '@/lib/cosecha-data'

export const dynamic = 'force-static'

const CALIBRE_COLORS: Record<string, string> = {
  '5J': 'bg-emerald-600',
  '4J': 'bg-green-500',
  '3J': 'bg-lime-500',
  '2J': 'bg-yellow-400',
  'J':  'bg-orange-400',
  'XL': 'bg-red-400',
}

const CALIBRE_TEXT: Record<string, string> = {
  '5J': 'text-emerald-700',
  '4J': 'text-green-700',
  '3J': 'text-lime-700',
  '2J': 'text-yellow-700',
  'J':  'text-orange-700',
  'XL': 'text-red-700',
}

function getTotalKgVariedad(codigo: string): number {
  return PROGRAMACION_SEMANAL
    .filter((r) => r.variedad === codigo || r.variedad === codigo.replace('_', ' '))
    .reduce((s, r) => s + r.totalKg, 0)
}

export default function VariedadesPage() {
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
          <span className="text-2xl">🌸</span>
          <h1 className="text-2xl font-bold text-gray-900">Variedades — Distribución por Calibre</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Calibres de mayor a menor: <span className="font-semibold text-emerald-700">5J</span> ·{' '}
          <span className="font-semibold text-green-700">4J</span> ·{' '}
          <span className="font-semibold text-lime-700">3J</span> ·{' '}
          <span className="font-semibold text-yellow-700">2J</span> ·{' '}
          <span className="font-semibold text-orange-700">J</span> ·{' '}
          <span className="font-semibold text-red-700">XL</span>
        </p>
      </div>

      {/* Grid de cards por variedad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
        {VARIEDADES.map((v) => {
          const totalKg = getTotalKgVariedad(v.codigo)
          const calibres = [
            { key: '5J', pct: v.pct5J },
            { key: '4J', pct: v.pct4J },
            { key: '3J', pct: v.pct3J },
            { key: '2J', pct: v.pct2J },
            { key: 'J',  pct: v.pctJ  },
            { key: 'XL', pct: v.pctXL },
          ]

          return (
            <div key={v.codigo} className="card">
              {/* Nombre variedad */}
              <h2 className="text-lg font-bold text-gray-900 mb-1">{v.nombre}</h2>
              <p className="text-xs text-gray-500 mb-3">
                {v.semanaInicio} → {v.semanaFin}
              </p>

              {/* Barra visual de calibres */}
              <div className="h-5 rounded-full overflow-hidden flex mb-3" title="Distribución de calibres">
                {calibres.map((c) =>
                  c.pct > 0 ? (
                    <div
                      key={c.key}
                      className={`${CALIBRE_COLORS[c.key]} h-full`}
                      style={{ width: `${c.pct}%` }}
                      title={`${c.key}: ${c.pct}%`}
                    />
                  ) : null
                )}
              </div>

              {/* % por calibre */}
              <div className="grid grid-cols-3 gap-1 mb-3">
                {calibres.map((c) => (
                  <div key={c.key} className="text-center">
                    <p className={`text-xs font-bold ${CALIBRE_TEXT[c.key]}`}>{c.key}</p>
                    <p className="text-xs text-gray-600">{c.pct}%</p>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">% Exportación</p>
                  <p className="text-sm font-semibold text-green-700">{(v.pctExportacion * 100).toFixed(0)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">KG planificados</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {totalKg > 0 ? fmtKg(totalKg) : <span className="text-gray-300">—</span>}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabla detalle */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Detalle por Variedad — % Calibres</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Variedad</th>
                <th className="table-th">Semana Inicio</th>
                <th className="table-th">Semana Fin</th>
                <th className={`table-th ${CALIBRE_TEXT['5J']}`}>5J</th>
                <th className={`table-th ${CALIBRE_TEXT['4J']}`}>4J</th>
                <th className={`table-th ${CALIBRE_TEXT['3J']}`}>3J</th>
                <th className={`table-th ${CALIBRE_TEXT['2J']}`}>2J</th>
                <th className={`table-th ${CALIBRE_TEXT['J']}`}>J</th>
                <th className={`table-th ${CALIBRE_TEXT['XL']}`}>XL</th>
                <th className="table-th">% Export</th>
                <th className="table-th text-right">KG Planificados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {VARIEDADES.map((v) => {
                const totalKg = getTotalKgVariedad(v.codigo)
                return (
                  <tr key={v.codigo} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td font-semibold text-gray-900">{v.nombre}</td>
                    <td className="table-td text-xs text-gray-500">{v.semanaInicio}</td>
                    <td className="table-td text-xs text-gray-500">{v.semanaFin}</td>
                    <td className={`table-td font-medium ${v.pct5J > 0 ? CALIBRE_TEXT['5J'] : 'text-gray-300'}`}>{v.pct5J}%</td>
                    <td className={`table-td font-medium ${v.pct4J > 0 ? CALIBRE_TEXT['4J'] : 'text-gray-300'}`}>{v.pct4J}%</td>
                    <td className={`table-td font-medium ${v.pct3J > 0 ? CALIBRE_TEXT['3J'] : 'text-gray-300'}`}>{v.pct3J}%</td>
                    <td className={`table-td font-medium ${v.pct2J > 0 ? CALIBRE_TEXT['2J'] : 'text-gray-300'}`}>{v.pct2J}%</td>
                    <td className={`table-td font-medium ${v.pctJ  > 0 ? CALIBRE_TEXT['J']  : 'text-gray-300'}`}>{v.pctJ}%</td>
                    <td className={`table-td font-medium ${v.pctXL > 0 ? CALIBRE_TEXT['XL'] : 'text-gray-300'}`}>{v.pctXL}%</td>
                    <td className="table-td font-semibold text-green-700">{(v.pctExportacion * 100).toFixed(0)}%</td>
                    <td className="table-td text-right font-semibold text-gray-900">
                      {totalKg > 0 ? fmtKg(totalKg) : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
