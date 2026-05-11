import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const DEFECT_FIELDS = [
  { key: 'condMachuconM1' as const, label: 'Machucón', tipo: 'condicion' },
  { key: 'condSobremadurezM1' as const, label: 'Sobremadurez', tipo: 'condicion' },
  { key: 'condHerIdaAbiertaM1' as const, label: 'Herida Abierta', tipo: 'condicion' },
  { key: 'condDanioPajaroM1' as const, label: 'Daño Pájaro', tipo: 'condicion' },
  { key: 'condPittingM1' as const, label: 'Pitting', tipo: 'condicion' },
  { key: 'condPartiduraSuperficialM1' as const, label: 'Partidura Superficial', tipo: 'condicion' },
  { key: 'condPudricionM1' as const, label: 'Pudrición', tipo: 'condicion' },
  { key: 'condPartiduraEstrellaM1' as const, label: 'Partidura Estrella', tipo: 'condicion' },
  { key: 'condPartiduraMediaLunaM1' as const, label: 'Partidura Media Luna', tipo: 'condicion' },
  { key: 'condDeshidratacionFrutoPediM1' as const, label: 'Deshidratación', tipo: 'condicion' },
  { key: 'condDesgarroPedicelarM1' as const, label: 'Desgarro Pedicelar', tipo: 'condicion' },
  { key: 'condOtro1M1' as const, label: 'Otro Condición 1', tipo: 'condicion' },
  { key: 'condOtro2M1' as const, label: 'Otro Condición 2', tipo: 'condicion' },
  { key: 'calRoceM1' as const, label: 'Roce', tipo: 'calidad' },
  { key: 'calRussetM1' as const, label: 'Russet', tipo: 'calidad' },
  { key: 'calManchaM1' as const, label: 'Mancha', tipo: 'calidad' },
  { key: 'calDeformeM1' as const, label: 'Deforme', tipo: 'calidad' },
  { key: 'calFrutoDobleM1' as const, label: 'Fruto Doble', tipo: 'calidad' },
  { key: 'calHerIdaCicatrizadaM1' as const, label: 'Herida Cicatrizada', tipo: 'calidad' },
  { key: 'calPreCalibreM1' as const, label: 'Pre-calibre', tipo: 'calidad' },
  { key: 'calFaltaColorM1' as const, label: 'Falta Color', tipo: 'calidad' },
  { key: 'calDanioInsectoM1' as const, label: 'Daño Insecto', tipo: 'calidad' },
  { key: 'calVirosisM1' as const, label: 'Virosis', tipo: 'calidad' },
  { key: 'calOtro1M1' as const, label: 'Otro Calidad 1', tipo: 'calidad' },
]

export default async function CalidadPage() {
  const all = await prisma.recepcionCalidad.findMany({ orderBy: { fechaMuestra: 'desc' } })

  const totalMuestras = all.length
  const totalBins = all.reduce((a, r) => a + r.binsTotems, 0)
  const productores = [...new Set(all.map((r) => r.productor))].length
  const variedades = [...new Set(all.map((r) => r.variedad))]

  const aceptadas = all.filter((r) => r.decisionFinal === 'A').length
  const observadas = all.filter((r) => r.decisionFinal === 'O').length

  const frutaSanaPromedio =
    all.filter((r) => r.resFrutaSanaM1 != null).reduce((a, r) => a + (r.resFrutaSanaM1 ?? 0), 0) /
    (all.filter((r) => r.resFrutaSanaM1 != null).length || 1)

  // Global defect totals
  let globalSum = 0
  const globalTotals = DEFECT_FIELDS.map((f) => {
    const val = all.reduce((acc, r) => acc + (Number(r[f.key]) || 0), 0)
    globalSum += val
    return { ...f, valor: val }
  })

  const topDefectos = [...globalTotals]
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8)
    .map((d) => ({ ...d, pct: globalSum > 0 ? (d.valor / globalSum) * 100 : 0 }))

  // By variety
  const byVariedad = variedades.map((v) => {
    const rows = all.filter((r) => r.variedad === v)
    const sana = rows.filter((r) => r.resFrutaSanaM1 != null).reduce((a, r) => a + (r.resFrutaSanaM1 ?? 0), 0)
    const cnt = rows.filter((r) => r.resFrutaSanaM1 != null).length || 1
    return { variedad: v, muestras: rows.length, frutaSana: Math.round(sana / cnt * 10) / 10 }
  }).sort((a, b) => b.muestras - a.muestras)

  // Clasificacion breakdown
  const clasificaciones = all.reduce((acc, r) => {
    const c = r.clasificacionFinal || '–'
    acc[c] = (acc[c] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const clasificLabel: Record<string, string> = { L: 'Large', M: 'Medium', C: 'Compact' }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Calidad — Cerezas</h1>
          <p className="text-gray-500 text-sm mt-1">Recepciones en planta · Temporada 2024–25</p>
        </div>
        <div className="flex gap-3">
          <Link href="/calidad/recepciones" className="btn-secondary text-sm">Ver Recepciones</Link>
          <Link href="/calidad/productores" className="btn-primary text-sm">Análisis por Productor</Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="card text-center">
          <p className="text-3xl font-bold text-red-600">{totalMuestras}</p>
          <p className="text-sm text-gray-500 mt-1">Muestras evaluadas</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-800">{totalBins.toLocaleString('es-CL')}</p>
          <p className="text-sm text-gray-500 mt-1">Bins / Tótems recibidos</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-800">{productores}</p>
          <p className="text-sm text-gray-500 mt-1">Productores</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{frutaSanaPromedio.toFixed(1)}%</p>
          <p className="text-sm text-gray-500 mt-1">Fruta sana promedio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Decision final */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Decisión Final</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${(aceptadas / totalMuestras) * 100}%` }} />
              </div>
              <span className="text-sm font-medium text-green-700 w-24 text-right">
                {aceptadas} Aceptadas ({Math.round((aceptadas / totalMuestras) * 100)}%)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(observadas / totalMuestras) * 100}%` }} />
              </div>
              <span className="text-sm font-medium text-yellow-700 w-24 text-right">
                {observadas} Observadas ({Math.round((observadas / totalMuestras) * 100)}%)
              </span>
            </div>
          </div>

          <h2 className="font-semibold text-gray-900 mt-6 mb-4">Clasificación Final</h2>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(clasificaciones).map(([c, n]) => (
              <div key={c} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-gray-800">{n}</p>
                <p className="text-xs text-gray-500">{clasificLabel[c] ?? c}</p>
              </div>
            ))}
          </div>
        </div>

        {/* By variety */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Por Variedad</h2>
          <div className="space-y-2">
            {byVariedad.map((v) => (
              <div key={v.variedad} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-gray-800">{v.variedad}</span>
                <div className="flex items-center gap-3 text-right">
                  <span className="text-xs text-gray-400">{v.muestras} muestras</span>
                  <span className="text-sm font-semibold text-green-600">{v.frutaSana}% sana</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top defects */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Top 8 Defectos Globales</h2>
          <div className="space-y-2">
            {topDefectos.map((d) => (
              <div key={d.key}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className={`font-medium ${d.tipo === 'condicion' ? 'text-red-700' : 'text-orange-700'}`}>{d.label}</span>
                  <span className="text-gray-500">{d.pct.toFixed(1)}%</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${d.tipo === 'condicion' ? 'bg-red-400' : 'bg-orange-400'}`}
                    style={{ width: `${Math.min(d.pct, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link href="/calidad/productores" className="card hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-200 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Análisis por Productor</p>
              <p className="text-sm text-gray-500">% de cada defecto sobre total propio y global</p>
            </div>
          </div>
        </Link>
        <Link href="/calidad/recepciones" className="card hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Listado de Recepciones</p>
              <p className="text-sm text-gray-500">Detalle de cada muestra evaluada en planta</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
