import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession, isSupervisor } from '@/lib/session'
import Header from '@/components/Header'
import { ComparativaCurvas } from '@/components/muestreo/MuestreoCharts'
import {
  CALIBRES, COLORES, TIPOS_MUESTREO, APTITUD_LABEL, resumenMuestreo, toConteos, suma, clasifColor, pct,
} from '@/lib/muestreo'

export const dynamic = 'force-dynamic'

interface SP { variedad?: string; tipo?: string; agrupar?: string }

const prom = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x !== null && Number.isFinite(x))
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null
}

export default async function MuestreosPage({ searchParams }: { searchParams: SP }) {
  const session = await getSession()
  if (!session) return null
  const { variedad, tipo } = searchParams
  const agrupar = searchParams.agrupar === 'variedad' ? 'variedad' : 'productor'

  const base = isSupervisor(session) ? {} : { tecnicoId: session.user.id }
  const [muestreos, variedades] = await Promise.all([
    prisma.muestreo.findMany({
      where: { ...base, ...(variedad ? { variedad } : {}), ...(tipo ? { tipo } : {}) },
      orderBy: { fecha: 'desc' },
      take: 300,
      select: {
        id: true, fecha: true, tipo: true, variedad: true, productor: true, cuartel: true, tamanoMuestra: true,
        calibres: true, colores: true, firmeza: true, brix: true, defectosCalidad: true, defectosCondicion: true,
        predio: { select: { nombre: true } }, tecnico: { select: { nombre: true, apellido: true } },
      },
    }),
    prisma.muestreo.findMany({ where: base, distinct: ['variedad'], select: { variedad: true }, orderBy: { variedad: 'asc' } }),
  ])

  const filas = muestreos.map((m) => ({ m, r: resumenMuestreo(m), productor: m.productor || m.predio?.nombre || 'Sin productor' }))

  // Comparativa entre productores (o variedades).
  const grupos = new Map<string, typeof filas>()
  for (const f of filas) {
    const k = agrupar === 'variedad' ? f.m.variedad : f.productor
    grupos.set(k, [...(grupos.get(k) ?? []), f])
  }
  const comparativa = Array.from(grupos.entries()).map(([nombre, fs]) => {
    const cal: Record<string, number> = {}
    const col: Record<string, number> = {}
    for (const f of fs) {
      for (const [k, v] of Object.entries(toConteos(f.m.calibres))) cal[k] = (cal[k] ?? 0) + v
      for (const [k, v] of Object.entries(toConteos(f.m.colores))) col[k] = (col[k] ?? 0) + v
    }
    const tCal = suma(cal)
    const tCol = suma(col)
    return {
      nombre,
      n: fs.length,
      frutos: fs.reduce((a, f) => a + f.m.tamanoMuestra, 0),
      exportable: prom(fs.map((f) => f.r.pctExportable)),
      calibreMm: prom(fs.map((f) => f.r.calibrePromedioMm)),
      jMas: prom(fs.map((f) => (f.r.calibreTotal ? f.r.pctJMas : null))),
      caoba: prom(fs.map((f) => (f.r.colorTotal ? f.r.pctCaobaMas : null))),
      brix: prom(fs.map((f) => f.r.brixPromedio)),
      calidad: prom(fs.map((f) => f.r.pctCalidad)),
      condicion: prom(fs.map((f) => f.r.pctCondicion)),
      curva: CALIBRES.map((c) => pct(cal[c.key] ?? 0, tCal)),
      colorDom: COLORES.reduce((b, c) => ((col[c.key] ?? 0) > (col[b.key] ?? 0) ? c : b), COLORES[0]),
      tCol,
    }
  }).sort((a, b) => (b.exportable ?? 0) - (a.exportable ?? 0))

  const qs = (o: Partial<SP>) => {
    const p = new URLSearchParams()
    const v = { variedad, tipo, agrupar, ...o }
    for (const [k, val] of Object.entries(v)) if (val) p.set(k, val)
    return `/muestreos?${p.toString()}`
  }
  const chip = (activo: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${activo ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`

  const totalFrutos = filas.reduce((a, f) => a + f.m.tamanoMuestra, 0)

  return (
    <div>
      <Header
        title="Muestreos de cerezas"
        subtitle="Calidad en terreno: calibre, color, firmeza, °Brix y defectos"
        action={<Link href="/muestreos/nuevo" className="btn-primary">+ Nuevo muestreo</Link>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card"><p className="text-xs text-gray-500">Muestreos</p><p className="text-2xl font-bold">{filas.length}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Frutos evaluados</p><p className="text-2xl font-bold">{totalFrutos.toLocaleString('es-CL')}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Exportable promedio</p><p className="text-2xl font-bold text-primary-700">{prom(filas.map((f) => f.r.pctExportable)) ?? '–'}%</p></div>
        <div className="card"><p className="text-xs text-gray-500">°Brix promedio</p><p className="text-2xl font-bold">{prom(filas.map((f) => f.r.brixPromedio)) ?? '–'}</p></div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <a href={qs({ variedad: undefined })} className={chip(!variedad)}>Todas</a>
        {variedades.map((v) => (
          <a key={v.variedad} href={qs({ variedad: v.variedad })} className={chip(variedad === v.variedad)}>{v.variedad}</a>
        ))}
        <span className="mx-2 text-gray-300">|</span>
        <a href={qs({ tipo: undefined })} className={chip(!tipo)}>Todos los tipos</a>
        {TIPOS_MUESTREO.map((t) => (
          <a key={t.value} href={qs({ tipo: t.value })} className={chip(tipo === t.value)}>{t.label.split(' (')[0]}</a>
        ))}
      </div>

      {comparativa.length > 0 && (
        <div className="card mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="font-semibold text-gray-900">Comparativa por {agrupar}</h2>
              <p className="text-xs text-gray-500">Promedios de los muestreos filtrados, ordenados por % exportable</p>
            </div>
            <div className="flex gap-2">
              <a href={qs({ agrupar: 'productor' })} className={chip(agrupar === 'productor')}>Productor</a>
              <a href={qs({ agrupar: 'variedad' })} className={chip(agrupar === 'variedad')}>Variedad</a>
            </div>
          </div>
          <ComparativaCurvas calibres={CALIBRES.map((c) => c.key)} series={comparativa.slice(0, 8).map((g) => ({ nombre: g.nombre, pcts: g.curva }))} />
          <div className="overflow-x-auto mt-4">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-th capitalize">{agrupar}</th>
                  <th className="table-th text-right">N°</th>
                  <th className="table-th text-right">Exportable</th>
                  <th className="table-th text-right">Calibre mm</th>
                  <th className="table-th text-right">J+</th>
                  <th className="table-th">Color dom.</th>
                  <th className="table-th text-right">Caoba+</th>
                  <th className="table-th text-right">°Brix</th>
                  <th className="table-th text-right">Calidad</th>
                  <th className="table-th text-right">Condición</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparativa.map((g) => (
                  <tr key={g.nombre}>
                    <td className="table-td font-medium">{g.nombre}</td>
                    <td className="table-td text-right">{g.n}</td>
                    <td className="table-td text-right font-semibold text-primary-700">{g.exportable ?? '–'}%</td>
                    <td className="table-td text-right">{g.calibreMm ?? '–'}</td>
                    <td className="table-td text-right">{g.jMas ?? '–'}%</td>
                    <td className="table-td">
                      {g.tCol ? <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: g.colorDom.color }} />{g.colorDom.label}</span> : '–'}
                    </td>
                    <td className="table-td text-right">{g.caoba ?? '–'}%</td>
                    <td className="table-td text-right">{g.brix ?? '–'}</td>
                    <td className="table-td text-right">{g.calidad ?? '–'}%</td>
                    <td className="table-td text-right">{g.condicion ?? '–'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Fecha</th>
              <th className="table-th">Variedad</th>
              <th className="table-th">Productor / cuartel</th>
              <th className="table-th">Tipo</th>
              <th className="table-th text-right">Exportable</th>
              <th className="table-th text-right">Daños</th>
              <th className="table-th text-right">Calibre</th>
              <th className="table-th text-right">°Brix</th>
              <th className="table-th">Nota</th>
              <th className="table-th">Viaje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filas.length === 0 && (
              <tr><td colSpan={10} className="table-td text-center text-gray-400 py-10">
                Aún no hay muestreos. <Link href="/muestreos/nuevo" className="text-primary-700 underline">Registrar el primero</Link>
              </td></tr>
            )}
            {filas.map(({ m, r, productor }) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="table-td whitespace-nowrap">
                  <Link href={`/muestreos/${m.id}`} className="text-primary-700 font-medium hover:underline">
                    {new Date(m.fecha).toLocaleString('es-CL', { timeZone: 'America/Santiago', dateStyle: 'short', timeStyle: 'short' })}
                  </Link>
                </td>
                <td className="table-td font-medium">{m.variedad}</td>
                <td className="table-td">{productor}{m.cuartel ? ` · ${m.cuartel}` : ''}</td>
                <td className="table-td text-xs">{TIPOS_MUESTREO.find((t) => t.value === m.tipo)?.label.split(' (')[0]}</td>
                <td className="table-td text-right font-semibold text-primary-700">{r.pctExportable}%</td>
                <td className="table-td text-right">{r.pctDanos}%</td>
                <td className="table-td text-right">{r.calibrePromedioMm ? `${r.calibrePromedioMm} mm` : '–'}</td>
                <td className="table-td text-right">{r.brixPromedio ?? '–'}</td>
                <td className="table-td"><span className={`badge ${clasifColor(r.notaFinal)}`}>{r.notaFinal}</span></td>
                <td className="table-td text-xs">{APTITUD_LABEL[r.aptitudViaje].split(' /')[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
