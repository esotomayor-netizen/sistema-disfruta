import {
  COMPROMISOS_CLIENTES,
  getDisponibleVsComprometido,
  fmtKg,
  TEMPORADA,
  SEMANAS,
} from '@/lib/cosecha-data'

export const dynamic = 'force-static'

const SEMANAS_CLIENTE = ['sem47', 'sem48', 'sem49', 'sem50', 'sem51'] as const
const LABELS_SEMANA: Record<string, string> = {
  sem47: 'Sem 47', sem48: 'Sem 48', sem49: 'Sem 49', sem50: 'Sem 50', sem51: 'Sem 51',
}

const PAIS_FLAG: Record<string, string> = {
  China: '🇨🇳', Japón: '🇯🇵', Alemania: '🇩🇪', EEUU: '🇺🇸', España: '🇪🇸', Italia: '🇮🇹',
}

export default function ClientesPage() {
  const disponibilidad = getDisponibleVsComprometido()
  const totalComprometido = COMPROMISOS_CLIENTES.reduce((s, c) => s + c.totalKgComprometido, 0)

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <a href="/cosecha" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600 font-medium">Compromisos Clientes</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌍</span>
          <h1 className="text-2xl font-bold text-gray-900">Compromisos por Cliente en Destino</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Temporada {TEMPORADA} · Kilos comprometidos por variedad, calibre y semana de entrega
        </p>
      </div>

      {/* Stats clientes */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{COMPROMISOS_CLIENTES.length}</p>
          <p className="text-sm text-gray-500 mt-1">Clientes activos</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-700">{fmtKg(totalComprometido)}</p>
          <p className="text-sm text-gray-500 mt-1">Total comprometido</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-purple-700">
            {Array.from(new Set(COMPROMISOS_CLIENTES.map((c) => c.pais))).length}
          </p>
          <p className="text-sm text-gray-500 mt-1">Países destino</p>
        </div>
      </div>

      {/* Tabla compromisos */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Detalle de Compromisos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-th">Cliente</th>
                <th className="table-th">País</th>
                <th className="table-th">Variedad</th>
                <th className="table-th">Calibre</th>
                {SEMANAS_CLIENTE.map((s) => (
                  <th key={s} className="table-th text-right">{LABELS_SEMANA[s]}</th>
                ))}
                <th className="table-th text-right font-bold">TOTAL KG</th>
              </tr>
            </thead>
            <tbody>
              {COMPROMISOS_CLIENTES.map((c, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="table-td font-semibold text-gray-900">{c.cliente}</td>
                  <td className="table-td">
                    <span className="flex items-center gap-1.5">
                      <span>{PAIS_FLAG[c.pais] ?? '🌍'}</span>
                      {c.pais}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className="badge bg-green-100 text-green-800">{c.variedad}</span>
                  </td>
                  <td className="table-td">
                    <span className="badge bg-blue-100 text-blue-800 font-mono">{c.calibreSolicitado}</span>
                  </td>
                  {SEMANAS_CLIENTE.map((s) => {
                    const kg = c[s] as number
                    return (
                      <td key={s} className={`table-td text-right ${kg > 0 ? 'font-medium text-gray-800' : 'text-gray-300'}`}>
                        {kg > 0 ? (kg / 1000).toFixed(0) + 't' : '—'}
                      </td>
                    )
                  })}
                  <td className="table-td text-right font-bold text-blue-700">
                    {fmtKg(c.totalKgComprometido)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 border-t border-gray-200">
                <td colSpan={4} className="table-td font-bold text-gray-900">TOTAL COMPROMETIDO</td>
                {SEMANAS_CLIENTE.map((s) => {
                  const tot = COMPROMISOS_CLIENTES.reduce((sum, c) => sum + (c[s] as number), 0)
                  return (
                    <td key={s} className="table-td text-right font-bold text-gray-800">
                      {tot > 0 ? (tot / 1000).toFixed(0) + 't' : '—'}
                    </td>
                  )
                })}
                <td className="table-td text-right font-bold text-blue-700">{fmtKg(totalComprometido)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Disponible vs Comprometido por variedad */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-2">Estado de Disponibilidad por Variedad</h2>
        <p className="text-xs text-gray-500 mb-4">
          🔴 Sobre-comprometido &nbsp;|&nbsp; 🟡 &gt;80% comprometido &nbsp;|&nbsp; 🟢 Disponible
        </p>
        <div className="space-y-4">
          {disponibilidad.filter((d) => d.comprometido > 0 || d.totalKg > 0).map((d) => (
            <div key={d.variedad}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`badge ${
                    d.alerta === 'ROJO' ? 'bg-red-100 text-red-800' :
                    d.alerta === 'AMARILLO' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>{d.variedad}</span>
                  <span className="text-xs text-gray-500">
                    {fmtKg(d.comprometido)} de {fmtKg(d.totalKg)}
                    {d.saldoLibre > 0 && (
                      <span className="text-green-600 ml-1">· saldo libre: {fmtKg(d.saldoLibre)}</span>
                    )}
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {(d.pctComprometido * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    d.alerta === 'ROJO' ? 'bg-red-500' :
                    d.alerta === 'AMARILLO' ? 'bg-yellow-400' :
                    'bg-primary-500'
                  }`}
                  style={{ width: `${Math.min(d.pctComprometido * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
