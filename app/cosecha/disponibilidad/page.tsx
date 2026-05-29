import {
  getDisponibleVsComprometido,
  SEMANAS,
  COMPROMISOS_CLIENTES,
  getResumenPorVariedad,
  fmtKg,
  TEMPORADA,
} from '@/lib/cosecha-data'

export const dynamic = 'force-static'

const SEMANAS_CLIENTE = ['sem47', 'sem48', 'sem49', 'sem50', 'sem51'] as const
const LABEL_SEM: Record<string, string> = {
  sem47: 'Sem 47', sem48: 'Sem 48', sem49: 'Sem 49', sem50: 'Sem 50', sem51: 'Sem 51',
}

export default function DisponibilidadPage() {
  const disponibilidad = getDisponibleVsComprometido()
  const resumen = getResumenPorVariedad()
  const totalDisponible = resumen.reduce((s, v) => s + v.totalKg, 0)
  const totalComprometido = COMPROMISOS_CLIENTES.reduce((s, c) => s + c.totalKgComprometido, 0)
  const totalLibre = totalDisponible - totalComprometido

  const alertasRojo = disponibilidad.filter((d) => d.alerta === 'ROJO').length
  const alertasAmarillo = disponibilidad.filter((d) => d.alerta === 'AMARILLO').length
  const alertasVerde = disponibilidad.filter((d) => d.alerta === 'VERDE').length

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <a href="/cosecha" className="text-gray-400 hover:text-gray-600 text-sm">← Inicio</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600 font-medium">Disponible vs Comprometido</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚖️</span>
          <h1 className="text-2xl font-bold text-gray-900">Disponible vs. Comprometido</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Temporada {TEMPORADA} · Alerta automática cuando los kilos comprometidos superan el disponible
        </p>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 mb-6">
        <span className="flex items-center gap-1.5 text-sm"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />🔴 Sobre-comprometido</span>
        <span className="flex items-center gap-1.5 text-sm"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />🟡 &gt;80% comprometido</span>
        <span className="flex items-center gap-1.5 text-sm"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />🟢 Disponible</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{fmtKg(totalDisponible)}</p>
          <p className="text-sm text-gray-500 mt-1">Total Disponible</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-700">{fmtKg(totalComprometido)}</p>
          <p className="text-sm text-gray-500 mt-1">Total Comprometido</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-700">{fmtKg(totalLibre)}</p>
          <p className="text-sm text-gray-500 mt-1">Saldo Libre</p>
        </div>
        <div className="card text-center">
          <div className="flex justify-center gap-2 mb-1">
            {alertasRojo > 0 && <span className="badge bg-red-100 text-red-700">🔴 {alertasRojo}</span>}
            {alertasAmarillo > 0 && <span className="badge bg-yellow-100 text-yellow-700">🟡 {alertasAmarillo}</span>}
            <span className="badge bg-green-100 text-green-700">🟢 {alertasVerde}</span>
          </div>
          <p className="text-sm text-gray-500">Alertas por variedad</p>
        </div>
      </div>

      {/* Barras de disponibilidad */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-900 mb-6">Estado por Variedad</h2>
        <div className="space-y-5">
          {disponibilidad.map((d) => {
            const pct = Math.min(d.pctComprometido * 100, 100)
            const colorBar = d.alerta === 'ROJO' ? 'bg-red-500' : d.alerta === 'AMARILLO' ? 'bg-yellow-400' : 'bg-primary-500'
            const colorBadge = d.alerta === 'ROJO' ? 'bg-red-100 text-red-700' : d.alerta === 'AMARILLO' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'
            return (
              <div key={d.variedad}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${colorBadge}`}>{d.variedad}</span>
                    <span className="text-xs text-gray-500">{fmtKg(d.comprometido)} comprometido de {fmtKg(d.totalKg)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {d.saldoLibre > 0 && (
                      <span className="text-xs text-green-600 font-medium">Libre: {fmtKg(d.saldoLibre)}</span>
                    )}
                    <span className="text-sm font-bold text-gray-700">{(d.pctComprometido * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${colorBar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabla detalle por semana */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Detalle Semanal — Disponible vs Comprometido</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="table-th w-32">Variedad</th>
                <th className="table-th text-center w-20">Tipo</th>
                {SEMANAS.map((s) => <th key={s.key} className="table-th text-right">{s.label}</th>)}
                <th className="table-th text-right font-bold">TOTAL</th>
                <th className="table-th text-right">Comp.</th>
                <th className="table-th text-center">Alerta</th>
              </tr>
            </thead>
            <tbody>
              {disponibilidad.map((d) => {
                const comprSem: Record<string, number> = {}
                for (const sem of SEMANAS) comprSem[sem.key] = 0
                for (const c of COMPROMISOS_CLIENTES) {
                  if (c.variedad === d.variedad) {
                    for (const sk of SEMANAS_CLIENTE) {
                      if (comprSem[sk] !== undefined) comprSem[sk] += c[sk] as number
                    }
                  }
                }
                const colorAlerta = d.alerta === 'ROJO' ? 'bg-red-100 text-red-700' : d.alerta === 'AMARILLO' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'
                return (
                  <>
                    {/* Fila disponible */}
                    <tr key={`${d.variedad}-disp`} className="border-b border-gray-50 bg-green-50/30">
                      <td className="table-td font-semibold text-gray-900" rowSpan={2}>{d.variedad}</td>
                      <td className="table-td text-center"><span className="badge bg-green-100 text-green-700 text-xs">DISP.</span></td>
                      {SEMANAS.map((s) => {
                        const kg = d.porSemana[s.key] ?? 0
                        return <td key={s.key} className={`table-td text-right text-xs ${kg > 0 ? 'text-green-700 font-medium' : 'text-gray-300'}`}>{kg > 0 ? (kg/1000).toFixed(0)+'t' : '—'}</td>
                      })}
                      <td className="table-td text-right font-bold text-green-700">{fmtKg(d.totalKg)}</td>
                      <td className="table-td" />
                      <td className="table-td text-center" rowSpan={2}>
                        <span className={`badge ${colorAlerta}`}>
                          {d.alerta === 'ROJO' ? '🔴' : d.alerta === 'AMARILLO' ? '🟡' : '🟢'} {(d.pctComprometido*100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                    {/* Fila comprometido */}
                    <tr key={`${d.variedad}-comp`} className="border-b border-gray-200">
                      <td className="table-td text-center"><span className="badge bg-blue-100 text-blue-700 text-xs">COMP.</span></td>
                      {SEMANAS.map((s) => {
                        const kg = comprSem[s.key] ?? 0
                        return <td key={s.key} className={`table-td text-right text-xs ${kg > 0 ? 'text-blue-700 font-medium' : 'text-gray-300'}`}>{kg > 0 ? (kg/1000).toFixed(0)+'t' : '—'}</td>
                      })}
                      <td className="table-td text-right font-bold text-blue-700">{fmtKg(d.comprometido)}</td>
                      <td className="table-td text-right text-green-600 text-xs font-medium">
                        {d.saldoLibre > 0 ? fmtKg(d.saldoLibre) : <span className="text-red-600">{fmtKg(d.saldoLibre)}</span>}
                      </td>
                    </tr>
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compromisos detalle */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Compromisos Registrados por Cliente</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-th">Cliente</th>
                <th className="table-th">País</th>
                <th className="table-th">Variedad</th>
                <th className="table-th">Calibre</th>
                {SEMANAS_CLIENTE.map((s) => <th key={s} className="table-th text-right">{LABEL_SEM[s]}</th>)}
                <th className="table-th text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {COMPROMISOS_CLIENTES.map((c, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="table-td font-semibold">{c.cliente}</td>
                  <td className="table-td text-gray-500">{c.pais}</td>
                  <td className="table-td"><span className="badge bg-green-100 text-green-800">{c.variedad}</span></td>
                  <td className="table-td"><span className="badge bg-blue-100 text-blue-800 font-mono">{c.calibreSolicitado}</span></td>
                  {SEMANAS_CLIENTE.map((s) => {
                    const kg = c[s] as number
                    return <td key={s} className={`table-td text-right ${kg > 0 ? 'font-medium' : 'text-gray-300'}`}>{kg > 0 ? (kg/1000).toFixed(0)+'t' : '—'}</td>
                  })}
                  <td className="table-td text-right font-bold text-blue-700">{fmtKg(c.totalKgComprometido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
