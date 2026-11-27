// Catálogos y cálculos del módulo de Muestreo de cerezas.
// Los conteos se registran en unidades (frutos) y todos los porcentajes se
// calculan sobre el tamaño de la muestra, igual que los informes de recepción
// de las plantas (Fripack / Fresh-Pak).

import { PRECIOS_CALIBRES } from './cosecha-data'

export type Conteos = Record<string, number>

export interface Item {
  key: string
  label: string
  short?: string
  color?: string
  mm?: string
  mid?: number
}

export const TIPOS_MUESTREO = [
  { value: 'PRECOSECHA', label: 'Pre-cosecha (madurez)' },
  { value: 'COSECHA', label: 'Cosecha (en huerto)' },
  { value: 'DESPACHO', label: 'Despacho a planta' },
]

// Calibres de cereza de exportación (diámetro ecuatorial).
export const CALIBRES: Item[] = [
  { key: 'PC', label: 'Pre-calibre', short: 'PC', mm: '< 22', mid: 21 },
  { key: 'L', label: 'L', short: 'L', mm: '22–24', mid: 23 },
  { key: 'XL', label: 'XL', short: 'XL', mm: '24–26', mid: 25 },
  { key: 'J', label: 'J', short: 'J', mm: '26–28', mid: 27 },
  { key: '2J', label: '2J', short: '2J', mm: '28–30', mid: 29 },
  { key: '3J', label: '3J', short: '3J', mm: '30–32', mid: 31 },
  { key: '4J', label: '4J', short: '4J', mm: '32–34', mid: 33 },
  { key: '5J', label: '5J', short: '5J', mm: '≥ 34', mid: 35 },
]

// Tabla de color de cubrimiento (de más claro a más oscuro).
export const COLORES: Item[] = [
  { key: 'ROJO_CLARO', label: 'Rojo claro', color: '#e0525a' },
  { key: 'ROJO', label: 'Rojo', color: '#c1272d' },
  { key: 'ROJO_CAOBA', label: 'Rojo caoba', color: '#9b1c22' },
  { key: 'CAOBA', label: 'Caoba', color: '#701418' },
  { key: 'CAOBA_OSCURO', label: 'Caoba oscuro', color: '#4b0c10' },
  { key: 'NEGRO', label: 'Negro', color: '#24070a' },
]

export const FIRMEZAS: Item[] = [
  { key: 'MUY_BLANDO', label: 'Muy blando', color: '#dc2626' },
  { key: 'BLANDO', label: 'Blando', color: '#f59e0b' },
  { key: 'FIRME', label: 'Firme', color: '#65a30d' },
  { key: 'MUY_FIRME', label: 'Muy firme', color: '#15803d' },
]

// Defectos de calidad: de origen en el huerto, no evolucionan en postcosecha.
export const DEFECTOS_CALIDAD: Item[] = [
  { key: 'FALTA_COLOR', label: 'Falta de color' },
  { key: 'DEFORME', label: 'Deforme / doble / hijuelo' },
  { key: 'SUTURA', label: 'Sutura marcada' },
  { key: 'HERIDA_CICATRIZADA', label: 'Herida cicatrizada' },
  { key: 'PARTIDURA_CICATRIZADA', label: 'Partidura cicatrizada' },
  { key: 'RUSSET', label: 'Russet' },
  { key: 'DANO_INSECTO', label: 'Daño insecto / trips' },
  { key: 'GRANIZO', label: 'Daño por granizo' },
  { key: 'OTRO_CALIDAD', label: 'Otro (calidad)' },
]

// Defectos de condición: evolutivos, se agravan en almacenaje y viaje.
export const DEFECTOS_CONDICION: Item[] = [
  { key: 'PARTIDURA', label: 'Partidura (estilar/lateral/pedicelar)' },
  { key: 'MACHUCON', label: 'Machucón' },
  { key: 'PITTING', label: 'Pitting' },
  { key: 'BLANDO', label: 'Fruto blando' },
  { key: 'DESHIDRATADO', label: 'Fruto deshidratado' },
  { key: 'PEDICELO_DESHIDRATADO', label: 'Pedicelo deshidratado / pardo' },
  { key: 'SIN_PEDICELO', label: 'Sin pedicelo / desgarro' },
  { key: 'HERIDA_ABIERTA', label: 'Herida abierta' },
  { key: 'PUDRICION', label: 'Pudrición' },
  { key: 'OTRO_CONDICION', label: 'Otro (condición)' },
]

// Clasificación por defecto individual (1 = bueno, 2 = alerta, 3 = fuera de
// tolerancia) y por total. Valores referenciales, ajustables por norma.
export const TOLERANCIA_DEFECTO = { c1: 3, c2: 5 }
export const TOLERANCIA_TOTAL = { c1: 5, c2: 10 }
// Pudrición no tiene tolerancia práctica en exportación.
export const TOLERANCIA_PUDRICION = { c1: 0, c2: 1 }

export function toConteos(v: unknown): Conteos {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  const out: Conteos = {}
  for (const [k, n] of Object.entries(v as Record<string, unknown>)) {
    const num = Number(n)
    if (Number.isFinite(num) && num > 0) out[k] = num
  }
  return out
}

export function suma(c: Conteos) {
  return Object.values(c).reduce((a, b) => a + (Number(b) || 0), 0)
}

// Tamaño de muestra cuando el inspector no lo indica: la sección con más
// frutos contados (calibre, color, firmeza o defectos).
export function muestraAutomatica(m: {
  calibres: unknown; colores: unknown; firmeza: unknown; defectosCalidad: unknown; defectosCondicion: unknown
}) {
  return Math.max(
    suma(toConteos(m.calibres)),
    suma(toConteos(m.colores)),
    suma(toConteos(m.firmeza)),
    suma(toConteos(m.defectosCalidad)) + suma(toConteos(m.defectosCondicion)),
  )
}

export function pct(n: number, total: number) {
  if (!total) return 0
  return Math.round((n / total) * 1000) / 10
}

export function clasificar(p: number, tol = TOLERANCIA_DEFECTO): 1 | 2 | 3 {
  if (p <= tol.c1) return 1
  if (p <= tol.c2) return 2
  return 3
}

export function distribucion(items: Item[], c: Conteos, base?: number) {
  const total = base ?? suma(c)
  return items.map((i) => ({
    key: i.key,
    label: i.short ?? i.label,
    nombre: i.label,
    color: i.color,
    mm: i.mm,
    n: c[i.key] ?? 0,
    pct: pct(c[i.key] ?? 0, total),
  }))
}

export function defectosDetalle(items: Item[], c: Conteos, muestra: number) {
  return items
    .map((i) => {
      const n = c[i.key] ?? 0
      const p = pct(n, muestra)
      const tol = i.key === 'PUDRICION' ? TOLERANCIA_PUDRICION : TOLERANCIA_DEFECTO
      return { key: i.key, label: i.label, n, pct: p, clasif: clasificar(p, tol) }
    })
    .filter((d) => d.n > 0)
}

export interface MuestreoLike {
  tamanoMuestra: number
  calibres: unknown
  colores: unknown
  firmeza: unknown
  brix: number[]
  defectosCalidad: unknown
  defectosCondicion: unknown
}

export interface Resumen {
  muestra: number
  calibreTotal: number
  calibrePromedioMm: number | null
  pctPrecalibre: number
  pctJMas: number
  pct2JMas: number
  calibreModal: string | null
  colorTotal: number
  pctCaobaMas: number
  colorModal: string | null
  firmezaTotal: number
  pctFirmes: number
  brixPromedio: number | null
  brixMin: number | null
  brixMax: number | null
  calidadN: number
  condicionN: number
  pctCalidad: number
  pctCondicion: number
  pctDanos: number
  clasifCalidad: 1 | 2 | 3
  clasifCondicion: 1 | 2 | 3
  notaFinal: 1 | 2 | 3
  pctExportable: number
  aptitudViaje: 'LARGO' | 'MEDIO' | 'CORTO'
}

function clasifTotal(detalle: { clasif: 1 | 2 | 3 }[], p: number): 1 | 2 | 3 {
  const peor = detalle.reduce<1 | 2 | 3>((m, d) => (d.clasif > m ? d.clasif : m), 1)
  const t = clasificar(p, TOLERANCIA_TOTAL)
  return (t > peor ? t : peor) as 1 | 2 | 3
}

export function resumenMuestreo(m: MuestreoLike): Resumen {
  const cal = toConteos(m.calibres)
  const col = toConteos(m.colores)
  const fir = toConteos(m.firmeza)
  const dCal = toConteos(m.defectosCalidad)
  const dCon = toConteos(m.defectosCondicion)
  const muestra = m.tamanoMuestra || 0

  const calibreTotal = suma(cal)
  let sumMm = 0
  for (const c of CALIBRES) sumMm += (cal[c.key] ?? 0) * (c.mid ?? 0)
  const idxJ = CALIBRES.findIndex((c) => c.key === 'J')
  const idx2J = CALIBRES.findIndex((c) => c.key === '2J')
  const nJMas = CALIBRES.slice(idxJ).reduce((a, c) => a + (cal[c.key] ?? 0), 0)
  const n2JMas = CALIBRES.slice(idx2J).reduce((a, c) => a + (cal[c.key] ?? 0), 0)
  const modal = (items: Item[], c: Conteos) => {
    let best: Item | null = null
    for (const i of items) if ((c[i.key] ?? 0) > 0 && (!best || (c[i.key] ?? 0) > (c[best.key] ?? 0))) best = i
    return best ? best.short ?? best.label : null
  }

  const colorTotal = suma(col)
  const idxCaoba = COLORES.findIndex((c) => c.key === 'CAOBA')
  const nCaobaMas = COLORES.slice(idxCaoba).reduce((a, c) => a + (col[c.key] ?? 0), 0)

  const firmezaTotal = suma(fir)
  const nFirmes = (fir.FIRME ?? 0) + (fir.MUY_FIRME ?? 0)

  const brix = (m.brix || []).filter((b) => Number.isFinite(b) && b > 0)
  const brixPromedio = brix.length ? Math.round((brix.reduce((a, b) => a + b, 0) / brix.length) * 10) / 10 : null

  const calidadN = suma(dCal)
  const condicionN = suma(dCon)
  const pctCalidad = pct(calidadN, muestra)
  const pctCondicion = pct(condicionN, muestra)
  const pctPrecalibre = pct(cal.PC ?? 0, calibreTotal)
  const clasifCalidad = clasifTotal(defectosDetalle(DEFECTOS_CALIDAD, dCal, muestra), pctCalidad)
  const clasifCondicion = clasifTotal(defectosDetalle(DEFECTOS_CONDICION, dCon, muestra), pctCondicion)
  const notaFinal = (clasifCalidad > clasifCondicion ? clasifCalidad : clasifCondicion) as 1 | 2 | 3

  // Exportable: fruta sin defectos y sobre calibre mínimo. Se asume que cada
  // fruto se registra con un solo defecto (el principal).
  const pctExportable = Math.max(0, Math.round((100 - pctCalidad - pctCondicion - pctPrecalibre) * 10) / 10)

  const pctFirmes = pct(nFirmes, firmezaTotal)
  const aptitudViaje: Resumen['aptitudViaje'] =
    pctCondicion <= 5 && (firmezaTotal === 0 || pctFirmes >= 80)
      ? 'LARGO'
      : pctCondicion <= 10 && (firmezaTotal === 0 || pctFirmes >= 60)
        ? 'MEDIO'
        : 'CORTO'

  return {
    muestra,
    calibreTotal,
    calibrePromedioMm: calibreTotal ? Math.round((sumMm / calibreTotal) * 10) / 10 : null,
    pctPrecalibre,
    pctJMas: pct(nJMas, calibreTotal),
    pct2JMas: pct(n2JMas, calibreTotal),
    calibreModal: modal(CALIBRES, cal),
    colorTotal,
    pctCaobaMas: pct(nCaobaMas, colorTotal),
    colorModal: modal(COLORES, col),
    firmezaTotal,
    pctFirmes,
    brixPromedio,
    brixMin: brix.length ? Math.min(...brix) : null,
    brixMax: brix.length ? Math.max(...brix) : null,
    calidadN,
    condicionN,
    pctCalidad,
    pctCondicion,
    pctDanos: Math.round((pctCalidad + pctCondicion) * 10) / 10,
    clasifCalidad,
    clasifCondicion,
    notaFinal,
    pctExportable,
    aptitudViaje,
  }
}

export const APTITUD_LABEL: Record<Resumen['aptitudViaje'], string> = {
  LARGO: 'Largo viaje',
  MEDIO: 'Medio viaje',
  CORTO: 'Corto viaje / mercado cercano',
}

export function clasifColor(c: 1 | 2 | 3) {
  return c === 1 ? 'bg-green-100 text-green-800' : c === 2 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
}

export interface Foto { src: string; nota?: string }

export function toFotos(v: unknown): Foto[] {
  if (!Array.isArray(v)) return []
  return v
    .map((f) => (typeof f === 'string' ? { src: f } : f && typeof f === 'object' ? (f as Foto) : null))
    .filter((f): f is Foto => !!f && typeof f.src === 'string' && f.src.length > 0)
}

// ── Diagnóstico (semáforo) ────────────────────────────────────────────────
// Lectura rápida del muestreo para quien recibe el informe. Criterio
// referencial: no apto con pudrición > 1% o exportable < 70%; apto con nota
// final 1 y exportable >= 85%; el resto, revisar.

export type EstadoMuestreo = 'APTO' | 'REVISAR' | 'NO_APTO'

export const ESTADO_INFO: Record<EstadoMuestreo, { titulo: string; badge: string; fondo: string; rgb: [number, number, number] }> = {
  APTO: { titulo: 'Apto exportación', badge: 'bg-green-600 text-white', fondo: 'bg-green-50 border-green-200', rgb: [22, 128, 61] },
  REVISAR: { titulo: 'Revisar', badge: 'bg-amber-500 text-white', fondo: 'bg-amber-50 border-amber-200', rgb: [217, 119, 6] },
  NO_APTO: { titulo: 'No apto', badge: 'bg-red-600 text-white', fondo: 'bg-red-50 border-red-200', rgb: [220, 38, 38] },
}

const f1 = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

export function diagnostico(m: MuestreoLike, r: Resumen = resumenMuestreo(m)) {
  const dCal = defectosDetalle(DEFECTOS_CALIDAD, toConteos(m.defectosCalidad), m.tamanoMuestra)
  const dCon = defectosDetalle(DEFECTOS_CONDICION, toConteos(m.defectosCondicion), m.tamanoMuestra)
  const pudricion = dCon.find((d) => d.key === 'PUDRICION')?.pct ?? 0

  const motivos: string[] = []
  let estado: EstadoMuestreo
  if (pudricion > TOLERANCIA_PUDRICION.c2 || r.pctExportable < 70) {
    estado = 'NO_APTO'
    if (pudricion > TOLERANCIA_PUDRICION.c2) motivos.push(`pudrición ${f1(pudricion)}%`)
    if (r.pctExportable < 70) motivos.push(`exportable bajo 70% (${f1(r.pctExportable)}%)`)
  } else if (r.notaFinal === 1 && r.pctExportable >= 85) {
    estado = 'APTO'
  } else {
    estado = 'REVISAR'
    if (r.notaFinal > 1) motivos.push(`defectos fuera de tolerancia (nota ${r.notaFinal})`)
    if (r.pctExportable < 85) motivos.push(`exportable ${f1(r.pctExportable)}%`)
  }

  const frases: string[] = []
  frases.push(`Exportable estimado ${f1(r.pctExportable)}% · daños ${f1(r.pctDanos)}% (calidad ${f1(r.pctCalidad)}%, condición ${f1(r.pctCondicion)}%).`)
  if (r.calibreTotal) {
    const cal = distribucion(CALIBRES, toConteos(m.calibres))
    const moda = cal.reduce((a, b) => (b.pct > a.pct ? b : a))
    let s = `Calibre dominante ${moda.label} (${f1(moda.pct)}%); ${f1(r.pct2JMas)}% en 2J o mayor; promedio ${r.calibrePromedioMm} mm.`
    if (r.pctPrecalibre > 0) s += ` Pre-calibre ${f1(r.pctPrecalibre)}%.`
    frases.push(s)
  }
  if (r.colorTotal) {
    const col = distribucion(COLORES, toConteos(m.colores))
    const moda = col.reduce((a, b) => (b.pct > a.pct ? b : a))
    frases.push(`Color dominante ${moda.nombre.toLowerCase()} (${f1(moda.pct)}%); ${f1(r.pctCaobaMas)}% caoba o más oscuro.`)
  }
  const todos = [...dCal.map((d) => ({ ...d, tipo: 'calidad' })), ...dCon.map((d) => ({ ...d, tipo: 'condición' }))]
  if (todos.length) {
    const peor = todos.reduce((a, b) => (b.pct > a.pct ? b : a))
    frases.push(`Principal problema: ${peor.label.toLowerCase()} (${f1(peor.pct)}%, ${peor.tipo}).`)
  } else {
    frases.push('Sin defectos registrados en la muestra.')
  }
  const extra: string[] = []
  if (r.firmezaTotal) extra.push(`firmeza ${f1(r.pctFirmes)}% firme o muy firme`)
  if (r.brixPromedio !== null) extra.push(`°Brix promedio ${r.brixPromedio} (${r.brixMin}–${r.brixMax})`)
  if (extra.length) frases.push(extra.join(' · ').replace(/^./, (c) => c.toUpperCase()) + '.')

  return { estado, motivos, frases }
}

// ── Valorización por calibre ──────────────────────────────────────────────
// Reparte la fruta exportable según la curva de calibres (sin pre-calibre) y
// la valoriza con los precios de referencia del módulo Cosecha (US$/kg).

export function valorizacion(m: MuestreoLike & { kilos?: number | null }, r: Resumen = resumenMuestreo(m)) {
  const cal = toConteos(m.calibres)
  const exportables = CALIBRES.filter((c) => c.key !== 'PC')
  const total = exportables.reduce((a, c) => a + (cal[c.key] ?? 0), 0)
  if (!total) return null
  const kilos = m.kilos && m.kilos > 0 ? m.kilos : null
  const kgExport = kilos ? (kilos * r.pctExportable) / 100 : null
  const filas = exportables
    .map((c) => {
      const share = (cal[c.key] ?? 0) / total
      const precio = PRECIOS_CALIBRES.find((p) => p.calibre === c.key)?.precioUSD ?? null
      const kg = kgExport !== null ? kgExport * share : null
      return {
        calibre: c.key,
        pct: Math.round(share * 1000) / 10,
        precio,
        kg: kg !== null ? Math.round(kg) : null,
        usd: kg !== null && precio !== null ? Math.round(kg * precio) : null,
      }
    })
    .filter((f) => f.pct > 0)
  const precioPonderado = filas.reduce((a, f) => a + (f.pct / 100) * (f.precio ?? 0), 0)
  const sinPrecio = filas.filter((f) => f.precio === null).map((f) => f.calibre)
  return {
    filas,
    kilos,
    kgExport: kgExport !== null ? Math.round(kgExport) : null,
    usdTotal: kgExport !== null ? Math.round(filas.reduce((a, f) => a + (f.usd ?? 0), 0)) : null,
    // US$ por kg exportable y por kg cosechado (descontando lo no exportable).
    precioPonderado: Math.round(precioPonderado * 100) / 100,
    usdPorKgCosechado: Math.round(((precioPonderado * r.pctExportable) / 100) * 100) / 100,
    sinPrecio,
  }
}

export const FUENTE_PRECIOS = 'Precios de referencia por calibre (US$/kg) del módulo Cosecha, ODEPA / Asoex.'

export function fmtUsd(n: number) {
  return `US$ ${Math.round(n).toLocaleString('es-CL')}`
}
