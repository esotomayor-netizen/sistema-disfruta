export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'
import { notifyAgendaProgramada, AGENDA_WHATSAPP_SUPERVISOR_EMAIL } from '@/lib/notify'
import { nearestNeighborOrder, buildTimedSchedule, type GeoPoint } from '@/lib/geo'
import { coordenadaComuna } from '@/lib/comunas-cl'
import { chileDateTime, chileToday } from '@/lib/tz'

interface DiaCalendario {
  year: number
  month: number // 1-12
  day: number
}

// Próximos 30 días de corrido a partir de "hoy" en Chile, quedándose solo con
// los días hábiles (Lun-Vie). Así "Generar Agenda" nunca crea visitas en el
// pasado, sin importar en qué punto del mes se ejecute.
function next30WorkingDays(): DiaCalendario[] {
  const { year, month, day } = chileToday()
  const anchor = new Date(Date.UTC(year, month - 1, day))
  const days: DiaCalendario[] = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(anchor)
    d.setUTCDate(d.getUTCDate() + i)
    const dow = d.getUTCDay()
    if (dow >= 1 && dow <= 5) {
      days.push({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() })
    }
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

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!isSupervisor(session)) {
    return NextResponse.json({ error: 'Solo supervisores pueden generar la agenda' }, { status: 403 })
  }

  const { sobreescribir = false, tecnicoId } = await req.json().catch(() => ({}))
  console.log(`[generar-diag] body: sobreescribir=${sobreescribir} tecnicoId=${tecnicoId}`)

  const workingDays = next30WorkingDays()
  if (workingDays.length === 0) {
    return NextResponse.json({ error: 'No hay días hábiles en los próximos 30 días' }, { status: 400 })
  }
  const desde = workingDays[0]
  const hasta = workingDays[workingDays.length - 1]
  console.log(`[generar-diag] ventana: ${desde.year}-${desde.month}-${desde.day} a ${hasta.year}-${hasta.month}-${hasta.day} (${workingDays.length} días hábiles)`)

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
  console.log('[generar-diag] predios:', JSON.stringify(predios.map(p => ({ id: p.id, nombre: p.nombre, comuna: p.comuna, visitasMensuales: p.visitasMensuales, tieneGps: p.latitud != null }))))

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
    const start = chileDateTime(desde.year, desde.month, desde.day, 0, 0)
    const end = chileDateTime(hasta.year, hasta.month, hasta.day, 23, 59)
    const deleteWhere: any = { fecha: { gte: start, lte: end } }
    if (tecnicoId) deleteWhere.tecnicoId = Number(tecnicoId)
    const borradas = await prisma.agendaVisita.deleteMany({ where: deleteWhere })
    console.log(`[generar-diag] sobreescribir: borradas ${borradas.count} visitas en [${start.toISOString()}, ${end.toISOString()}]`)
  }

  // Agrupa los días hábiles disponibles por columna de día de semana: [0]=Lunes, ..., [4]=Viernes
  const weekdayGroups: DiaCalendario[][] = [[], [], [], [], []]
  workingDays.forEach((d) => {
    const dow = new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay()
    const col = dow - 1 // Lun→0 ... Vie→4
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
      console.log(`[generar-diag] técnico ${tecId}: ${items.length} predios con punto, ${efectivos.length - conPunto.length} sin punto`)
      console.log('[generar-diag] items:', JSON.stringify(items.map(i => ({ id: i.id, visitas: i.visitas }))))
      const diasComoDate = workingDays.map((d) => new Date(d.year, d.month - 1, d.day))
      const schedule = buildTimedSchedule(items, diasComoDate, origen)
      console.log('[generar-diag] schedule:', JSON.stringify(schedule.map(e => ({ id: e.id, fecha: `${e.date.getFullYear()}-${e.date.getMonth()+1}-${e.date.getDate()}`, hora: e.horaInicio }))))
      schedule.forEach((e) => {
        const [hh, mm] = e.horaInicio.split(':').map(Number)
        toCreate.push({
          fecha: chileDateTime(e.date.getFullYear(), e.date.getMonth() + 1, e.date.getDate(), hh, mm),
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
        // row shifts by col so each weekday starts in a different week of the window.
        const col = idx % 5
        const row = Math.floor(idx / 5)
        const group = weekdayGroups[col]
        if (!group || group.length === 0) return
        const actualRow = (row + col) % group.length
        const day = group[actualRow]
        toCreate.push({
          fecha: chileDateTime(day.year, day.month, day.day, 9, 0),
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
    desde: `${desde.year}-${String(desde.month).padStart(2, '0')}-${String(desde.day).padStart(2, '0')}`,
    hasta: `${hasta.year}-${String(hasta.month).padStart(2, '0')}-${String(hasta.day).padStart(2, '0')}`,
  })
}
