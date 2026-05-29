import {
  TEMPORADA,
  VARIEDADES,
  COMPROMISOS_CLIENTES,
  PRECIOS_CALIBRES,
  PROGRAMACION_SEMANAL,
  getResumenPorVariedad,
  getTotalPorSemana,
  getDisponibleVsComprometido,
  getRetornoEconomicoEstimado,
  fmtKg,
  fmtUSD,
  SEMANAS,
} from '@/lib/cosecha-data'
import CosechaBarChart from '@/components/cosecha/CosechaBarChart'
import CurvaVariedadChart from '@/components/cosecha/CurvaVariedadChart'

export const dynamic = 'force-static'

export default function CosechaDashboard() {
  const resumen = getResumenPorVariedad()
  const totalPorSemana = getTotalPorSemana()
  const disponibilidad = getDisponibleVsComprometido()
  const retorno = getRetornoEconomicoEstimado()

  const totalKgTemporada = resumen.reduce((s, v) => s + v.totalKg, 0)
  const totalKgComprometido = COMPROMISOS_CLIENTES.reduce((s, c) => s + c.totalKgComprometido, 0)
  const totalRetornoEstimado = retorno.reduce((s, r) => s + r.retornoUSD, 0)
  const totalKgExportable = retorno.reduce((s, r) => s + r.kgExport, 0)
  const totalProductores = Array.from(new Set(PROGRAMACION_SEMANAL.map((r) => r.productor))).length
  const totalClientes = Array.from(new Set(COMPROMISOS_CLIENTES.map((c) => c.cliente))).length

  // Semana de mayor volumen
  const semanasPico = SEMANAS.map((s) => ({ label: s.label, kg: totalPorSemana[s.key] }))
    .sort((a, b) => b.kg - a.kg)

  const semanaPico = semanasPico[0]

  // Alertas
  const alertasRojo = disponibilidad.filter((d) => d.alerta === 'ROJO').length
  const alertasAmarillo = disponibilidad.filter((d) => d.alerta === 'AMARILLO').length

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🍒</span>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Cosecha & Exportación</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Temporada {TEMPORADA} · DISFRUTA × LECAROS COX · Región VI O&apos;Higgins / VII Maule
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon="🌿"
          label="Total Planificado"
          value={fmtKg(totalKgTemporada)}
          sub={`${totalProductores} productores · ${VARIEDADES.length} variedades`}
          color="green"
        />
        <KpiCard
          icon="📦"
          label="KG Exportables Est."
          value={fmtKg(totalKgExportable)}
          sub={`${Math.round((totalKgExportable / totalKgTemporada) * 100)}% del campo`}
          color="blue"
        />
        <KpiCard
          icon="💰"
          label="Retorno Est. USD"
          value={fmtUSD(totalRetornoEstimado)}
          sub="precio ref. ODEPA/Asoex"
          color="amber"
        />
        <KpiCard
          icon="🌍"
          label="Comprometido"
          value={fmtKg(totalKgComprometido)}
          sub={`${totalClientes} clientes destino`}
          color={alertasRojo > 0 ? 'red' : 'purple'}
        />
      </div>

      {/* Alertas */}
      {(alertasRojo > 0 || alertasAmarillo > 0) && (
        <div className="flex gap-3 mb-6">
          {alertasRojo > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-700 text-sm font-medium">
              <span className="text-base">🔴</span>
              {alertasRojo} variedad{alertasRojo > 1 ? 'es' : ''} sobre-comprometida{alertasRojo > 1 ? 's' : ''}
            </div>
          )}
          {alertasAmarillo > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-yellow-700 text-sm font-medium">
              <span className="text-base">🟡</span>
              {alertasAmarillo} variedad{alertasAmarillo > 1 ? 'es' : ''} al +80% comprometida{alertasAmarillo > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Curva de cosecha semanal */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Curva de Cosecha Semanal</h2>
              <p className="text-xs text-gray-500 mt-0.5">Kilos planificados por semana — todas las variedades</p>
            </div>
            <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-1.5 font-medium">
              Pico: {semanaPico.label} · {fmtKg(semanaPico.kg)}
            </div>
          </div>
          <CosechaBarChart data={SEMANAS.map((s) => ({ semana: s.label, kg: totalPorSemana[s.key] }))} />
        </div>

        {/* Mix de variedades */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Mix de Variedades</h2>
          <div className="space-y-3">
            {resumen.slice(0, 8).map((v) => (
              <div key={v.variedad}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span className="font-medium">{v.variedad}</span>
                  <span>{fmtKg(v.totalKg)} ({(v.pctTotal * 100).toFixed(1)}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${v.pctTotal * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Disponible vs Comprometido */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Disponible vs. Comprometido</h2>
            <a href="/cosecha/clientes" className="text-primary-600 hover:text-primary-700 text-xs font-medium">
              Ver clientes →
            </a>
          </div>
          <div className="overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left font-semibold text-gray-500">Variedad</th>
                  <th className="pb-2 text-right font-semibold text-gray-500">Disponible</th>
                  <th className="pb-2 text-right font-semibold text-gray-500">Comprometido</th>
                  <th className="pb-2 text-center font-semibold text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {disponibilidad.map((d) => (
                  <tr key={d.variedad} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 font-medium text-gray-800">{d.variedad}</td>
                    <td className="py-2 text-right text-gray-600">{fmtKg(d.totalKg)}</td>
                    <td className="py-2 text-right text-gray-600">{fmtKg(d.comprometido)}</td>
                    <td className="py-2 text-center">
                      <AlertaBadge alerta={d.alerta} pct={d.pctComprometido} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Retorno económico por variedad */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Retorno Estimado por Variedad</h2>
            <a href="/cosecha/retorno" className="text-primary-600 hover:text-primary-700 text-xs font-medium">
              Ver detalle →
            </a>
          </div>
          <div className="space-y-3">
            {retorno.slice(0, 7).map((r) => (
              <div key={r.variedad} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.variedad}</p>
                  <p className="text-xs text-gray-500">{fmtKg(r.kgExport)} export · USD {r.precioPonderado.toFixed(2)}/kg</p>
                </div>
                <span className="text-sm font-semibold text-green-700">{fmtUSD(r.retornoUSD)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-sm font-bold text-gray-900">TOTAL ESTIMADO</span>
              <span className="text-base font-bold text-green-700">{fmtUSD(totalRetornoEstimado)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Curva por variedad */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">Curva Acumulada por Variedad Principal</h2>
            <p className="text-xs text-gray-500 mt-0.5">Lapins y Santina representan el {((resumen.slice(0,2).reduce((s,v) => s + v.pctTotal, 0))*100).toFixed(0)}% del volumen</p>
          </div>
          <a href="/cosecha/planificacion" className="text-primary-600 hover:text-primary-700 text-xs font-medium">
            Ver planificación →
          </a>
        </div>
        <CurvaVariedadChart
          semanas={SEMANAS.map((s) => s.label)}
          series={resumen.slice(0, 4).map((v) => ({
            name: v.variedad,
            data: SEMANAS.map((s) => v.porSemana[s.key] ?? 0),
          }))}
        />
      </div>

      {/* Precios de calibre */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Tabla de Precios Referenciales USD/kg</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PRECIOS_CALIBRES.map((p) => (
            <div key={p.calibre} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-lg font-bold text-gray-900">{p.calibre}</p>
              <p className="text-xs text-gray-500 mb-1">{p.rango}</p>
              <p className="text-base font-semibold text-green-700">USD {p.precioUSD}</p>
              <p className="text-xs text-gray-400 mt-1">{p.precioBajo} – {p.precioAlto}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">Fuente: ODEPA / Asoex temporada 2025-2026. Actualizar según negociación.</p>
      </div>
    </div>
  )
}

function KpiCard({
  icon, label, value, sub, color,
}: {
  icon: string; label: string; value: string; sub: string; color: 'green' | 'blue' | 'amber' | 'purple' | 'red'
}) {
  const colors = {
    green:  'bg-green-50  border-green-100  text-green-700',
    blue:   'bg-blue-50   border-blue-100   text-blue-700',
    amber:  'bg-amber-50  border-amber-100  text-amber-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
    red:    'bg-red-50    border-red-100    text-red-700',
  }
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs font-medium opacity-80">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-70 mt-1">{sub}</p>
    </div>
  )
}

function AlertaBadge({ alerta, pct }: { alerta: string; pct: number }) {
  if (alerta === 'ROJO') return <span className="badge bg-red-100 text-red-700">🔴 {(pct*100).toFixed(0)}%</span>
  if (alerta === 'AMARILLO') return <span className="badge bg-yellow-100 text-yellow-700">🟡 {(pct*100).toFixed(0)}%</span>
  if (pct > 0) return <span className="badge bg-green-100 text-green-700">🟢 {(pct*100).toFixed(0)}%</span>
  return <span className="badge bg-gray-100 text-gray-500">Sin comp.</span>
}
