export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'
import { nearestNeighborOrder, nearestNeighborOrderFrom, haversineKm, travelMinutes, type GeoPoint } from '@/lib/geo'
import { coordenadaComuna } from '@/lib/comunas-cl'

// ── Planilla de asignaciones ──────────────────────────────────────────────────
// `origen`: punto de partida diario del técnico (si se define, la agenda de ese
// técnico se arma con el modelo de horario real 8:00–17:00 + tiempos de viaje,
// en vez de la distribución simple de 3 visitas/día por defecto).
const ASSIGNMENTS: {
  email: string
  label: string
  origen?: GeoPoint
  predios: { name: string; visitsPerMonth: number; comuna?: string }[]
}[] = [
  {
    email: 'j.lecaros@lcfruit.com',
    label: 'JORGE LECAROS',
    predios: [
      { name: 'CORCOLEN',            visitsPerMonth: 1 },
      { name: 'CREMASCHI',           visitsPerMonth: 2 },
      { name: 'J LECAROS',            visitsPerMonth: 4 },
      { name: 'MARIA RITA GONZALEZ', visitsPerMonth: 2 },
      { name: 'SAN ALBERTO',         visitsPerMonth: 2 },
      { name: 'SANTA ADELAIDA',      visitsPerMonth: 1 },
      { name: 'SANTA ROSARIO',       visitsPerMonth: 4 },
    ],
  },
  {
    // Cartera y frecuencias mensuales tomadas de la planilla "visitas_mensuales.xlsx"
    // (jefe técnico Eduardo Sotomayor). Punto de salida diario: Olivar, Rancagua.
    email: 'e.sotomayor@exportadoradisfruta.cl',
    label: 'EDUARDO SOTOMAYOR',
    origen: { lat: -34.1708, lng: -70.7444 }, // Rancagua / sector Olivar
    predios: [
      { name: 'AGRICOLA ATALAYA SPA',                       visitsPerMonth: 1, comuna: 'San Francisco de Mostazal' },
      { name: 'AGRICOLA LA PALMA SPA',                      visitsPerMonth: 2, comuna: 'Las Cabras' },
      { name: 'AGRICOLA LOS TALAVERAS LTDA',                visitsPerMonth: 2, comuna: 'Teno' },
      { name: 'AGRÍCOLA COPA DE AGUA LIMITADA',             visitsPerMonth: 1, comuna: 'Linares' },
      { name: 'AGRÍCOLA LAS RAICES SPA',                    visitsPerMonth: 1, comuna: 'Curicó' },
      { name: 'ANDRES RISOPATRÓN IÑIGUEZ',                  visitsPerMonth: 1, comuna: 'San Francisco de Mostazal' },
      { name: 'INVERSIONES MAULE S.A',                      visitsPerMonth: 1, comuna: 'Talca' },
      { name: 'JUAN DOMINGO RIVERA ARENAS',                 visitsPerMonth: 2, comuna: 'Peor es Nada' },
      { name: 'SERVICIOS AGRICOLAS Y LOGISTICOS L&B LTDA',  visitsPerMonth: 1, comuna: 'Linares' },
      { name: 'SIRZO BALTAZAR CARO LIZANA',                 visitsPerMonth: 2 }, // sin comuna en la planilla
      { name: 'SOCIEDAD AGRICOLA EL RINCON B LIMITADA',     visitsPerMonth: 1, comuna: 'Peor es Nada' },
      { name: 'SOCIEDAD AGRICOLA Y FORESTAL PINO SPA',      visitsPerMonth: 2, comuna: 'Malloa' },
      { name: 'TORREFRUT LIMITADA',                         visitsPerMonth: 1, comuna: 'Curicó' }, // planilla decía "Curcio" (typo)
      { name: 'VILLA ABEJAS SPA',                            visitsPerMonth: 1, comuna: 'Placilla' },
      { name: 'VITIVINICOLA CREMASCHI SA',                  visitsPerMonth: 1, comuna: 'Linares' },
    ],
  },
  {
    email: 'j.ugarte@lcfruit.com',
    label: 'JOSE MANUEL UGARTE',
    predios: [
      { name: 'AGROLIQUID',            visitsPerMonth: 2 },
      { name: 'ANGEL MARTINEZ',        visitsPerMonth: 2 },
      { name: 'CASAS VIEJAS',          visitsPerMonth: 3 },
      { name: 'FUSION',                visitsPerMonth: 2 },
      { name: 'INVERSIONES MAULE',     visitsPerMonth: 1 },
      { name: 'JOSE DE LA JARA',       visitsPerMonth: 2 },
      { name: 'LUIS DE LA JARA',       visitsPerMonth: 2 },
      { name: 'RICARDO BRICKMANN',     visitsPerMonth: 2 },
      { name: 'SANTA MARIA DE ODESSA', visitsPerMonth: 2 },
      { name: 'TOTIHUE',               visitsPerMonth: 2 },
      { name: 'JUAN EDUARDO COX',      visitsPerMonth: 1 },
    ],
  },
  {
    email: 'jvaras@lcfruit.com',
    label: 'JOSE IGNACIO VARAS',
    predios: [
      { name: 'ALIRO CORNEJO',           visitsPerMonth: 2 },
      { name: 'ANDREA DEL PILAR FARIAS', visitsPerMonth: 1 },
      { name: 'ANDRES RISOPATRON',       visitsPerMonth: 2 },
      { name: 'COPA DE AGUA',            visitsPerMonth: 2 },
      { name: 'LAS RAICES',              visitsPerMonth: 2 },
      { name: 'TORREFRUT',               visitsPerMonth: 2 },
    ],
  },
]

// Feriados chilenos conocidos que caen en los meses típicamente generados.
// Al generar para un mes distinto, revisar si corresponde agregar otros.
const HOLIDAYS_CL = ['2026-06-29', '2026-07-16', '2026-10-12'] // San Pedro, Virgen del Carmen, Encuentro de Dos Mundos

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

/** Días hábiles de un mes. */
function getWorkdays(year: number, month: number): Date[] {
  const days: Date[] = []
  const d = new Date(year, month - 1, 1)
  while (d.getMonth() === month - 1) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6 && !HOLIDAYS_CL.includes(isoDate(d))) {
      days.push(new Date(d))
    }
    d.setDate(d.getDate() + 1)
  }
  return days
}

function proximoMes(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ── Fuzzy matching ────────────────────────────────────────────────────────────
function normalize(s: string) {
  return s
    .toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\b(LTDA|SPA|SA|LIMITADA|SOCIEDAD|AGRICOLA|GANADERA|FORESTAL|SOC|INVERSIONES)\b/g, '')
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function similarity(a: string, b: string): number {
  const na = normalize(a), nb = normalize(b)
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.9
  const wa = na.split(' ').filter(w => w.length > 2)
  const wb = new Set(nb.split(' ').filter(w => w.length > 2))
  const common = wa.filter(w => wb.has(w)).length
  return common / Math.max(wa.length, wb.size, 1)
}

// ── Modelo simple (sin origen definido): 3 visitas/día, distribuidas parejo ───
type Predio = {
  id: number
  lat: number | null
  lng: number | null
  visits: number
  name: string
  comunaUsada?: string | null
  comunaAConfirmar?: boolean
}

function nearestNeighborRoute(predios: Predio[]): Predio[] {
  const withCoords = predios.filter(p => p.lat !== null && p.lng !== null) as (Predio & { lat: number; lng: number })[]
  const noCoords   = predios.filter(p => p.lat === null  || p.lng === null)
  if (withCoords.length === 0) return predios

  return [...nearestNeighborOrder(withCoords), ...noCoords]
}

function buildSchedule(
  predios: Predio[],
  workdays: Date[],
  maxPerDay = 3
): { predioId: number; date: Date; predio: string; horaInicio: string | null }[] {
  if (workdays.length === 0 || predios.length === 0) return []

  const prediosWithVisits = predios.map(p => ({ ...p, visits: Math.max(1, p.visits) }))
  const ordered = nearestNeighborRoute(prediosWithVisits)

  const maxVisits = Math.max(...ordered.map(p => p.visits))
  const allVisits: { predioId: number; predio: string; passIdx: number; routeIdx: number }[] = []

  for (let pass = 0; pass < maxVisits; pass++) {
    for (let ri = 0; ri < ordered.length; ri++) {
      if (pass < ordered[ri].visits) {
        allVisits.push({ predioId: ordered[ri].id, predio: ordered[ri].name, passIdx: pass, routeIdx: ri })
      }
    }
  }

  allVisits.sort((a, b) => a.passIdx !== b.passIdx ? a.passIdx - b.passIdx : a.routeIdx - b.routeIdx)

  const batches: { predioId: number; predio: string }[][] = []
  for (let i = 0; i < allVisits.length; i += maxPerDay) {
    batches.push(allVisits.slice(i, i + maxPerDay))
  }

  const result: { predioId: number; date: Date; predio: string; horaInicio: string | null }[] = []
  for (let bi = 0; bi < batches.length; bi++) {
    const dayIdx = Math.min(
      Math.round((bi / Math.max(batches.length - 1, 1)) * (workdays.length - 1)),
      workdays.length - 1
    )
    for (const entry of batches[bi]) {
      result.push({ predioId: entry.predioId, date: workdays[dayIdx], predio: entry.predio, horaInicio: null })
    }
  }

  return result
}

// ── Modelo con horario real (cuando el técnico tiene un `origen` definido) ────
// Simula el día del técnico: sale del `origen` a las 8:00, visita en orden de
// ruta geográfica (nearest-neighbor desde el origen), cada visita dura
// DURACION_VISITA_MIN, y antes de sumar una visita al día se verifica que,
// sumando el viaje de vuelta al origen, alcance a terminar antes de las 17:00.
const DURACION_VISITA_MIN = 90
const HORA_INICIO_MIN = 8 * 60
const HORA_FIN_MIN = 17 * 60

function buildScheduleTimed(
  predios: (Predio & { lat: number; lng: number })[],
  workdays: Date[],
  origen: GeoPoint
): { predioId: number; date: Date; predio: string; horaInicio: string; distKm: number }[] {
  if (workdays.length === 0 || predios.length === 0) return []

  const prediosWithVisits = predios.map(p => ({ ...p, visits: Math.max(1, p.visits) }))
  const ordered = nearestNeighborOrderFrom(origen, prediosWithVisits)

  const maxVisits = Math.max(...ordered.map(p => p.visits))
  const queue: typeof ordered = []
  for (let pass = 0; pass < maxVisits; pass++) {
    for (const p of ordered) if (pass < p.visits) queue.push(p)
  }

  const result: { predioId: number; date: Date; predio: string; horaInicio: string; distKm: number }[] = []
  let dayIdx = 0
  let cursor: GeoPoint = origen
  let minutos = HORA_INICIO_MIN
  let visitasHoy = 0

  function esInicioDeDia() {
    return visitasHoy === 0
  }

  for (const visita of queue) {
    if (dayIdx >= workdays.length) break // sin más días hábiles en el mes: el resto queda "sin cupo"

    let ida = travelMinutes(cursor, visita)
    let llegada = minutos + ida
    const vuelta = travelMinutes(visita, origen)
    const finDia = llegada + DURACION_VISITA_MIN + vuelta

    if (!esInicioDeDia() && finDia > HORA_FIN_MIN) {
      dayIdx++
      cursor = origen
      minutos = HORA_INICIO_MIN
      visitasHoy = 0
      if (dayIdx >= workdays.length) break
      ida = travelMinutes(cursor, visita)
      llegada = minutos + ida
    }

    result.push({
      predioId: visita.id,
      date: workdays[dayIdx],
      predio: visita.name,
      horaInicio: `${String(Math.floor(llegada / 60)).padStart(2, '0')}:${String(Math.round(llegada % 60)).padStart(2, '0')}`,
      distKm: Math.round(haversineKm(cursor, visita) * 10) / 10,
    })

    cursor = visita
    minutos = llegada + DURACION_VISITA_MIN
    visitasHoy++
  }

  return result
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!isSupervisor(session)) {
    return NextResponse.json({ error: 'Solo supervisores pueden ejecutar esta acción' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const dryRun: boolean        = body.dryRun        ?? true
  const clearExisting: boolean = body.clearExisting ?? false
  const mes: string            = /^\d{4}-\d{2}$/.test(body.mes) ? body.mes : proximoMes()
  const [year, month] = mes.split('-').map(Number)
  const workdays = getWorkdays(year, month)

  const allPredios = await prisma.predio.findMany({
    where: { activa: true },
    include: { empresa: true },
  })
  const allUsers = await prisma.usuario.findMany({ where: { activo: true } })

  const report: Record<string, any> = {}
  const toCreate: { fecha: Date; predioId: number; tecnicoId: number; notas: string }[] = []
  const comunaUpdates: { predioId: number; comuna: string }[] = []

  for (const assignment of ASSIGNMENTS) {
    const { email, label, predios: predioList, origen } = assignment

    const tecnico = allUsers.find(u => u.email === email)
    if (!tecnico) {
      report[label] = { error: `Técnico no encontrado (email: ${email})` }
      continue
    }

    // Emparejar predios con fuzzy matching
    const matched: Predio[] = []
    const unmatched: string[] = []

    for (const item of predioList) {
      let best: typeof allPredios[0] | null = null
      let bestScore = 0
      for (const p of allPredios) {
        const score = Math.max(similarity(item.name, p.nombre), similarity(item.name, p.empresa.razonSocial))
        if (score > bestScore) { bestScore = score; best = p }
      }
      if (best && bestScore >= 0.3) {
        let lat = best.latitud
        let lng = best.longitud
        let comunaUsada: string | null = best.comuna ?? null

        if ((lat === null || lng === null) && item.comuna) {
          const punto = coordenadaComuna(item.comuna)
          if (punto) { lat = punto.lat; lng = punto.lng }
        }
        if (item.comuna && item.comuna !== best.comuna) {
          comunaUpdates.push({ predioId: best.id, comuna: item.comuna })
          comunaUsada = item.comuna
        }

        matched.push({
          id:     best.id,
          lat,
          lng,
          visits: item.visitsPerMonth,
          name:   `${best.nombre} (${best.empresa.razonSocial})`,
          comunaUsada,
          comunaAConfirmar: !item.comuna && (lat === null || lng === null),
        })
      } else {
        unmatched.push(item.name)
      }
    }

    const usaModeloHorario = !!origen && matched.some(p => p.lat !== null && p.lng !== null)
    const schedule = usaModeloHorario
      ? buildScheduleTimed(matched.filter(p => p.lat !== null && p.lng !== null) as any, workdays, origen!)
      : buildSchedule(matched, workdays)

    const sinUbicacion = usaModeloHorario ? matched.filter(p => p.lat === null || p.lng === null) : []

    for (const e of schedule) {
      const [hh, mm] = 'horaInicio' in e && e.horaInicio ? e.horaInicio.split(':').map(Number) : [12, 0]
      toCreate.push({
        fecha:     new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate(), hh, mm, 0),
        predioId:  e.predioId,
        tecnicoId: tecnico.id,
        notas:     'Propuesta de agenda',
      })
    }

    // Agrupar por día para el reporte
    const byDay: Record<string, string[]> = {}
    for (const e of schedule) {
      const key = isoDate(e.date)
      if (!byDay[key]) byDay[key] = []
      const hora = 'horaInicio' in e && e.horaInicio ? `${e.horaInicio} ` : ''
      byDay[key].push(`${hora}${e.predio.split('(')[0].trim()}`)
    }

    report[label] = {
      tecnicoId:      tecnico.id,
      email:          tecnico.email,
      modelo:         usaModeloHorario ? 'horario real (8:00–17:00 + viaje desde origen)' : 'simple (3 visitas/día distribuidas)',
      visitasTotal:   schedule.length,
      diasDeSalida:   Object.keys(byDay).length,
      matched:        matched.map(p => `${p.name}${p.comunaUsada ? ` [${p.comunaUsada}]` : ''}${p.comunaAConfirmar ? ' ⚠ sin GPS ni comuna' : ''}`),
      unmatched,
      sinCupoEsteMes: schedule.length < matched.reduce((s, p) => s + Math.max(1, p.visits), 0)
        ? 'Algunas visitas no alcanzaron cupo en los días hábiles del mes'
        : undefined,
      sinUbicacion:   sinUbicacion.map(p => p.name),
      itinerario:     Object.entries(byDay).map(([d, ps]) => `${d}: ${ps.join(' · ')}`),
    }
  }

  if (!dryRun) {
    if (clearExisting) {
      const tecnicoIds = (Object.values(report) as any[])
        .filter(r => r.tecnicoId)
        .map(r => r.tecnicoId as number)

      const start = new Date(year, month - 1, 1)
      const end = new Date(year, month, 1)
      await prisma.agendaVisita.deleteMany({
        where: {
          fecha:     { gte: start, lt: end },
          tecnicoId: { in: tecnicoIds },
        },
      })
    }
    await prisma.agendaVisita.createMany({ data: toCreate })

    for (const u of comunaUpdates) {
      await prisma.predio.update({ where: { id: u.predioId }, data: { comuna: u.comuna } })
    }
  }

  return NextResponse.json({
    dryRun,
    mes,
    diasHabiles: workdays.length,
    feriadosConsiderados: HOLIDAYS_CL,
    totalRegistros: toCreate.length,
    comunasAActualizar: comunaUpdates.length,
    usuariosEnBD: allUsers.map(u => ({ id: u.id, nombre: `${u.nombre} ${u.apellido}`, email: u.email, rol: u.rol, activo: u.activo })),
    report,
    mensaje: dryRun
      ? `Simulación para ${mes}: ${toCreate.length} visitas (${workdays.length} días hábiles). Revisa el itinerario y envía dryRun:false para crear.`
      : `✓ ${toCreate.length} visitas agendadas para ${mes} (${comunaUpdates.length} predios actualizados con comuna).`,
  })
}
