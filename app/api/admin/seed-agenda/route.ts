export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'

// ── Datos de la planilla ──────────────────────────────────────────────────────
const ASSIGNMENTS: { email: string; label: string; predios: { name: string; visitsPerMonth: number }[] }[] = [
  {
    email: 'j.lecaros@lcfruit.com',
    label: 'JORGE LECAROS',
    predios: [
      { name: 'CORCOLEN',            visitsPerMonth: 1 },
      { name: 'CREMASCHI',           visitsPerMonth: 2 },
      { name: 'JLECAROS',            visitsPerMonth: 4 },
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
    email: 'j.varas@lcfruit.com',
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

// ── Feriados nacionales Chile Jun-Jul 2026 ────────────────────────────────────
const HOLIDAYS_CL = [
  '2026-06-29', // San Pedro y San Pablo (lunes)
  '2026-07-16', // Virgen del Carmen (jueves)
]

// ── Helpers ───────────────────────────────────────────────────────────────────
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

/** Días hábiles de un mes, opcionalmente desde un día mínimo */
function getWeekdays(year: number, month: number, fromDay = 1): Date[] {
  const days: Date[] = []
  const d = new Date(year, month - 1, Math.max(1, fromDay))
  while (d.getMonth() === month - 1) {
    const dow = d.getDay()
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    if (dow !== 0 && dow !== 6 && !HOLIDAYS_CL.includes(iso)) {
      days.push(new Date(d))
    }
    d.setDate(d.getDate() + 1)
  }
  return days
}

type PredioPlan = { id: number; lat: number | null; lng: number | null; visits: number; name: string }

/** Nearest-neighbor TSP: ordena predios por proximidad geográfica */
function nearestNeighborRoute(predios: PredioPlan[]): PredioPlan[] {
  const withCoords = predios.filter(p => p.lat !== null && p.lng !== null)
  const noCoords   = predios.filter(p => p.lat === null || p.lng === null)
  if (withCoords.length === 0) return predios

  const avgLat = withCoords.reduce((s, p) => s + p.lat!, 0) / withCoords.length
  const avgLng = withCoords.reduce((s, p) => s + p.lng!, 0) / withCoords.length

  const remaining = [...withCoords]
  const route: PredioPlan[] = []
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
 * Genera el schedule para un técnico dado un conjunto de días disponibles.
 * Usa la ruta nearest-neighbor para agrupar predios cercanos en el mismo día.
 * Distribuye las visitas con frecuencia uniforme a lo largo de los días.
 */
function buildSchedule(predios: PredioPlan[], days: Date[], maxPerDay = 3): { predioId: number; date: Date; predio: string }[] {
  if (days.length === 0 || predios.length === 0) return []

  // Ordenar por ruta óptima
  const ordered = nearestNeighborRoute(predios)

  // Expandir en lista plana con día objetivo
  const visitList: { predioId: number; predio: string; targetIdx: number }[] = []
  for (let ri = 0; ri < ordered.length; ri++) {
    const p = ordered[ri]
    for (let vi = 0; vi < p.visits; vi++) {
      // Espaciar visitas del mismo predio + desplazar por posición en ruta
      const spacedDay = Math.round((vi / Math.max(p.visits, 1)) * (days.length - 1))
      const routeOffset = Math.round((ri / Math.max(ordered.length, 1)) * (days.length / Math.max(p.visits, 1) - 1))
      const targetIdx = Math.min(spacedDay + routeOffset, days.length - 1)
      visitList.push({ predioId: p.id, predio: p.name, targetIdx })
    }
  }

  // Ordenar por día objetivo
  visitList.sort((a, b) => a.targetIdx - b.targetIdx)

  // Asignar a días respetando máximo por día
  const buckets = new Map<number, { predioId: number; predio: string }[]>()
  for (const v of visitList) {
    let idx = v.targetIdx
    let attempts = 0
    while (attempts < days.length) {
      const bucket = buckets.get(idx) ?? []
      if (bucket.length < maxPerDay) {
        buckets.set(idx, [...bucket, { predioId: v.predioId, predio: v.predio }])
        break
      }
      idx = (idx + 1) % days.length
      attempts++
    }
  }

  const result: { predioId: number; date: Date; predio: string }[] = []
  buckets.forEach((entries, idx) => {
    entries.forEach(e => result.push({ predioId: e.predioId, date: days[idx], predio: e.predio }))
  })
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
  const dryRun: boolean = body.dryRun ?? true
  const clearExisting: boolean = body.clearExisting ?? false

  // Días hábiles disponibles
  // Junio: solo desde el 18 (días pasados excluidos)
  // Julio: mes completo
  const JUNE_DAYS = getWeekdays(2026, 6, 18)  // 8 días hábiles
  const JULY_DAYS = getWeekdays(2026, 7, 1)   // 22 días hábiles
  const TOTAL_WORKDAYS = 22 // días hábiles de un mes completo (referencia)

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

    // Emparejar predios por nombre (fuzzy)
    const matched: PredioPlan[] = []
    const unmatched: string[] = []

    for (const item of predioList) {
      let best: typeof allPredios[0] | null = null
      let bestScore = 0
      for (const p of allPredios) {
        const score = Math.max(similarity(item.name, p.nombre), similarity(item.name, p.empresa.razonSocial))
        if (score > bestScore) { bestScore = score; best = p }
      }
      if (best && bestScore >= 0.3) {
        // Visitas proporcionales para junio (solo 8 días de 22 disponibles)
        const juneVisits = Math.round(item.visitsPerMonth * JUNE_DAYS.length / TOTAL_WORKDAYS)
        const julyVisits = item.visitsPerMonth
        // Guardamos visits = julyVisits; para junio lo calculamos por separado
        matched.push({
          id: best.id,
          lat: best.latitud,
          lng: best.longitud,
          visits: julyVisits,       // usado para julio
          name: `${best.nombre} (${best.empresa.razonSocial})`,
        })
        // Registrar visitas de junio aparte
        const juneEntry = { ...matched[matched.length - 1], visits: juneVisits }
        if (juneVisits > 0) {
          const juneSchedule = buildSchedule([juneEntry], JUNE_DAYS)
          for (const e of juneSchedule) {
            toCreate.push({
              fecha: new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate(), 12, 0, 0),
              predioId: e.predioId,
              tecnicoId: tecnico.id,
              notas: 'Propuesta de agenda',
            })
          }
        }
      } else {
        unmatched.push(item.name)
      }
    }

    // Julio: schedule completo con ruta óptima
    const julySchedule = buildSchedule(matched, JULY_DAYS)
    for (const e of julySchedule) {
      toCreate.push({
        fecha: new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate(), 12, 0, 0),
        predioId: e.predioId,
        tecnicoId: tecnico.id,
        notas: 'Propuesta de agenda',
      })
    }

    const myRecords = toCreate.filter(r => r.tecnicoId === tecnico.id)
    report[label] = {
      tecnicoId: tecnico.id,
      email: tecnico.email,
      junioVisitas: myRecords.filter(r => r.fecha.getMonth() === 5).length,
      julioVisitas: myRecords.filter(r => r.fecha.getMonth() === 6).length,
      totalVisitas: myRecords.length,
      matched: matched.map(p => p.name),
      unmatched,
    }
  }

  if (!dryRun) {
    if (clearExisting) {
      const tecnicoIds = (Object.values(report) as any[]).filter(r => r.tecnicoId).map(r => r.tecnicoId as number)
      await prisma.agendaVisita.deleteMany({
        where: {
          fecha: { gte: new Date(2026, 5, 18), lt: new Date(2026, 7, 1) },
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
    totalRegistros: toCreate.length,
    report,
    mensaje: dryRun
      ? `Simulación: ${toCreate.length} visitas se crearían. Envía dryRun:false para confirmar.`
      : `✓ ${toCreate.length} visitas agendadas como propuesta (Jun 18 – Jul 31 2026)`,
  })
}
