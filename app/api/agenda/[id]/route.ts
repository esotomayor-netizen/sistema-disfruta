export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!isSupervisor(session)) {
    return NextResponse.json({ error: 'Solo un supervisor puede editar visitas agendadas' }, { status: 403 })
  }
  const data = await req.json()
  const agenda = await prisma.agendaVisita.update({
    where: { id: parseInt(params.id) },
    data: {
      fecha: new Date(data.fecha + 'T12:00:00'),
      predioId: parseInt(data.predioId),
      tecnicoId: parseInt(data.tecnicoId),
      notas: data.notas || null,
    },
    include: { predio: { include: { cultivos: true } }, tecnico: true },
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
