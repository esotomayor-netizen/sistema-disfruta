export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'
import { notifyAgendaProgramada, AGENDA_WHATSAPP_SUPERVISOR_EMAIL } from '@/lib/notify'
import { nearestNeighborOrder, buildTimedSchedule, type GeoPoint } from '@/lib/geo'
import { coordenadaComuna } from '@/lib/comunas-cl'

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

interface PredioLite {
  id: number
  latitud: number | null
  longitud: number | null
  comuna: string | null
  tecnicoId: number
  visitasMensuales: number
  nombre?: string
  encargado?: { id: number; nombre: string; apellido: string; email: string; telefono: string | null } | null
}

// Punto resuelto: GPS real del predio, o el centro de su comuna cuando no tiene GPS cargado.
function resolvePoint(p: { latitud: number | null; longitud: number | null; comuna: string | null }): GeoPoint | null {
  if (p.latitud != null && p.longitud != null) return { lat: p.latitud, lng: p.longitud }
  return coordenadaComuna(p.comuna)
}

// Nearest-neighbor greedy sort to minimize travel distance between consecutive visits
function sortByProximity(predios: PredioLite[]): PredioLite[] {
  const withGps = predios.filter((p) => p.latitud != null && p.longitud != null)
  const withoutGps = predios.filter((p) => p.latitud == null || p.longitud == null)
  if (withGps.length === 0) return predios

  return [
    ...nearestNeighborOrder(withGps.map((p) => ({ ...p, lat: p.latitud!, lng: p.longitud! }))),
    ...withoutGps,
  ]
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

  const { mes, sobreescribir = false, tecnicoId } = await req.json()
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return NextResponse.json({ error: 'Formato de mes inválido (YYYY-MM)' }, { status: 400 })
  }

  const [year, month] = mes.split('-').map(Number)
  const workingDays = getWorkingDays(year, month)
  if (workingDays.length === 0) {
    return NextResponse.json({ error: 'El mes no tiene días hábiles' }, { status: 400 })
  }

  const predioWhere: any = { activa: true, tecnicoId: { not: null } }
  if (tecnicoId) predioWhere.tecnicoId = Number(tecnicoId)

  const predios = await prisma.predio.findMany({
    where: predioWhere,
    select: {
      id: true,
      nombre: true,
      latitud: true,
      longitud: true,
      comuna: true,
      visitasMensuales: true,
      tecnicoId: true,
      encargado: { select: { id: true, nombre: true, apellido: true, email: true, telefono: true } },
    },
  })

  if (predios.length === 0) {
    return NextResponse.json({ error: 'El técnico no tiene predios activos asignados' }, { status: 400 })
  }

  // Group predios by their assigned tecnico
  const byTecnico = new Map<number, PredioLite[]>()
  predios.forEach((p) => {
    const tid = p.tecnicoId!
    if (!byTecnico.has(tid)) byTecnico.set(tid, [])
    byTecnico.get(tid)!.push(p as PredioLite)
  })

  const tecnicos = await prisma.usuario.findMany({
    where: { id: { in: Array.from(byTecnico.keys()) } },
    select: { id: true, origenLat: true, origenLng: true },
  })
  const origenPorTecnico = new Map(
    tecnicos.filter((t) => t.origenLat != null && t.origenLng != null)
      .map((t) => [t.id, { lat: t.origenLat!, lng: t.origenLng! }])
  )

  if (sobreescribir) {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59, 999)
    const deleteWhere: any = { fecha: { gte: start, lte: end } }
    if (tecnicoId) deleteWhere.tecnicoId = Number(tecnicoId)
    await prisma.agendaVisita.deleteMany({ where: deleteWhere })
  }

  // Group working days by weekday column: weekdayGroups[0]=all Mondays, ..., [4]=all Fridays
  const weekdayGroups: Date[][] = [[], [], [], [], []]
  workingDays.forEach((d) => {
    const col = d.getDay() - 1 // Mon→0, Tue→1, Wed→2, Thu→3, Fri→4
    if (col >= 0 && col <= 4) weekdayGroups[col].push(d)
  })

  const toCreate: { fecha: Date; predioId: number; tecnicoId: number; notas: null }[] = []

  for (const [tecId, tecnicoPredios] of Array.from(byTecnico.entries())) {
    const origen = origenPorTecnico.get(tecId)

    // Usa el GPS real del predio, o el centro de su comuna cuando no tiene GPS cargado,
    // para el ordenamiento geográfico y (si aplica) el cálculo de tiempos de viaje.
    const efectivos: PredioLite[] = tecnicoPredios.map((p) => {
      const punto = resolvePoint(p)
      return punto ? { ...p, latitud: punto.lat, longitud: punto.lng } : p
    })
    const conPunto = efectivos.filter((p) => p.latitud != null && p.longitud != null)

    if (origen && conPunto.length > 0) {
      // Modelo de horario real: 8:00–17:00, Lun-Vie, con tiempos de viaje desde el origen del técnico.
      const items = conPunto.map((p) => ({
        id: p.id,
        lat: p.latitud!,
        lng: p.longitud!,
        visitas: Math.max(1, p.visitasMensuales),
      }))
      const schedule = buildTimedSchedule(items, workingDays, origen)
      schedule.forEach((e) => {
        const [hh, mm] = e.horaInicio.split(':').map(Number)
        toCreate.push({
          fecha: new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate(), hh, mm, 0),
          predioId: e.id,
          tecnicoId: tecId,
          notas: null,
        })
      })
    } else {
      // Modelo simple (sin origen definido para el técnico): distribución diagonal por semana/día.
      const sorted = sortByProximity(efectivos)
      const maxVisits = Math.max(...sorted.map((p) => Math.max(1, p.visitasMensuales)))
      const queue: PredioLite[] = []
      for (let pass = 0; pass < maxVisits; pass++) {
        for (const p of sorted) if (pass < Math.max(1, p.visitasMensuales)) queue.push(p)
      }

      queue.forEach((predio, idx) => {
        // Diagonal distribution: col cycles Mon→Tue→Wed→Thu→Fri,
        // row shifts by col so each weekday starts in a different week of the month.
        const col = idx % 5
        const row = Math.floor(idx / 5)
        const group = weekdayGroups[col]
        if (!group || group.length === 0) return
        const actualRow = (row + col) % group.length
        const day = group[actualRow]
        toCreate.push({
          fecha: new Date(toDateStr(day) + 'T12:00:00'),
          predioId: predio.id,
          tecnicoId: tecId,
          notas: null,
        })
      })
    }
  }

  await prisma.agendaVisita.createMany({ data: toCreate, skipDuplicates: true })

  const generador = await prisma.usuario.findUnique({ where: { id: (session.user as any).id } })
  if (generador?.email !== AGENDA_WHATSAPP_SUPERVISOR_EMAIL) {
    console.log(`[notify] agenda-programada: usuario que genera (${generador?.email ?? 'desconocido'}) no es ${AGENDA_WHATSAPP_SUPERVISOR_EMAIL}, se omiten avisos`)
  } else {
    const predioMap = new Map(predios.map((p) => [p.id, p]))
    await Promise.all(
      toCreate.map(async (item) => {
        const predio = predioMap.get(item.predioId)
        if (!predio?.encargado) {
          console.log(`[notify] agenda-programada: predio id ${item.predioId} sin Encargado asignado, se omite aviso`)
          return
        }
        if (!predio.encargado.telefono) {
          console.log(`[notify] agenda-programada: encargado "${predio.encargado.nombre} ${predio.encargado.apellido}" sin teléfono, se omite aviso`)
          return
        }
        try {
          await notifyAgendaProgramada(predio.encargado, predio.nombre ?? '', item.fecha)
        } catch (e) {
          console.error('[notify] agenda-programada:', e)
        }
      })
    )
  }

  return NextResponse.json({
    ok: true,
    creadas: toCreate.length,
    tecnicos: byTecnico.size,
    diasHabiles: workingDays.length,
    mes,
  })
}
