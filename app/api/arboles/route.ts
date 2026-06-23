export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized } from '@/lib/session'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { searchParams } = new URL(req.url)
  const predioId = searchParams.get('predioId')

  const arboles = await prisma.arbol.findMany({
    where: predioId ? { predioId: parseInt(predioId) } : {},
    orderBy: { codigo: 'asc' },
    include: { predio: true, _count: { select: { ramas: true } } },
  })
  return NextResponse.json(arboles)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const data = await req.json()
  const arbol = await prisma.arbol.create({
    data: {
      predioId: parseInt(data.predioId),
      codigo: data.codigo,
      variedad: data.variedad || null,
    },
    include: { predio: true },
  })
  return NextResponse.json(arbol, { status: 201 })
}
