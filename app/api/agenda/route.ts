export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { notifyAgendaProgramada, AGENDA_WHATSAPP_SUPERVISOR_EMAIL } from '@/lib/notify'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // YYYY-MM
  const fecha = searchParams.get('fecha') // YYYY-MM-DD (single day)
  const tecnicoId = searchParams.get('tecnicoId')

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
    },
    orderBy: { fecha: 'asc' },
    include: { predio: { include: { cultivos: true } }, tecnico: true },
  })
  return NextResponse.json(agendas)
}

export async function POST(req: Request) {
  const data = await req.json()
  const hora = /^\d{2}:\d{2}$/.test(data.hora) ? data.hora : '12:00'
  const agenda = await prisma.agendaVisita.create({
    data: {
      fecha: new Date(`${data.fecha}T${hora}:00`),
      notas: data.notas || null,
      predioId: parseInt(data.predioId),
      tecnicoId: parseInt(data.tecnicoId),
    },
    include: { predio: { include: { cultivos: true, encargado: true } }, tecnico: true },
  })

  const session = await getSession()
  if (!session) {
    console.log('[notify] agenda-programada: sin sesión, se omite aviso')
  } else {
    const generador = await prisma.usuario.findUnique({ where: { id: (session.user as any).id } })
    if (generador?.email !== AGENDA_WHATSAPP_SUPERVISOR_EMAIL) {
      console.log(`[notify] agenda-programada: usuario que agenda (${generador?.email ?? 'desconocido'}) no es ${AGENDA_WHATSAPP_SUPERVISOR_EMAIL}, se omite aviso`)
    } else if (!agenda.predio.encargado) {
      console.log(`[notify] agenda-programada: predio "${agenda.predio.nombre}" no tiene Encargado asignado, se omite aviso`)
    } else if (!agenda.predio.encargado.telefono) {
      console.log(`[notify] agenda-programada: encargado "${agenda.predio.encargado.nombre} ${agenda.predio.encargado.apellido}" no tiene teléfono cargado, se omite aviso`)
    } else {
      try {
        await notifyAgendaProgramada(agenda.predio.encargado, agenda.predio.nombre, agenda.fecha)
      } catch (e) {
        console.error('[notify] agenda-programada:', e)
      }
    }
  }

  return NextResponse.json(agenda, { status: 201 })
}
