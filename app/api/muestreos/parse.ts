import { toConteos, toFotos } from '@/lib/muestreo'

const num = (v: unknown) => {
  if (v === '' || v === null || v === undefined) return null
  const n = parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)

// Normaliza el cuerpo recibido desde el formulario de muestreo.
export function parseMuestreo(d: any) {
  const brix = Array.isArray(d.brix) ? d.brix : String(d.brix ?? '').split(/[\s;]+/)
  return {
    fecha: d.fecha ? new Date(d.fecha) : new Date(),
    tipo: ['PRECOSECHA', 'COSECHA', 'DESPACHO'].includes(d.tipo) ? d.tipo : 'COSECHA',
    predioId: d.predioId ? parseInt(d.predioId) : null,
    productor: str(d.productor),
    cuartel: str(d.cuartel),
    variedad: str(d.variedad)?.toUpperCase() ?? '',
    lote: str(d.lote),
    guia: str(d.guia),
    nEnvases: str(d.nEnvases),
    kilos: num(d.kilos),
    tamanoMuestra: Math.max(1, parseInt(d.tamanoMuestra) || 30),
    tempPulpa: num(d.tempPulpa),
    tempAmbiente: num(d.tempAmbiente),
    calibres: toConteos(d.calibres),
    colores: toConteos(d.colores),
    firmeza: toConteos(d.firmeza),
    brix: brix.map(num).filter((b: number | null): b is number => b !== null && b > 0 && b < 40),
    defectosCalidad: toConteos(d.defectosCalidad),
    defectosCondicion: toConteos(d.defectosCondicion),
    fotos: toFotos(d.fotos).slice(0, 12).map((f) => ({ src: f.src, nota: f.nota?.slice(0, 200) || '' })),
    observaciones: str(d.observaciones),
    latitud: num(d.latitud),
    longitud: num(d.longitud),
  }
}
