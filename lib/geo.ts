export type GeoPoint = { lat: number; lng: number }

/**
 * Convierte una coordenada en formato grados-minutos-segundos (ej: 34°47'56.11"S,
 * con comillas rectas o tipográficas) o grados decimales (ej: -34.798919) a un
 * número decimal. Devuelve null si no se puede interpretar.
 */
export function parseCoordinate(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Ya viene en grados decimales
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return parseFloat(trimmed)

  const normalized = trimmed.replace(',', '.')
  const nums = normalized.match(/\d+(?:\.\d+)?/g)
  if (!nums || nums.length === 0) return null

  // Grados-minutos-segundos (o solo grados decimales con símbolo °/hemisferio).
  // No depende del carácter exacto usado para separar (°, ', ", ′, ″, comillas
  // tipográficas “ ’, espacios, etc.) — solo extrae los números en orden.
  let value: number
  if (nums.length === 1) {
    value = parseFloat(nums[0])
  } else {
    const deg = parseFloat(nums[0])
    const min = parseFloat(nums[1])
    const sec = nums[2] !== undefined ? parseFloat(nums[2]) : 0
    value = deg + min / 60 + sec / 3600
  }

  const hemisferio = normalized.match(/[NSEOWnseow]/)?.[0].toUpperCase()
  const negativo = hemisferio === 'S' || hemisferio === 'O' || hemisferio === 'W' || /^-/.test(normalized)
  value = negativo ? -Math.abs(value) : value

  return Math.round(value * 1e6) / 1e6
}

/** Ordena puntos por ruta más corta (heurística nearest-neighbor desde el centroide). */
export function nearestNeighborOrder<T extends GeoPoint>(points: T[]): T[] {
  if (points.length <= 1) return points

  const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length
  const avgLng = points.reduce((s, p) => s + p.lng, 0) / points.length

  const remaining = [...points]
  const route: T[] = []
  let curLat = avgLat, curLng = avgLng

  while (remaining.length > 0) {
    let bestIdx = 0, bestDist = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const dlat = remaining[i].lat - curLat
      const dlng = remaining[i].lng - curLng
      const dist = dlat * dlat + dlng * dlng
      if (dist < bestDist) { bestDist = dist; bestIdx = i }
    }
    route.push(remaining[bestIdx])
    curLat = remaining[bestIdx].lat
    curLng = remaining[bestIdx].lng
    remaining.splice(bestIdx, 1)
  }
  return route
}

/** Distancia en línea recta entre dos puntos (km), fórmula de Haversine. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371
  const dLat = (b.lat - a.lat) * (Math.PI / 180)
  const dLng = (b.lng - a.lng) * (Math.PI / 180)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * (Math.PI / 180)) * Math.cos(b.lat * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

// Sin acceso a una API de rutas real, se estima el tiempo de viaje por carretera
// a partir de la distancia en línea recta: se corrige por un factor de trazado
// (las carreteras no son rectas) y se divide por una velocidad promedio mixta
// (autopista + caminos rurales). Son supuestos razonables, no un cálculo exacto.
const FACTOR_TRAZADO_VIAL = 1.3
const VELOCIDAD_PROMEDIO_KMH = 65

/** Minutos de viaje estimados por carretera entre dos puntos. */
export function travelMinutes(a: GeoPoint, b: GeoPoint): number {
  const km = haversineKm(a, b) * FACTOR_TRAZADO_VIAL
  return (km / VELOCIDAD_PROMEDIO_KMH) * 60
}

export interface DiaProgramado {
  id: number
  date: Date
  horaInicio: string
  distKm: number
}

const DURACION_VISITA_MIN_DEFAULT = 90
const JORNADA_INICIO_MIN = 8 * 60
const JORNADA_FIN_MIN = 17 * 60

/**
 * Arma la agenda real de un técnico con punto de partida fijo: sale de `origen`
 * a las 8:00, visita en el orden geográfico más cercano al punto donde está en
 * cada momento, cada visita dura `duracionVisitaMin`, y antes de sumar una
 * visita al día verifica que — sumando el viaje de vuelta al origen — alcance
 * a terminar antes de las 17:00. Si no alcanza, pasa al siguiente día hábil.
 *
 * `visitas` en cada item indica cuántas veces al mes debe repetirse esa visita
 * (objetivo de la visita: revisar brotación/flores/cuaja/labores, que cambian
 * con el tiempo). Para que dos visitas al mismo predio no queden juntas —lo
 * que no aporta nada si el huerto no alcanzó a cambiar—, cada repetición
 * recibe una "fecha objetivo" separada uniformemente a lo largo de la ventana
 * de días hábiles (ej. 2 visitas/mes en un mes de ~22 días hábiles → objetivo
 * en el día hábil 0 y en el día hábil ~11, es decir ~15 días de por medio) y
 * solo se agenda a partir de que su objetivo se cumple.
 */
export function buildTimedSchedule<T extends GeoPoint & { id: number; visitas: number }>(
  items: T[],
  workdays: Date[],
  origen: GeoPoint,
  duracionVisitaMin = DURACION_VISITA_MIN_DEFAULT
): DiaProgramado[] {
  if (workdays.length === 0 || items.length === 0) return []

  interface Instancia extends GeoPoint { id: number; targetIdx: number }
  const pendientes: Instancia[] = []
  for (const item of items) {
    const n = Math.max(1, item.visitas)
    for (let i = 0; i < n; i++) {
      const targetIdx = Math.min(workdays.length - 1, Math.round((i * workdays.length) / n))
      pendientes.push({ id: item.id, lat: item.lat, lng: item.lng, targetIdx })
    }
  }

  const result: DiaProgramado[] = []

  for (let dayIdx = 0; dayIdx < workdays.length && pendientes.length > 0; dayIdx++) {
    let cursor: GeoPoint = origen
    let minutos = JORNADA_INICIO_MIN
    let visitasHoy = 0

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // De las visitas cuya fecha objetivo ya se cumplió, toma la más cercana al punto actual.
      let mejorIdx = -1
      let mejorDist = Infinity
      for (let i = 0; i < pendientes.length; i++) {
        if (pendientes[i].targetIdx > dayIdx) continue
        const d = haversineKm(cursor, pendientes[i])
        if (d < mejorDist) { mejorDist = d; mejorIdx = i }
      }
      if (mejorIdx === -1) break // nada pendiente y listo para hoy

      const visita = pendientes[mejorIdx]
      const ida = travelMinutes(cursor, visita)
      const llegada = minutos + ida
      const vuelta = travelMinutes(visita, origen)
      const finDia = llegada + duracionVisitaMin + vuelta

      if (visitasHoy > 0 && finDia > JORNADA_FIN_MIN) break // no alcanza en el día, se retoma mañana

      result.push({
        id: visita.id,
        date: workdays[dayIdx],
        horaInicio: `${String(Math.floor(llegada / 60)).padStart(2, '0')}:${String(Math.round(llegada % 60)).padStart(2, '0')}`,
        distKm: Math.round(mejorDist * 10) / 10,
      })

      cursor = visita
      minutos = llegada + duracionVisitaMin
      visitasHoy++
      pendientes.splice(mejorIdx, 1)
    }
  }

  return result
}

/** Genera un link de Google Maps con ruta multi-parada (sin necesidad de API key). */
export function googleMapsRouteUrl(points: GeoPoint[]): string | null {
  if (points.length === 0) return null
  if (points.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${points[0].lat},${points[0].lng}`
  }
  const origin = `${points[0].lat},${points[0].lng}`
  const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`
  const waypoints = points.slice(1, -1).map(p => `${p.lat},${p.lng}`).join('|')

  const params = new URLSearchParams({ api: '1', origin, destination, travelmode: 'driving' })
  if (waypoints) params.set('waypoints', waypoints)
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
