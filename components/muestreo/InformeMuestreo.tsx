import {
  CALIBRES, COLORES, FIRMEZAS, DEFECTOS_CALIDAD, DEFECTOS_CONDICION, TIPOS_MUESTREO, APTITUD_LABEL,
  distribucion, defectosDetalle, resumenMuestreo, toConteos, toFotos, clasifColor,
  diagnostico, valorizacion, ESTADO_INFO, FUENTE_PRECIOS, fmtUsd,
} from '@/lib/muestreo'
import { CurvaCalibre, DistribucionColor, TortaColor, BarrasDefectos, BarraApilada, Punto } from './MuestreoCharts'


export interface MuestreoInforme {
  id: number
  fecha: Date
  tipo: string
  variedad: string
  productor: string | null
  cuartel: string | null
  lote: string | null
  guia: string | null
  nEnvases: string | null
  kilos: number | null
  tamanoMuestra: number
  tempPulpa: number | null
  tempAmbiente: number | null
  calibres: unknown
  colores: unknown
  firmeza: unknown
  brix: number[]
  defectosCalidad: unknown
  defectosCondicion: unknown
  fotos: unknown
  observaciones: string | null
  latitud: number | null
  longitud: number | null
  predio: { nombre: string; csg: string } | null
  tecnico: { nombre: string; apellido: string }
}

function Dato({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{k}</p>
      <p className="text-sm font-semibold text-gray-900">{v || '–'}</p>
    </div>
  )
}

function Kpi({ k, v, sub, tone = 'text-gray-900' }: { k: string; v: React.ReactNode; sub?: string; tone?: string }) {
  return (
    <div className="card p-3 lg:p-4">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{k}</p>
      <p className={`text-2xl font-bold mt-0.5 ${tone}`}>{v}</p>
      {sub && <p className="text-[11px] text-gray-500">{sub}</p>}
    </div>
  )
}

function TablaDefectos({ titulo, filas, total, clasif, tone }: {
  titulo: string; filas: ReturnType<typeof defectosDetalle>; total: { n: number; pct: number }; clasif: 1 | 2 | 3; tone: string
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className={tone}>
          <th className="text-left px-2 py-1.5 font-semibold">{titulo}</th>
          <th className="px-2 py-1.5 font-semibold w-12">(u)</th>
          <th className="px-2 py-1.5 font-semibold w-16">%</th>
          <th className="px-2 py-1.5 font-semibold w-14">Clasif.</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((d) => (
          <tr key={d.key} className="border-b border-gray-100">
            <td className="px-2 py-1.5">{d.label}</td>
            <td className="px-2 py-1.5 text-center">{d.n}</td>
            <td className="px-2 py-1.5 text-center">{d.pct.toFixed(1)}%</td>
            <td className="px-2 py-1.5 text-center"><span className={`badge ${clasifColor(d.clasif)}`}>{d.clasif}</span></td>
          </tr>
        ))}
        <tr className="font-semibold bg-gray-50">
          <td className="px-2 py-1.5">Total</td>
          <td className="px-2 py-1.5 text-center">{total.n}</td>
          <td className="px-2 py-1.5 text-center">{total.pct.toFixed(1)}%</td>
          <td className="px-2 py-1.5 text-center"><span className={`badge ${clasifColor(clasif)}`}>{clasif}</span></td>
        </tr>
      </tbody>
    </table>
  )
}

export default function InformeMuestreo({ m, referencia }: { m: MuestreoInforme; referencia?: { nombre: string; data: Punto[] } }) {
  const r = resumenMuestreo(m)
  const curva = distribucion(CALIBRES, toConteos(m.calibres))
  const colores = distribucion(COLORES, toConteos(m.colores))
  const firmezas = distribucion(FIRMEZAS, toConteos(m.firmeza))
  const dCal = defectosDetalle(DEFECTOS_CALIDAD, toConteos(m.defectosCalidad), m.tamanoMuestra)
  const dCon = defectosDetalle(DEFECTOS_CONDICION, toConteos(m.defectosCondicion), m.tamanoMuestra)
  const fotos = toFotos(m.fotos)
  const tipo = TIPOS_MUESTREO.find((t) => t.value === m.tipo)?.label ?? m.tipo
  const fecha = new Date(m.fecha).toLocaleString('es-CL', { timeZone: 'America/Santiago', dateStyle: 'short', timeStyle: 'short' })
  const diag = diagnostico(m, r)
  const est = ESTADO_INFO[diag.estado]
  const val = valorizacion(m, r)
  const notaTone = r.notaFinal === 1 ? 'text-green-700' : r.notaFinal === 2 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary-600 font-semibold">{tipo}</p>
            <h2 className="text-xl font-bold text-gray-900">{m.variedad} · {m.productor || m.predio?.nombre || 'Sin productor'}</h2>
          </div>
          <span className="badge bg-primary-50 text-primary-700">Muestreo #{m.id}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Dato k="Fecha" v={fecha} />
          <Dato k="Predio" v={m.predio ? `${m.predio.nombre} (CSG ${m.predio.csg})` : null} />
          <Dato k="Cuartel" v={m.cuartel} />
          <Dato k="Lote / guía" v={[m.lote, m.guia].filter(Boolean).join(' / ')} />
          <Dato k="Envases / kilos" v={[m.nEnvases, m.kilos ? `${m.kilos.toLocaleString('es-CL')} kg` : null].filter(Boolean).join(' · ')} />
          <Dato k="Muestra" v={`${m.tamanoMuestra} frutos`} />
          <Dato k="T° pulpa" v={m.tempPulpa !== null ? `${m.tempPulpa} °C` : null} />
          <Dato k="T° ambiente" v={m.tempAmbiente !== null ? `${m.tempAmbiente} °C` : null} />
          <Dato k="Inspector" v={`${m.tecnico.nombre} ${m.tecnico.apellido}`} />
          <Dato k="GPS" v={m.latitud ? <a className="text-primary-700 underline" href={`https://maps.google.com/?q=${m.latitud},${m.longitud}`} target="_blank">Ver mapa</a> : null} />
        </div>
      </div>

      <div className={`card border ${est.fondo}`}>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className={`px-4 py-2 rounded-lg text-lg font-bold ${est.badge}`}>{est.titulo}</span>
          {diag.motivos.length > 0 && <span className="text-sm text-gray-700">Por {diag.motivos.join(' y ')}.</span>}
        </div>
        <ul className="space-y-1.5">
          {diag.frases.map((f, i) => (
            <li key={i} className="text-sm text-gray-800 flex gap-2"><span className="text-gray-400">•</span><span>{f}</span></li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi k="Exportable" v={`${r.pctExportable}%`} tone="text-primary-700" sub="estimado" />
        <Kpi k="Nota final" v={r.notaFinal} tone={notaTone} sub={`Calidad ${r.clasifCalidad} · Condición ${r.clasifCondicion}`} />
        <Kpi k="Total daños" v={`${r.pctDanos}%`} sub={`Cal. ${r.pctCalidad}% · Cond. ${r.pctCondicion}%`} />
        <Kpi k="Calibre prom." v={r.calibrePromedioMm ? `${r.calibrePromedioMm} mm` : '–'} sub={`J+ ${r.pctJMas}% · 2J+ ${r.pct2JMas}%`} />
        <Kpi k="°Brix prom." v={r.brixPromedio ?? '–'} sub={r.brixMin !== null ? `${r.brixMin} – ${r.brixMax}` : undefined} />
        <Kpi k="Aptitud viaje" v={<span className="text-base">{APTITUD_LABEL[r.aptitudViaje]}</span>} sub={`Firmes ${r.pctFirmes}%`} />
      </div>

      {(r.calibreTotal > 0 || r.colorTotal > 0) && (
      <div className="grid lg:grid-cols-2 gap-4">
        {r.calibreTotal > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900">Curva de calibres</h3>
          <p className="text-xs text-gray-500 mb-2">
            % sobre {r.calibreTotal} frutos calibrados · moda {r.calibreModal ?? '–'}
            {referencia && <> · <span className="text-blue-600">--- {referencia.nombre}</span></>}
          </p>
          <CurvaCalibre data={curva} comparar={referencia} />
        </div>
        )}
        {r.colorTotal > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900">Distribución de color</h3>
          <p className="text-xs text-gray-500 mb-2">% sobre {r.colorTotal} frutos · caoba o más oscuro {r.pctCaobaMas}%</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <DistribucionColor data={colores} />
            <TortaColor data={colores} />
          </div>
        </div>
        )}
      </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-blue-900 mb-2">Defectos de calidad</h3>
          <BarrasDefectos data={dCal} color="#2563eb" />
          <div className="mt-3"><TablaDefectos titulo="Parámetro" filas={dCal} total={{ n: r.calidadN, pct: r.pctCalidad }} clasif={r.clasifCalidad} tone="bg-blue-50 text-blue-900" /></div>
        </div>
        <div className="card">
          <h3 className="font-semibold text-amber-900 mb-2">Defectos de condición</h3>
          <BarrasDefectos data={dCon} color="#d97706" />
          <div className="mt-3"><TablaDefectos titulo="Parámetro" filas={dCon} total={{ n: r.condicionN, pct: r.pctCondicion }} clasif={r.clasifCondicion} tone="bg-amber-50 text-amber-900" /></div>
        </div>
      </div>


      {val && (
        <div className="card">
          <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">Kilos y valor estimado por calibre</h3>
              <p className="text-xs text-gray-500">{FUENTE_PRECIOS}</p>
            </div>
            <div className="flex gap-4 text-right">
              <div><p className="text-[11px] uppercase text-gray-500">US$/kg exportable</p><p className="text-lg font-bold text-primary-700">{val.precioPonderado.toFixed(2)}</p></div>
              <div><p className="text-[11px] uppercase text-gray-500">US$/kg cosechado</p><p className="text-lg font-bold text-primary-700">{val.usdPorKgCosechado.toFixed(2)}</p></div>
              {val.usdTotal !== null && <div><p className="text-[11px] uppercase text-gray-500">Valor lote</p><p className="text-lg font-bold text-primary-700">{fmtUsd(val.usdTotal)}</p></div>}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="text-left px-2 py-1.5 font-semibold">Calibre</th>
                  <th className="text-right px-2 py-1.5 font-semibold">% exportable</th>
                  {val.kgExport !== null && <th className="text-right px-2 py-1.5 font-semibold">Kg</th>}
                  <th className="text-right px-2 py-1.5 font-semibold">US$/kg</th>
                  {val.kgExport !== null && <th className="text-right px-2 py-1.5 font-semibold">US$</th>}
                </tr>
              </thead>
              <tbody>
                {val.filas.map((f) => (
                  <tr key={f.calibre} className="border-b border-gray-100">
                    <td className="px-2 py-1.5 font-medium">{f.calibre}</td>
                    <td className="px-2 py-1.5 text-right">{f.pct}%</td>
                    {val.kgExport !== null && <td className="px-2 py-1.5 text-right">{(f.kg ?? 0).toLocaleString('es-CL')}</td>}
                    <td className="px-2 py-1.5 text-right">{f.precio !== null ? f.precio.toFixed(2) : 'sin precio'}</td>
                    {val.kgExport !== null && <td className="px-2 py-1.5 text-right">{f.usd !== null ? f.usd.toLocaleString('es-CL') : '–'}</td>}
                  </tr>
                ))}
                {val.kgExport !== null && (
                  <tr className="font-semibold bg-gray-50">
                    <td className="px-2 py-1.5">Total exportable</td>
                    <td className="px-2 py-1.5 text-right">{r.pctExportable}% de {val.kilos?.toLocaleString('es-CL')} kg</td>
                    <td className="px-2 py-1.5 text-right">{val.kgExport.toLocaleString('es-CL')}</td>
                    <td className="px-2 py-1.5 text-right">{val.precioPonderado.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-right">{(val.usdTotal ?? 0).toLocaleString('es-CL')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {val.kgExport === null && (
            <p className="text-xs text-gray-500 mt-2">Ingresa los kilos del lote en el muestreo para estimar kilos y valor total. Referencia: cada 1.000 kg cosechados ≈ {fmtUsd(val.usdPorKgCosechado * 1000)}.</p>
          )}
          {val.sinPrecio.length > 0 && <p className="text-xs text-gray-500 mt-1">Sin precio de referencia: {val.sinPrecio.join(', ')} (no suma valor).</p>}
        </div>
      )}

      {(r.firmezaTotal > 0 || m.brix.length > 0) && (
      <div className="grid lg:grid-cols-2 gap-4">
        {r.firmezaTotal > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Firmeza</h3>
          <BarraApilada data={firmezas} />
        </div>
        )}
        {m.brix.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-2">Sólidos solubles (°Brix)</h3>
          <p className="text-sm text-gray-700 mb-2">Promedio <b>{r.brixPromedio}</b> · mín {r.brixMin} · máx {r.brixMax} · n = {m.brix.length}</p>
          <div className="flex flex-wrap gap-1.5">
            {m.brix.map((b, i) => <span key={i} className="badge bg-gray-100 text-gray-700">{b}</span>)}
          </div>
        </div>
        )}
      </div>
      )}

      {(fotos.length > 0 || m.observaciones) && (
        <div className="card break-inside-avoid">
          {m.observaciones && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-1">Observaciones</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{m.observaciones}</p>
            </div>
          )}
          {fotos.length > 0 && (
            <>
              <h3 className="font-semibold text-gray-900 mb-2">Registro fotográfico</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {fotos.map((f, i) => (
                  <figure key={i} className="border border-gray-200 rounded-lg overflow-hidden break-inside-avoid">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.src} alt={f.nota || `Foto ${i + 1}`} className="w-full h-48 object-cover" />
                    <figcaption className="text-xs text-gray-600 px-2 py-1.5">#{i + 1} {f.nota}</figcaption>
                  </figure>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <p className="text-[11px] text-gray-400">
        Porcentajes en base a la muestra tomada. Clasificación referencial: 1 ≤ 3% · 2 ≤ 5% · 3 &gt; 5% por defecto; total 1 ≤ 5% · 2 ≤ 10%. Exportable = 100% − daños − pre-calibre. Semáforo: no apto con pudrición &gt; 1% o exportable &lt; 70%; apto con nota 1 y exportable ≥ 85%.
      </p>
    </div>
  )
}
