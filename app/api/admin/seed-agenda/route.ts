export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'

// ── Planilla de asignaciones ──────────────────────────────────────────────────
const ASSIGNMENTS: { email: string; label: string; predios: { name: string; visitsPerMonth: number }[] }[] = [
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
    email: 'e.sotomayor@exportadoradisfruta.cl',
    label: 'EDUARDO SOTOMAYOR',
    predios: [
      { name: 'JUAN DOMINGO RIVERA ARENAS',                 visitsPerMonth: 2 },
      { name: 'SIRZO BALTAZAR CARO LIZANA',                 visitsPerMonth: 2 },
      { name: 'SOC AGRICOLA GANADERA Y FORESTAL SAN RAMON', visitsPerMonth: 2 },
      { name: 'SOCIEDAD AGRICOLA EL RINCON B',              visitsPerMonth: 2 },
      { name: 'SOCIEDAD AGRICOLA Y FORESTAL PINO',          visitsPerMonth: 2 },
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

const HOLIDAYS_CL = ['2026-06-29', '2026-07-16'] // San Pedro, Virgen del Carmen

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

/** Días hábiles de un mes, opcionalmente desde un día mínimo. */
function getWorkdays(year: number, month: number, fromDay = 1): Date[] {
  const days: Date[] = []
  const d = new Date(year, month - 1, Math.max(1, fromDay))
  while (d.getMonth() === month - 1) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6 && !HOLIDAYS_CL.includes(isoDate(d))) {
      days.push(new Date(d))
    }
    d.setDate(d.getDate() + 1)
  }
  return days
}

// Junio: desde el 18 (días restantes del mes) — 8 días hábiles
// Julio: mes completo                           — 22 días hábiles
const JUNE_DAYS = getWorkdays(2026, 6, 18)
const JULY_DAYS = getWorkdays(2026, 7, 1)

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

// ── Nearest-neighbor TSP ──────────────────────────────────────────────────────
type Predio = { id: number; lat: number | null; lng: number | null; visits: number; name: string }

function nearestNeighborRoute(predios: Predio[]): Predio[] {
  const withCoords = predios.filter(p => p.lat !== null && p.lng !== null)
  const noCoords   = predios.filter(p => p.lat === null  || p.lng === null)
  if (withCoords.length === 0) return predios

  const avgLat = withCoords.reduce((s, p) => s + p.lat!, 0) / withCoords.length
  const avgLng = withCoords.reduce((s, p) => s + p.lng!, 0) / withCoords.length

  const remaining = [...withCoords]
  const route: Predio[] = []
  let curLat = avgLat, curLng = avgLng

  while (remaining.length > 0) {
    let bestIdx = 0, bestDist = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const dlat = remaining[i].lat! - curLat
      const dlng = remaining[i].lng! - curLng
      const dist = dlat * dlat + dlng * dlng
      if (dist < bestDist) { bestDist = dist; bestIdx = i }
    }
    route.push(remaining[bestIdx])
    curLat = remaining[bestIdx].lat!
    curLng = remaining[bestIdx].lng!
    remaining.splice(bestIdx, 1)
  }
  return [...route, ...noCoords]
}

/**
 * Genera la agenda para un conjunto de días hábiles (un mes).
 * Usa la cuota mensual completa (visitsPerMonth) sin ajuste proporcional.
 *
 * Estrategia:
 *  1. Ordena predios por ruta óptima (nearest-neighbor TSP).
 *  2. Crea "pasadas": pasada 0 = primera visita a todos, pasada 1 = segunda, etc.
 *     Dentro de cada pasada los predios están en orden geográfico → cercanos juntos.
 *  3. Empaqueta en lotes de exactamente 3 visitas por día de salida.
 *  4. Distribuye los días de salida uniformemente entre los días hábiles disponibles.
 */
function buildSchedule(
  predios: Predio[],
  workdays: Date[],
  maxPerDay = 3
): { predioId: number; date: Date; predio: string }[] {
  if (workdays.length === 0 || predios.length === 0) return []

  // Usa la cuota mensual tal cual (sin factor proporcional)
  const prediosWithVisits = predios.map(p => ({ ...p, visits: Math.max(1, p.visits) }))

  // 2. Ruta óptima
  const ordered = nearestNeighborRoute(prediosWithVisits)

  // 3. Construir pasadas (pass 0 = primera visita a cada predio, etc.)
  const maxVisits = Math.max(...ordered.map(p => p.visits))
  const allVisits: { predioId: number; predio: string; passIdx: number; routeIdx: number }[] = []

  for (let pass = 0; pass < maxVisits; pass++) {
    for (let ri = 0; ri < ordered.length; ri++) {
      if (pass < ordered[ri].visits) {
        allVisits.push({ predioId: ordered[ri].id, predio: ordered[ri].name, passIdx: pass, routeIdx: ri })
      }
    }
  }

  // Ordenar: pasada primero (distribuye en el tiempo), luego posición en ruta (agrupa geográficamente)
  allVisits.sort((a, b) => a.passIdx !== b.passIdx ? a.passIdx - b.passIdx : a.routeIdx - b.routeIdx)

  // 4. Empaquetar en lotes de maxPerDay
  const batches: { predioId: number; predio: string }[][] = []
  for (let i = 0; i < allVisits.length; i += maxPerDay) {
    batches.push(allVisits.slice(i, i + maxPerDay))
  }

  // 5. Asignar cada lote a un día de trabajo distribuido uniformemente
  const result: { predioId: number; date: Date; predio: string }[] = []
  for (let bi = 0; bi < batches.length; bi++) {
    const dayIdx = Math.min(
      Math.round((bi / Math.max(batches.length - 1, 1)) * (workdays.length - 1)),
      workdays.length - 1
    )
    for (const entry of batches[bi]) {
      result.push({ predioId: entry.predioId, date: workdays[dayIdx], predio: entry.predio })
    }
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

  const allPredios = await prisma.predio.findMany({
    where: { activa: true },
    include: { empresa: true },
  })
  const allUsers = await prisma.usuario.findMany({ where: { activo: true } })

  const report: Record<string, any> = {}
  const toCreate: { fecha: Date; predioId: number; tecnicoId: number; notas: string }[] = []

  for (const assignment of ASSIGNMENTS) {
    const { email, label, predios: predioList } = assignment

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
        matched.push({
          id:     best.id,
          lat:    best.latitud,
          lng:    best.longitud,
          visits: item.visitsPerMonth, // el buildSchedule ajusta por período
          name:   `${best.nombre} (${best.empresa.razonSocial})`,
        })
      } else {
        unmatched.push(item.name)
      }
    }

    // Generar agenda mes a mes con cuota mensual completa en cada uno
    const juneSchedule = buildSchedule(matched, JUNE_DAYS)
    const julySchedule = buildSchedule(matched, JULY_DAYS)
    const schedule = [...juneSchedule, ...julySchedule]

    for (const e of schedule) {
      toCreate.push({
        fecha:     new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate(), 12, 0, 0),
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
      byDay[key].push(e.predio.split('(')[0].trim())
    }

    report[label] = {
      tecnicoId:      tecnico.id,
      email:          tecnico.email,
      junioVisitas:   juneSchedule.length,
      julioVisitas:   julySchedule.length,
      totalVisitas:   schedule.length,
      diasDeSalida:   Object.keys(byDay).length,
      matched:        matched.map(p => p.name),
      unmatched,
      muestra:        Object.entries(byDay).slice(0, 6).map(([d, ps]) => `${d}: ${ps.join(', ')}`),
    }
  }

  if (!dryRun) {
    if (clearExisting) {
      const tecnicoIds = (Object.values(report) as any[])
        .filter(r => r.tecnicoId)
        .map(r => r.tecnicoId as number)

      // Borrar TODA la agenda Jun+Jul para estos técnicos (incluyendo corridas anteriores)
      await prisma.agendaVisita.deleteMany({
        where: {
          fecha:     { gte: new Date(2026, 5, 1), lt: new Date(2026, 7, 1) },
          tecnicoId: { in: tecnicoIds },
        },
      })
    }
    await prisma.agendaVisita.createMany({ data: toCreate })
  }

  return NextResponse.json({
    dryRun,
    diasHabilesJunio: JUNE_DAYS.length,
    diasHabilesJulio: JULY_DAYS.length,
    feriados: HOLIDAYS_CL,
    totalRegistros: toCreate.length,
    usuariosEnBD: allUsers.map(u => ({ id: u.id, nombre: `${u.nombre} ${u.apellido}`, email: u.email, rol: u.rol, activo: u.activo })),
    report,
    mensaje: dryRun
      ? `Simulación: ${toCreate.length} visitas (${JUNE_DAYS.length} días jun + ${JULY_DAYS.length} días jul). Envía dryRun:false para crear.`
      : `✓ ${toCreate.length} visitas agendadas (18 jun – 31 jul 2026, máx 3/día, ruta óptima)`,
  })
}
