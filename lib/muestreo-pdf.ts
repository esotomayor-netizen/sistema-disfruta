// Genera el informe de muestreo como PDF en el servidor (jsPDF), sin depender
// de window.print(). Así funciona también en la app instalada en el celular,
// donde el diálogo de impresión no está disponible.
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  CALIBRES, COLORES, FIRMEZAS, DEFECTOS_CALIDAD, DEFECTOS_CONDICION, TIPOS_MUESTREO, APTITUD_LABEL,
  distribucion, defectosDetalle, resumenMuestreo, toConteos, toFotos,
  diagnostico, valorizacion, ESTADO_INFO, FUENTE_PRECIOS, fmtUsd,
} from './muestreo'
import type { MuestreoInforme } from '@/components/muestreo/InformeMuestreo'

type RGB = [number, number, number]

const VERDE: RGB = [43, 62, 34]
const GRIS: RGB = [107, 114, 128]
const BORDE: RGB = [229, 231, 235]
const CEREZA: RGB = [155, 28, 34]
const AZUL: RGB = [37, 99, 235]
const AMBAR: RGB = [217, 119, 6]

const CLASIF: Record<1 | 2 | 3, { fill: RGB; text: RGB }> = {
  1: { fill: [220, 252, 231], text: [22, 101, 52] },
  2: { fill: [254, 243, 199], text: [146, 64, 14] },
  3: { fill: [254, 226, 226], text: [153, 27, 27] },
}

function hex(h: string | undefined, fallback: RGB = CEREZA): RGB {
  if (!h) return fallback
  const n = parseInt(h.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Las fuentes estándar de PDF solo traen Latin-1: se reemplazan los
// símbolos que quedarían como caracteres raros.
function t(s: string | null | undefined) {
  return (s ?? '')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x00-\xFF–—•…€]/g, '')
}

function fmtPct(n: number) {
  return `${Number.isInteger(n) ? n : n.toFixed(1)}%`
}

interface Punto { label: string; pct: number; color?: string }

// Gráfico de barras vertical con etiquetas de % y, opcionalmente, la curva.
function barras(doc: jsPDF, x: number, y: number, w: number, h: number, data: Punto[], opts: { curva?: boolean; color?: RGB }) {
  // Múltiplo de 20 para que las 4 líneas guía queden en valores redondos.
  const max = Math.max(20, Math.ceil(Math.max(...data.map((d) => d.pct), 0) / 20) * 20)
  const ejeX = 9
  const plotX = x + ejeX
  const plotW = w - ejeX
  const plotH = h - 9
  const base = y + plotH

  doc.setFontSize(6.5)
  doc.setTextColor(...GRIS)
  doc.setDrawColor(...BORDE)
  doc.setLineWidth(0.2)
  for (let i = 0; i <= 4; i++) {
    const v = (max / 4) * i
    const yy = base - (plotH * v) / max
    doc.line(plotX, yy, plotX + plotW, yy)
    doc.text(`${Math.round(v)}%`, plotX - 1.5, yy + 1, { align: 'right' })
  }

  const slot = plotW / data.length
  const bw = slot * 0.62
  const puntos: [number, number][] = []
  data.forEach((d, i) => {
    const cx = plotX + slot * i + slot / 2
    const bh = (plotH * d.pct) / max
    if (bh > 0) {
      doc.setFillColor(...(d.color ? hex(d.color) : opts.color ?? CEREZA))
      doc.rect(cx - bw / 2, base - bh, bw, bh, 'F')
    }
    if (d.pct > 0) {
      doc.setTextColor(55, 65, 81)
      doc.setFontSize(6.5)
      doc.text(fmtPct(d.pct), cx, base - bh - 1.2, { align: 'center' })
    }
    doc.setTextColor(...GRIS)
    doc.setFontSize(data.length > 6 ? 6.5 : 6)
    const lineas = doc.splitTextToSize(t(d.label), slot + 1) as string[]
    doc.text(lineas.slice(0, 2), cx, base + 3.5, { align: 'center' })
    puntos.push([cx, base - bh])
  })

  if (opts.curva && puntos.length > 1) {
    doc.setDrawColor(60, 84, 48)
    doc.setLineWidth(0.6)
    for (let i = 1; i < puntos.length; i++) doc.line(puntos[i - 1][0], puntos[i - 1][1], puntos[i][0], puntos[i][1])
    doc.setFillColor(60, 84, 48)
    puntos.forEach(([px, py]) => doc.circle(px, py, 0.7, 'F'))
  }
}

// Barra 100% apilada con leyenda debajo.
function apilada(doc: jsPDF, x: number, y: number, w: number, data: Punto[]) {
  const total = data.reduce((a, d) => a + d.pct, 0)
  if (!total) {
    doc.setFontSize(8)
    doc.setTextColor(...GRIS)
    doc.text('Sin datos', x, y + 4)
    return y + 8
  }
  let cx = x
  for (const d of data) {
    if (!d.pct) continue
    const sw = (w * d.pct) / total
    doc.setFillColor(...hex(d.color))
    doc.rect(cx, y, sw, 6, 'F')
    if (sw > 9) {
      doc.setFontSize(7)
      doc.setTextColor(255, 255, 255)
      doc.text(fmtPct(d.pct), cx + sw / 2, y + 4.1, { align: 'center' })
    }
    cx += sw
  }
  let lx = x
  let ly = y + 10
  doc.setFontSize(7)
  for (const d of data) {
    const etiqueta = `${t(d.label)} ${fmtPct(d.pct)}`
    const ancho = doc.getTextWidth(etiqueta) + 7
    if (lx + ancho > x + w) { lx = x; ly += 4.5 }
    doc.setFillColor(...hex(d.color))
    doc.rect(lx, ly - 2.3, 2.6, 2.6, 'F')
    doc.setTextColor(55, 65, 81)
    doc.text(etiqueta, lx + 3.6, ly)
    lx += ancho
  }
  return ly + 3
}

function caja(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setDrawColor(...BORDE)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, w, h, 2, 2, 'S')
}

function tituloCaja(doc: jsPDF, x: number, y: number, titulo: string, sub?: string, color: RGB = [17, 24, 39]) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...color)
  doc.text(t(titulo), x, y)
  if (sub) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GRIS)
    doc.text(t(sub), x, y + 3.8)
  }
}

export function generarPdfMuestreo(m: MuestreoInforme & { tecnico: { nombre: string; apellido: string; titulo?: string | null } }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 12
  const CW = W - M * 2

  const r = resumenMuestreo(m)
  const curva = distribucion(CALIBRES, toConteos(m.calibres))
  const colores = distribucion(COLORES, toConteos(m.colores))
  const firmezas = distribucion(FIRMEZAS, toConteos(m.firmeza))
  const dCal = defectosDetalle(DEFECTOS_CALIDAD, toConteos(m.defectosCalidad), m.tamanoMuestra)
  const dCon = defectosDetalle(DEFECTOS_CONDICION, toConteos(m.defectosCondicion), m.tamanoMuestra)
  const fotos = toFotos(m.fotos)
  const tipo = TIPOS_MUESTREO.find((x) => x.value === m.tipo)?.label ?? m.tipo
  const fecha = new Date(m.fecha).toLocaleString('es-CL', { timeZone: 'America/Santiago', dateStyle: 'short', timeStyle: 'short' })
  const emitido = new Date().toLocaleDateString('es-CL', { timeZone: 'America/Santiago', day: '2-digit', month: 'long', year: 'numeric' })

  // ── Encabezado ──────────────────────────────────────────────────────────
  doc.setFillColor(...VERDE)
  doc.rect(0, 0, W, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Informe de Muestreo de Calidad · Cerezas', M, 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Exportadora Disfruta S.A. — datos en base a la muestra tomada', M, 16)
  doc.text(t(`Emitido ${emitido}`), W - M, 16, { align: 'right' })
  doc.text(`Muestreo N° ${m.id}`, W - M, 10, { align: 'right' })

  let y = 30
  doc.setTextColor(...VERDE)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text(t(tipo.toUpperCase()), M, y)
  doc.setTextColor(17, 24, 39)
  doc.setFontSize(13)
  doc.text(t(`${m.variedad} · ${m.productor || m.predio?.nombre || 'Sin productor'}`), M, y + 6)
  y += 10

  // ── Resumen (semáforo) ──────────────────────────────────────────────────
  const diag = diagnostico(m, r)
  const est = ESTADO_INFO[diag.estado]
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  const lineasResumen = diag.frases.flatMap((f) => doc.splitTextToSize(t(f), CW - 52) as string[])
  const altoResumen = Math.max(22, 8 + lineasResumen.length * 4.2)
  doc.setFillColor(249, 250, 251)
  doc.setDrawColor(...est.rgb)
  doc.setLineWidth(0.6)
  doc.roundedRect(M, y, CW, altoResumen, 2, 2, 'FD')
  doc.setFillColor(...est.rgb)
  doc.roundedRect(M + 3, y + 3, 40, altoResumen - 6, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(est.titulo.length > 10 ? 10.5 : 13)
  doc.text(t(est.titulo.toUpperCase()), M + 23, y + altoResumen / 2 + (diag.motivos.length ? -1 : 1.5), { align: 'center', maxWidth: 37 })
  if (diag.motivos.length) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.3)
    doc.text(doc.splitTextToSize(t(diag.motivos.join(' · ')), 36) as string[], M + 23, y + altoResumen / 2 + 3.5, { align: 'center' })
  }
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(31, 41, 55)
  let ly = y + 6.5
  for (const f of diag.frases) {
    const ls = doc.splitTextToSize(t(f), CW - 52) as string[]
    doc.setFillColor(...est.rgb)
    doc.circle(M + 47, ly - 1.1, 0.7, 'F')
    doc.text(ls, M + 49.5, ly)
    ly += ls.length * 4.2
  }
  y += altoResumen + 5

  // ── Datos del lote ──────────────────────────────────────────────────────
  const datos: [string, string][] = [
    ['Fecha', fecha],
    ['Predio', m.predio ? `${m.predio.nombre} (CSG ${m.predio.csg})` : '–'],
    ['Cuartel', m.cuartel || '–'],
    ['Lote / guía', [m.lote, m.guia].filter(Boolean).join(' / ') || '–'],
    ['Envases / kilos', [m.nEnvases, m.kilos ? `${m.kilos.toLocaleString('es-CL')} kg` : null].filter(Boolean).join(' · ') || '–'],
    ['Muestra', `${m.tamanoMuestra} frutos`],
    ['T° pulpa', m.tempPulpa !== null ? `${m.tempPulpa} °C` : '–'],
    ['T° ambiente', m.tempAmbiente !== null ? `${m.tempAmbiente} °C` : '–'],
    ['Inspector', `${m.tecnico.nombre} ${m.tecnico.apellido}`],
    ['GPS', m.latitud ? `${m.latitud.toFixed(5)}, ${m.longitud?.toFixed(5)}` : '–'],
  ]
  const filas: string[][] = []
  for (let i = 0; i < datos.length; i += 2) {
    filas.push([t(datos[i][0]), t(datos[i][1]), t(datos[i + 1]?.[0] ?? ''), t(datos[i + 1]?.[1] ?? '')])
  }
  autoTable(doc, {
    startY: y,
    body: filas,
    theme: 'plain',
    margin: { left: M, right: M },
    styles: { fontSize: 8, cellPadding: { top: 1.2, bottom: 1.2, left: 2, right: 2 }, textColor: [17, 24, 39] },
    columnStyles: {
      0: { textColor: GRIS, fontSize: 7, cellWidth: 26 },
      1: { fontStyle: 'bold', cellWidth: CW / 2 - 26 },
      2: { textColor: GRIS, fontSize: 7, cellWidth: 26 },
      3: { fontStyle: 'bold' },
    },
    didParseCell: (h) => { h.cell.styles.fillColor = h.row.index % 2 ? [255, 255, 255] : [249, 250, 251] },
  })
  y = (doc as any).lastAutoTable.finalY + 5

  // ── Indicadores ─────────────────────────────────────────────────────────
  const kpis: { k: string; v: string; s: string; c?: RGB }[] = [
    { k: 'EXPORTABLE', v: fmtPct(r.pctExportable), s: 'estimado', c: [60, 84, 48] },
    { k: 'NOTA FINAL', v: String(r.notaFinal), s: `Cal. ${r.clasifCalidad} · Cond. ${r.clasifCondicion}`, c: CLASIF[r.notaFinal].text },
    { k: 'TOTAL DAÑOS', v: fmtPct(r.pctDanos), s: `Cal. ${fmtPct(r.pctCalidad)} · Cond. ${fmtPct(r.pctCondicion)}` },
    { k: 'CALIBRE PROM.', v: r.calibrePromedioMm ? `${r.calibrePromedioMm} mm` : '–', s: `J+ ${fmtPct(r.pctJMas)} · 2J+ ${fmtPct(r.pct2JMas)}` },
    { k: '°BRIX PROM.', v: r.brixPromedio !== null ? String(r.brixPromedio) : '–', s: r.brixMin !== null ? `${r.brixMin} – ${r.brixMax}` : '' },
    { k: 'APTITUD VIAJE', v: APTITUD_LABEL[r.aptitudViaje].split(' /')[0], s: `Firmes ${fmtPct(r.pctFirmes)}` },
  ]
  const kw = (CW - 5 * 2.5) / 6
  kpis.forEach((k, i) => {
    const x = M + i * (kw + 2.5)
    caja(doc, x, y, kw, 17)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(...GRIS)
    doc.text(t(k.k), x + 2.5, y + 4.5)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(k.v.length > 8 ? 9 : 13)
    doc.setTextColor(...(k.c ?? [17, 24, 39]))
    doc.text(t(k.v), x + 2.5, y + 10.5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.8)
    doc.setTextColor(...GRIS)
    doc.text(t(k.s), x + 2.5, y + 14.5)
  })
  y += 22

  // ── Curva de calibres y color (solo las secciones con datos) ──────────
  const half = (CW - 4) / 2
  const cx2 = M + half + 4
  const paneles = <T,>(items: (T | false)[]) => items.filter(Boolean) as T[]
  const graficos = paneles<{ titulo: string; sub: string; data: { label: string; pct: number; color?: string }[]; curva?: boolean }>([
    r.calibreTotal > 0 && { titulo: 'Curva de calibres', sub: `% sobre ${r.calibreTotal} frutos calibrados · moda ${r.calibreModal ?? '–'}`, data: curva.map((c) => ({ label: c.label, pct: c.pct })), curva: true },
    r.colorTotal > 0 && { titulo: 'Distribución de color', sub: `% sobre ${r.colorTotal} frutos · caoba o más oscuro ${fmtPct(r.pctCaobaMas)}`, data: colores.map((c) => ({ label: c.nombre, pct: c.pct, color: c.color })) },
  ])
  if (graficos.length) {
    if (y + 68 > H - 15) { doc.addPage(); y = M }
    const ancho = graficos.length === 1 ? CW : half
    graficos.forEach((g, i) => {
      const x = i === 0 ? M : cx2
      caja(doc, x, y, ancho, 68)
      tituloCaja(doc, x + 4, y + 6, g.titulo, g.sub)
      barras(doc, x + 3, y + 15, ancho - 7, 50, g.data, { curva: g.curva })
    })
    y += 73
  }

  // ── Firmeza y sólidos solubles ──────────────────────────────────────────
  const hayFirmeza = r.firmezaTotal > 0
  const hayBrix = m.brix.length > 0
  if (hayFirmeza || hayBrix) {
    if (y + 30 > H - 15) { doc.addPage(); y = M }
    const ancho = hayFirmeza && hayBrix ? half : CW
    let x = M
    if (hayFirmeza) {
      caja(doc, x, y, ancho, 30)
      tituloCaja(doc, x + 4, y + 6, 'Firmeza')
      apilada(doc, x + 4, y + 10, ancho - 8, firmezas.map((f) => ({ label: f.nombre, pct: f.pct, color: f.color })))
      x = cx2
    }
    if (hayBrix) {
      caja(doc, x, y, ancho, 30)
      tituloCaja(doc, x + 4, y + 6, 'Sólidos solubles (°Brix)')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(55, 65, 81)
      doc.text(t(`Promedio ${r.brixPromedio} · mín ${r.brixMin} · máx ${r.brixMax} · n = ${m.brix.length}`), x + 4, y + 13)
      doc.setFontSize(7.5)
      doc.setTextColor(...GRIS)
      doc.text(doc.splitTextToSize(`Lecturas: ${m.brix.join('  ')}`, ancho - 8) as string[], x + 4, y + 19)
    }
    y += 35
  }

  // ── Defectos ────────────────────────────────────────────────────────────
  const tablaDefectos = (titulo: string, color: RGB, filas: ReturnType<typeof defectosDetalle>, total: { n: number; pct: number }, clasif: 1 | 2 | 3, x: number, startY: number) => {
    const body = filas.map((d) => [t(d.label), String(d.n), fmtPct(d.pct), String(d.clasif)])
    if (!body.length) body.push(['Sin defectos registrados', '', '', ''])
    body.push(['Total', String(total.n), fmtPct(total.pct), String(clasif)])
    autoTable(doc, {
      startY,
      head: [[t(titulo), '(u)', '%', 'Clasif.']],
      body,
      theme: 'grid',
      margin: { left: x, right: W - x - half },
      tableWidth: half,
      styles: { fontSize: 7.5, cellPadding: 1.5, lineColor: BORDE, lineWidth: 0.2, textColor: [31, 41, 55] },
      headStyles: { fillColor: color, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'center', cellWidth: 11 }, 2: { halign: 'center', cellWidth: 14 }, 3: { halign: 'center', cellWidth: 13 } },
      didParseCell: (h) => {
        if (h.section !== 'body') return
        const ultima = h.row.index === body.length - 1
        if (ultima) { h.cell.styles.fontStyle = 'bold'; h.cell.styles.fillColor = [249, 250, 251] }
        if (h.column.index === 3 && h.cell.raw) {
          const c = Number(h.cell.raw) as 1 | 2 | 3
          if (CLASIF[c]) { h.cell.styles.fillColor = CLASIF[c].fill; h.cell.styles.textColor = CLASIF[c].text; h.cell.styles.fontStyle = 'bold' }
        }
      },
    })
    return (doc as any).lastAutoTable.finalY as number
  }
  if (y > H - 50) { doc.addPage(); y = M }
  const startPage = doc.getNumberOfPages()
  const yCal = tablaDefectos('Defectos de calidad', AZUL, dCal, { n: r.calidadN, pct: r.pctCalidad }, r.clasifCalidad, M, y)
  const pageCal = doc.getNumberOfPages()
  doc.setPage(startPage)
  const yCon = tablaDefectos('Defectos de condición', AMBAR, dCon, { n: r.condicionN, pct: r.pctCondicion }, r.clasifCondicion, cx2, y)
  const pageCon = doc.getNumberOfPages()
  doc.setPage(Math.max(pageCal, pageCon))
  y = (pageCal === pageCon ? Math.max(yCal, yCon) : pageCal > pageCon ? yCal : yCon) + 6

  // ── Kilos y valor por calibre ──────────────────────────────────────────
  const val = valorizacion(m, r)
  if (val) {
    if (y + 40 > H - 15) { doc.addPage(); y = M + 4 }
    tituloCaja(doc, M, y, 'Kilos y valor estimado por calibre', FUENTE_PRECIOS)
    const conKg = val.kgExport !== null
    const head = conKg ? [['Calibre', '% exportable', 'Kg', 'US$/kg', 'US$']] : [['Calibre', '% exportable', 'US$/kg']]
    const body = val.filas.map((f) => conKg
      ? [f.calibre, fmtPct(f.pct), (f.kg ?? 0).toLocaleString('es-CL'), f.precio !== null ? f.precio.toFixed(2) : 'sin precio', f.usd !== null ? f.usd.toLocaleString('es-CL') : '–']
      : [f.calibre, fmtPct(f.pct), f.precio !== null ? f.precio.toFixed(2) : 'sin precio'])
    if (conKg) body.push(['Total exportable', `${fmtPct(r.pctExportable)} de ${val.kilos?.toLocaleString('es-CL')} kg`, (val.kgExport ?? 0).toLocaleString('es-CL'), val.precioPonderado.toFixed(2), (val.usdTotal ?? 0).toLocaleString('es-CL')])
    else body.push(['Ponderado', '', val.precioPonderado.toFixed(2)])
    autoTable(doc, {
      startY: y + 6,
      head,
      body,
      theme: 'grid',
      margin: { left: M, right: M },
      styles: { fontSize: 7.5, cellPadding: 1.5, lineColor: BORDE, lineWidth: 0.2, textColor: [31, 41, 55], halign: 'right' },
      headStyles: { fillColor: VERDE, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 0: { halign: 'left' } },
      didParseCell: (h) => {
        if (h.section === 'body' && h.row.index === body.length - 1) { h.cell.styles.fontStyle = 'bold'; h.cell.styles.fillColor = [249, 250, 251] }
      },
    })
    y = (doc as any).lastAutoTable.finalY + 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...GRIS)
    const notas = [`US$/kg exportable ${val.precioPonderado.toFixed(2)} · US$/kg cosechado ${val.usdPorKgCosechado.toFixed(2)}`]
    if (conKg && val.usdTotal !== null) notas[0] += ` · valor estimado del lote ${fmtUsd(val.usdTotal)}`
    if (!conKg) notas.push(`Sin kilos del lote: cada 1.000 kg cosechados ≈ ${fmtUsd(val.usdPorKgCosechado * 1000)}.`)
    if (val.sinPrecio.length) notas.push(`Sin precio de referencia: ${val.sinPrecio.join(', ')}.`)
    for (const n of notas) { doc.text(t(n), M, y); y += 4 }
    y += 3
  }

  // ── Observaciones ───────────────────────────────────────────────────────
  if (m.observaciones) {
    const lineas = doc.splitTextToSize(t(m.observaciones), CW) as string[]
    if (y + 10 + lineas.length * 4 > H - 15) { doc.addPage(); y = M + 4 }
    tituloCaja(doc, M, y, 'Observaciones')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(55, 65, 81)
    doc.text(lineas, M, y + 5.5)
    y += 8 + lineas.length * 4
  }

  // ── Registro fotográfico ────────────────────────────────────────────────
  if (fotos.length) {
    const fw = (CW - 6) / 2
    const fh = 62
    if (y + fh + 14 > H - 15) { doc.addPage(); y = M + 4 }
    tituloCaja(doc, M, y, 'Registro fotográfico')
    y += 4
    fotos.forEach((f, i) => {
      const col = i % 2
      if (col === 0 && i > 0) y += fh + 10
      if (col === 0 && y + fh + 8 > H - 15) { doc.addPage(); y = M }
      const x = M + col * (fw + 6)
      doc.setFillColor(243, 244, 246)
      doc.rect(x, y, fw, fh, 'F')
      try {
        const props = doc.getImageProperties(f.src)
        const esc = Math.min(fw / props.width, fh / props.height)
        const iw = props.width * esc
        const ih = props.height * esc
        doc.addImage(f.src, props.fileType, x + (fw - iw) / 2, y + (fh - ih) / 2, iw, ih, undefined, 'FAST')
      } catch {
        doc.setFontSize(7)
        doc.setTextColor(...GRIS)
        doc.text('Imagen no disponible en PDF', x + fw / 2, y + fh / 2, { align: 'center' })
      }
      doc.setFontSize(7.5)
      doc.setTextColor(55, 65, 81)
      doc.text(doc.splitTextToSize(t(`#${i + 1} ${f.nota ?? ''}`), fw) as string[], x, y + fh + 4)
    })
    y += fh + 12
  }

  // ── Firma ───────────────────────────────────────────────────────────────
  if (y + 24 > H - 15) { doc.addPage(); y = M + 10 }
  y += 10
  doc.setDrawColor(156, 163, 175)
  doc.setLineWidth(0.3)
  doc.line(M, y, M + 70, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(17, 24, 39)
  doc.text(t(`${m.tecnico.nombre} ${m.tecnico.apellido}`), M, y + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...GRIS)
  doc.text(t(m.tecnico.titulo || 'Inspector de calidad'), M, y + 8.5)

  // ── Pie de página ───────────────────────────────────────────────────────
  const paginas = doc.getNumberOfPages()
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p)
    doc.setDrawColor(...BORDE)
    doc.line(M, H - 11, W - M, H - 11)
    doc.setFontSize(6.5)
    doc.setTextColor(...GRIS)
    doc.text('Clasificación referencial: 1 <= 3% · 2 <= 5% · 3 > 5% por defecto; total 1 <= 5% · 2 <= 10%. Exportable = 100% - daños - pre-calibre.', M, H - 7.5)
    doc.text(`DLC Export · Muestreo N° ${m.id} · Página ${p} de ${paginas}`, W - M, H - 4.5, { align: 'right' })
  }
  return doc
}

export function nombreArchivoPdf(m: { id: number; variedad: string; fecha: Date }) {
  const f = new Date(m.fecha).toISOString().slice(0, 10)
  const v = m.variedad.normalize('NFD').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '')
  return `Muestreo_${m.id}_${v}_${f}.pdf`
}
