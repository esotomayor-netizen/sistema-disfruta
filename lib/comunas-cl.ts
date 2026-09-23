import type { GeoPoint } from './geo'

function normalizarComuna(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// Coordenadas aproximadas del centro urbano de cada comuna (referencia para
// estimar rutas cuando el predio no tiene GPS propio cargado). No reemplazan
// el punto GPS real del predio una vez que se cargue.
const COMUNAS_CL: Record<string, GeoPoint> = {
  'RANCAGUA': { lat: -34.1708, lng: -70.7444 },
  'SAN FRANCISCO DE MOSTAZAL': { lat: -33.9878, lng: -70.7139 },
  'MOSTAZAL': { lat: -33.9878, lng: -70.7139 },
  'LAS CABRAS': { lat: -34.2989, lng: -71.2514 },
  'TENO': { lat: -34.8697, lng: -71.1706 },
  'LINARES': { lat: -35.8480, lng: -71.5980 },
  'CURICO': { lat: -34.9827, lng: -71.2394 },
  'TALCA': { lat: -35.4264, lng: -71.6554 },
  'MALLOA': { lat: -34.2833, lng: -70.9167 },
  // Aproximados de baja confianza — no son comunas oficiales o el nombre es
  // ambiguo (hay más de una localidad con ese nombre en Chile). Ubicados de
  // forma referencial cerca del resto de la cartera (Cachapoal/San Vicente de
  // Tagua Tagua). CONFIRMAR con el usuario antes de tomarlos como definitivos.
  'PLACILLA': { lat: -34.4300, lng: -71.1500 },
  'PEOR ES NADA': { lat: -34.4500, lng: -71.1000 },
}

/** Busca la coordenada de referencia de una comuna. Devuelve null si no está en la tabla. */
export function coordenadaComuna(nombreComuna: string | null | undefined): GeoPoint | null {
  if (!nombreComuna) return null
  return COMUNAS_CL[normalizarComuna(nombreComuna)] ?? null
}
