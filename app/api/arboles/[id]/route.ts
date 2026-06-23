export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized } from '@/lib/session'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const arbol = await prisma.arbol.findUnique({
    where: { id: parseInt(params.id) },
    include: { predio: true, ramas: { include: { _count: { select: { conteos: true } } } } },
  })
  if (!arbol) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(arbol)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const data = await req.json()
  const arbol = await prisma.arbol.update({
    where: { id: parseInt(params.id) },
    data: {
      codigo: data.codigo,
      variedad: data.variedad || null,
    },
    include: { predio: true },
  })
  return NextResponse.json(arbol)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()

  await prisma.arbol.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
