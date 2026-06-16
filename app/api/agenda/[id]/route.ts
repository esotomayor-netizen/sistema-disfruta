export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!isSupervisor(session)) {
    return NextResponse.json({ error: 'Solo un supervisor puede eliminar visitas agendadas' }, { status: 403 })
  }
  await prisma.agendaVisita.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
