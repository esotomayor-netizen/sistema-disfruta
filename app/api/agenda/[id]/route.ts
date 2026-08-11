export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const existente = await prisma.agendaVisita.findUnique({ where: { id: parseInt(params.id) } })
  if (!existente) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const esDueño = existente.tecnicoId === session.user.id
  if (!isSupervisor(session) && !esDueño) {
    return NextResponse.json({ error: 'Solo puedes editar tus propias visitas agendadas' }, { status: 403 })
  }

  const data = await req.json()
  const hora = /^\d{2}:\d{2}$/.test(data.hora) ? data.hora : '12:00'

  if (!isSupervisor(session)) {
    // Un técnico solo puede reprogramar fecha/hora/notas de su propia visita
    const agenda = await prisma.agendaVisita.update({
      where: { id: existente.id },
      data: {
        fecha: new Date(`${data.fecha}T${hora}:00`),
        notas: data.notas || null,
      },
      include: { predio: { include: { cultivos: true } }, oportunidad: true, tecnico: true },
    })
    return NextResponse.json(agenda)
  }

  const predioId = data.predioId ? parseInt(data.predioId) : null
  const oportunidadId = data.oportunidadId ? parseInt(data.oportunidadId) : null
  if (!predioId && !oportunidadId) {
    return NextResponse.json({ error: 'Debe indicar un predioId o un oportunidadId' }, { status: 400 })
  }

  const agenda = await prisma.agendaVisita.update({
    where: { id: existente.id },
    data: {
      fecha: new Date(`${data.fecha}T${hora}:00`),
      predioId,
      oportunidadId,
      tecnicoId: parseInt(data.tecnicoId),
      notas: data.notas || null,
    },
    include: { predio: { include: { cultivos: true } }, oportunidad: true, tecnico: true },
  })
  return NextResponse.json(agenda)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!isSupervisor(session)) {
    return NextResponse.json({ error: 'Solo un supervisor puede eliminar visitas agendadas' }, { status: 403 })
  }
  await prisma.agendaVisita.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
