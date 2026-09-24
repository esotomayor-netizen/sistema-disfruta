export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { notifyAgendaProgramada, AGENDA_WHATSAPP_SUPERVISOR_EMAIL } from '@/lib/notify'
import { chileDateTime } from '@/lib/tz'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // YYYY-MM
  const fecha = searchParams.get('fecha') // YYYY-MM-DD (single day)
  const tecnicoId = searchParams.get('tecnicoId')
  const oportunidadId = searchParams.get('oportunidadId')

  let start: Date | undefined
  let end: Date | undefined
  if (fecha) {
    start = new Date(fecha)
    start.setHours(0, 0, 0, 0)
    end = new Date(fecha)
    end.setHours(23, 59, 59, 999)
  } else if (month) {
    const [y, m] = month.split('-').map(Number)
    start = new Date(y, m - 1, 1)
    end = new Date(y, m, 1)
  }

  const agendas = await prisma.agendaVisita.findMany({
    where: {
      ...(start && end ? { fecha: fecha ? { gte: start, lte: end } : { gte: start, lt: end } } : {}),
      ...(tecnicoId ? { tecnicoId: parseInt(tecnicoId) } : {}),
      ...(oportunidadId ? { oportunidadId: parseInt(oportunidadId) } : {}),
    },
    orderBy: { fecha: 'asc' },
    include: { predio: { include: { cultivos: true } }, oportunidad: true, tecnico: true },
  })
  return NextResponse.json(agendas)
}

export async function POST(req: Request) {
  const data = await req.json()
  const hora = /^\d{2}:\d{2}$/.test(data.hora) ? data.hora : '12:00'

  const predioId = data.predioId ? parseInt(data.predioId) : null
  const oportunidadId = data.oportunidadId ? parseInt(data.oportunidadId) : null
  if (!predioId && !oportunidadId) {
    return NextResponse.json({ error: 'Debe indicar un predioId o un oportunidadId' }, { status: 400 })
  }

  const [anio, mesNum, diaNum] = data.fecha.split('-').map(Number)
  const [horaNum, minNum] = hora.split(':').map(Number)

  const agenda = await prisma.agendaVisita.create({
    data: {
      fecha: chileDateTime(anio, mesNum, diaNum, horaNum, minNum),
      notas: data.notas || null,
      predioId,
      oportunidadId,
      tecnicoId: parseInt(data.tecnicoId),
    },
    include: { predio: { include: { cultivos: true, encargado: true, empresa: true } }, oportunidad: true, tecnico: true },
  })

  const session = await getSession()
  if (!session) {
    console.log('[notify] agenda-programada: sin sesión, se omite aviso')
  } else {
    const generador = await prisma.usuario.findUnique({ where: { id: (session.user as any).id } })
    if (generador?.email !== AGENDA_WHATSAPP_SUPERVISOR_EMAIL) {
      console.log(`[notify] agenda-programada: usuario que agenda (${generador?.email ?? 'desconocido'}) no es ${AGENDA_WHATSAPP_SUPERVISOR_EMAIL}, se omite aviso`)
    } else if (!agenda.predio) {
      console.log('[notify] agenda-programada: visita agendada a una oportunidad (sin predio), se omite aviso')
    } else {
      const contacto = agenda.predio.encargado?.telefono
        ? { nombre: `${agenda.predio.encargado.nombre} ${agenda.predio.encargado.apellido}`, telefono: agenda.predio.encargado.telefono }
        : agenda.predio.empresa?.contactoTelefono
          ? { nombre: agenda.predio.empresa.contactoNombre, telefono: agenda.predio.empresa.contactoTelefono }
          : null
      if (!contacto) {
        console.log(`[notify] agenda-programada: predio "${agenda.predio.nombre}" sin contacto con teléfono (ni encargado ni empresa), se omite aviso`)
      } else {
        try {
          await notifyAgendaProgramada(contacto, agenda.predio.nombre, agenda.fecha)
        } catch (e) {
          console.error('[notify] agenda-programada:', e)
        }
      }
    }
  }

  return NextResponse.json(agenda, { status: 201 })
}
