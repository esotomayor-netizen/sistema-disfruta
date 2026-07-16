export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized } from '@/lib/session'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; interaccionId: string } }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  await prisma.interaccion.delete({ where: { id: Number(params.interaccionId) } })
  return NextResponse.json({ ok: true })
}
