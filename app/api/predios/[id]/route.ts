import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const predio = await prisma.predio.findUnique({
    where: { id: parseInt(params.id) },
    include: { empresa: true, encargado: true },
  })
  if (!predio) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(predio)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json()
  const predio = await prisma.predio.update({
    where: { id: parseInt(params.id) },
    data: {
      nombre: data.nombre,
      csg: data.csg,
      superficie: parseFloat(data.superficie),
      cultivo: data.cultivo,
      ubicacion: data.ubicacion,
      activa: data.activa,
      empresaId: parseInt(data.empresaId),
      encargadoId: data.encargadoId ? parseInt(data.encargadoId) : null,
      variedades: data.variedades || null,
    },
    include: { empresa: true, encargado: true },
  })
  return NextResponse.json(predio)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.predio.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
