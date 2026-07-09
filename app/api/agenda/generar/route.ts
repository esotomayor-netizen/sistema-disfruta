export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'

function getWorkingDays(year: number, month: number): Date[] {
  const days: Date[] = []
  const date = new Date(year, month - 1, 1)
  while (date.getMonth() === month - 1) {
    const dow = date.getDay()
    if (dow >= 1 && dow <= 5) days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return days
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface PredioLite { id: number; latitud: number | null; longitud: number | null; tecnicoId: number }

// Nearest-neighbor greedy sort to minimize travel distance between consecutive visits
function sortByProximity(predios: PredioLite[]): PredioLite[] {
  const withGps = predios.filter((p) => p.latitud != null && p.longitud != null)
  const withoutGps = predios.filter((p) => p.latitud == null || p.longitud == null)
  if (withGps.length === 0) return predios

  // Start from centroid of all GPS predios
  const centLat = withGps.reduce((s, p) => s + p.latitud!, 0) / withGps.length
  const centLon = withGps.reduce((s, p) => s + p.longitud!, 0) / withGps.length

  const result: PredioLite[] = []
  const remaining = [...withGps]
  let curLat = centLat
  let curLon = centLon

  while (remaining.length > 0) {
    let minDist = Infinity
    let minIdx = 0
    remaining.forEach((p, i) => {
      const d = haversineKm(curLat, curLon, p.latitud!, p.longitud!)
      if (d < minDist) { minDist = d; minIdx = i }
    })
    result.push(remaining[minIdx])
    curLat = remaining[minIdx].latitud!
    curLon = remaining[minIdx].longitud!
    remaining.splice(minIdx, 1)
  }

  return [...result, ...withoutGps]
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!isSupervisor(session)) {
    return NextResponse.json({ error: 'Solo supervisores pueden generar la agenda' }, { status: 403 })
  }

  const { mes, sobreescribir = false } = await req.json()
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return NextResponse.json({ error: 'Formato de mes inválido (YYYY-MM)' }, { status: 400 })
  }

  const [year, month] = mes.split('-').map(Number)
  const workingDays = getWorkingDays(year, month)
  if (workingDays.length === 0) {
    return NextResponse.json({ error: 'El mes no tiene días hábiles' }, { status: 400 })
  }

  const predios = await prisma.predio.findMany({
    where: { activa: true, tecnicoId: { not: null } },
    select: { id: true, latitud: true, longitud: true, tecnicoId: true },
  })

  if (predios.length === 0) {
    return NextResponse.json({ error: 'No hay predios activos con técnico asignado' }, { status: 400 })
  }

  // Group predios by their assigned tecnico
  const byTecnico = new Map<number, PredioLite[]>()
  predios.forEach((p) => {
    const tid = p.tecnicoId!
    if (!byTecnico.has(tid)) byTecnico.set(tid, [])
    byTecnico.get(tid)!.push(p as PredioLite)
  })

  if (sobreescribir) {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59, 999)
    await prisma.agendaVisita.deleteMany({ where: { fecha: { gte: start, lte: end } } })
  }

  const toCreate: { fecha: Date; predioId: number; tecnicoId: number; notas: null }[] = []

  for (const [tecnicoId, tecnicoPredios] of Array.from(byTecnico.entries())) {
    // Sort predios geographically to cluster nearby farms on the same day
    const sorted = sortByProximity(tecnicoPredios)
    const count = sorted.length

    sorted.forEach((predio, idx) => {
      // Spread evenly: consecutive (geographically close) predios land on same/adjacent day
      const dayIdx = Math.min(
        Math.floor((idx * workingDays.length) / count),
        workingDays.length - 1
      )
      toCreate.push({
        fecha: new Date(toDateStr(workingDays[dayIdx]) + 'T12:00:00'),
        predioId: predio.id,
        tecnicoId,
        notas: null,
      })
    })
  }

  await prisma.agendaVisita.createMany({ data: toCreate, skipDuplicates: true })

  return NextResponse.json({
    ok: true,
    creadas: toCreate.length,
    tecnicos: byTecnico.size,
    diasHabiles: workingDays.length,
    mes,
  })
}
