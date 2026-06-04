import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const predio = await prisma.predio.findUnique({ where: { id: parseInt(params.id) } })
  if (!predio) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(predio)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json()
  const predio = await prisma.predio.update({
    where: { id: parseInt(params.id) },
    data: {
      nombre: data.nombre,
      superficie: parseFloat(data.superficie),
      cultivo: data.cultivo,
      ubicacion: data.ubicacion,
      activa: data.activa,
    },
  })
  return NextResponse.json(predio)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.predio.update({ where: { id: parseInt(params.id) }, data: { activa: false } })
  return NextResponse.json({ ok: true })
}
