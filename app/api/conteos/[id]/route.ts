export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized } from '@/lib/session'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const data = await req.json()
  const conteo = await prisma.conteo.update({
    where: { id: parseInt(params.id) },
    data: {
      tipoEstructura: data.tipoEstructura,
      cantidad: parseInt(data.cantidad),
      fecha: data.fecha ? new Date(data.fecha) : undefined,
      notas: data.notas || null,
    },
    include: {
      rama: { include: { arbol: { include: { predio: true } } } },
      tecnico: true,
    },
  })
  return NextResponse.json(conteo)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()

  await prisma.conteo.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
