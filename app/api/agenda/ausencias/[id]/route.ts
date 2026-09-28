export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!isSupervisor(session)) {
    return NextResponse.json({ error: 'Solo supervisores pueden eliminar ausencias' }, { status: 403 })
  }

  await prisma.ausenciaTecnico.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
