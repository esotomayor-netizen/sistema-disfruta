export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'

// ── Datos de la planilla ──────────────────────────────────────────────────────
const ASSIGNMENTS: Record<string, { name: string; visits: number }[]> = {
  'JORGE LECAROS': [
    { name: 'CORCOLEN',           visits: 1 },
    { name: 'CREMASCHI',          visits: 2 },
    { name: 'JLECAROS',           visits: 4 },
    { name: 'MARIA RITA GONZALEZ',visits: 2 },
    { name: 'SAN ALBERTO',        visits: 2 },
    { name: 'SANTA ADELAIDA',     visits: 1 },
    { name: 'SANTA ROSARIO',      visits: 4 },
  ],
  'EDUARDO SOTOMAYOR': [
    { name: 'JUAN DOMINGO RIVERA ARENAS',                    visits: 2 },
    { name: 'SIRZO BALTAZAR CARO LIZANA',                   visits: 2 },
    { name: 'SOC AGRICOLA GANADERA Y FORESTAL SAN RAMON',   visits: 2 },
    { name: 'SOCIEDAD AGRICOLA EL RINCON B',                visits: 2 },
    { name: 'SOCIEDAD AGRICOLA Y FORESTAL PINO',            visits: 2 },
  ],
  'JOSE MANUEL UGARTE': [
    { name: 'AGROLIQUID',          visits: 2 },
    { name: 'ANGEL MARTINEZ',      visits: 2 },
    { name: 'CASAS VIEJAS',        visits: 3 },
    { name: 'FUSION',              visits: 2 },
    { name: 'INVERSIONES MAULE',   visits: 1 },
    { name: 'JOSE DE LA JARA',     visits: 2 },
    { name: 'LUIS DE LA JARA',     visits: 2 },
    { name: 'RICARDO BRICKMANN',   visits: 2 },
    { name: 'SANTA MARIA DE ODESSA', visits: 2 },
    { name: 'TOTIHUE',             visits: 2 },
    { name: 'JUAN EDUARDO COX',    visits: 1 },
  ],
  'JOSE IGNACIO VARAS': [
    { name: 'ALIRO CORNEJO',              visits: 2 },
    { name: 'ANDREA DEL PILAR FARIAS',    visits: 1 },
    { name: 'ANDRES RISOPATRON',          visits: 2 },
    { name: 'COPA DE AGUA',               visits: 2 },
    { name: 'LAS RAICES',                 visits: 2 },
    { name: 'TORREFRUT',                  visits: 2 },
  ],
}

// ── Utilidades ────────────────────────────────────────────────────────────────
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

function getWeekdays(year: number, month: number, holidays: string[] = []): Date[] {
  const days: Date[] = []
  const d = new Date(year, month - 1, 1)
  while (d.getMonth() === month - 1) {
    const dow = d.getDay()
    const iso = d.toISOString().slice(0, 10)
    if (dow !== 0 && dow !== 6 && !holidays.includes(iso)) {
      days.push(new Date(d))
    }
    d.setDate(d.getDate() + 1)
  }
  return days
}

// Schedule visits for one technician using geographic clustering
function buildSchedule(
  predios: { id: number; lat: number | null; lng: number | null; visits: number }[],
  days: Date[],
  maxPerDay = 3
): { predioId: number; date: Date }[] {
  // Sort predios by latitude (geographic north-south) then longitude
  const sorted = [...predios].sort((a, b) => {
    if (a.lat !== null && b.lat !== null) return a.lat - b.lat
    return 0
  })

  // Expand into visit list with evenly spaced target day indices
  const visitList: { predioId: number; targetIdx: number }[] = []
  for (const p of sorted) {
    for (let i = 0; i < p.visits; i++) {
      const targetIdx = Math.round((i / p.visits) * (days.length - 1))
      visitList.push({ predioId: p.id, targetIdx })
    }
  }
  visitList.sort((a, b) => a.targetIdx - b.targetIdx)

  // Assign to day buckets respecting max per day
  const buckets: Map<number, number[]> = new Map()
  for (const v of visitList) {
    let idx = v.targetIdx
    while (true) {
      const bucket = buckets.get(idx) ?? []
      if (bucket.length < maxPerDay) {
        buckets.set(idx, [...bucket, v.predioId])
        break
      }
      idx = (idx + 1) % days.length
    }
  }

  const result: { predioId: number; date: Date }[] = []
  buckets.forEach((predioIds, idx) => {
    predioIds.forEach(predioId => result.push({ predioId, date: days[idx] }))
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
  const months: number[] = body.months ?? [6, 7] // June and July
  const year: number = body.year ?? 2026

  // Chilean holidays Jun-Jul 2026
  const holidays = ['2026-07-16'] // Virgen del Carmen

  // Fetch all predios and users from DB
  const allPredios = await prisma.predio.findMany({
    where: { activa: true },
    include: { empresa: true },
  })
  const allUsers = await prisma.usuario.findMany({
    where: { activo: true },
  })

  const report: Record<string, any> = {}
  const toCreate: { fecha: Date; predioId: number; tecnicoId: number; notas: string }[] = []

  for (const [tecnicoName, predioList] of Object.entries(ASSIGNMENTS)) {
    // Find technician
    const [firstName, ...rest] = tecnicoName.split(' ')
    const lastName = rest.join(' ')
    const tecnico = allUsers.find(u =>
      normalize(`${u.nombre} ${u.apellido}`) === normalize(tecnicoName) ||
      (normalize(u.nombre).includes(normalize(firstName)) &&
       normalize(u.apellido).includes(normalize(lastName.split(' ')[0])))
    )

    if (!tecnico) {
      report[tecnicoName] = { error: `Técnico no encontrado en BD`, predios: [] }
      continue
    }

    const matchedPredios: { id: number; lat: number | null; lng: number | null; visits: number; matchedName: string }[] = []
    const unmatched: string[] = []

    for (const item of predioList) {
      // Try to match predio by nombre or empresa razonSocial
      let best: typeof allPredios[0] | null = null
      let bestScore = 0

      for (const p of allPredios) {
        const scoreNombre = similarity(item.name, p.nombre)
        const scoreEmpresa = similarity(item.name, p.empresa.razonSocial)
        const score = Math.max(scoreNombre, scoreEmpresa)
        if (score > bestScore) {
          bestScore = score
          best = p
        }
      }

      if (best && bestScore >= 0.3) {
        matchedPredios.push({
          id: best.id,
          lat: best.latitud,
          lng: best.longitud,
          visits: item.visits,
          matchedName: `${best.nombre} (${best.empresa.razonSocial}) score=${bestScore.toFixed(2)}`,
        })
      } else {
        unmatched.push(item.name)
      }
    }

    // Build schedule for each month
    const scheduleEntries: { predioId: number; date: Date }[] = []
    for (const month of months) {
      const days = getWeekdays(year, month, holidays)
      const monthSchedule = buildSchedule(matchedPredios, days)
      scheduleEntries.push(...monthSchedule)
    }

    // Collect for creation
    for (const entry of scheduleEntries) {
      toCreate.push({
        fecha: new Date(entry.date.getFullYear(), entry.date.getMonth(), entry.date.getDate(), 12, 0, 0),
        predioId: entry.predioId,
        tecnicoId: tecnico.id,
        notas: 'Generado automáticamente',
      })
    }

    report[tecnicoName] = {
      tecnicoId: tecnico.id,
      totalVisits: scheduleEntries.length,
      matched: matchedPredios.map(p => p.matchedName),
      unmatched,
    }
  }

  if (!dryRun) {
    if (clearExisting) {
      // Remove existing agenda for these months and technicians
      const tecnicoIds = Object.values(report)
        .filter(r => r.tecnicoId)
        .map(r => r.tecnicoId as number)

      for (const month of months) {
        const start = new Date(year, month - 1, 1)
        const end = new Date(year, month, 1)
        await prisma.agendaVisita.deleteMany({
          where: {
            fecha: { gte: start, lt: end },
            tecnicoId: { in: tecnicoIds },
          },
        })
      }
    }

    await prisma.agendaVisita.createMany({ data: toCreate })
  }

  return NextResponse.json({
    dryRun,
    totalRecords: toCreate.length,
    report,
    ...(dryRun ? { message: 'Simulación — envía dryRun:false para confirmar' } : { message: `${toCreate.length} visitas agendadas en BD` }),
  })
}
