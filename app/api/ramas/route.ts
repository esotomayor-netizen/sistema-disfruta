export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized } from '@/lib/session'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { searchParams } = new URL(req.url)
  const arbolId = searchParams.get('arbolId')

  const ramas = await prisma.rama.findMany({
    where: arbolId ? { arbolId: parseInt(arbolId) } : {},
    orderBy: { codigo: 'asc' },
    include: { arbol: { include: { predio: true } }, _count: { select: { conteos: true } } },
  })
  return NextResponse.json(ramas)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const data = await req.json()
  const rama = await prisma.rama.create({
    data: {
      arbolId: parseInt(data.arbolId),
      codigo: data.codigo,
      longitudCm: data.longitudCm ? parseFloat(data.longitudCm) : null,
    },
    include: { arbol: { include: { predio: true } } },
  })
  return NextResponse.json(rama, { status: 201 })
}
