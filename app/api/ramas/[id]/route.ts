export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized } from '@/lib/session'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const data = await req.json()
  const rama = await prisma.rama.update({
    where: { id: parseInt(params.id) },
    data: {
      codigo: data.codigo,
      longitudCm: data.longitudCm ? parseFloat(data.longitudCm) : null,
    },
    include: { arbol: { include: { predio: true } } },
  })
  return NextResponse.json(rama)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()

  await prisma.rama.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
