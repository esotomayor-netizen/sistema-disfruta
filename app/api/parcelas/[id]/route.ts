import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json()
  const parcela = await prisma.parcela.update({
    where: { id: parseInt(params.id) },
    data: {
      nombre: data.nombre,
      superficie: parseFloat(data.superficie),
      cultivo: data.cultivo,
      ubicacion: data.ubicacion,
      activa: data.activa,
    },
  })
  return NextResponse.json(parcela)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.parcela.update({
    where: { id: parseInt(params.id) },
    data: { activa: false },
  })
  return NextResponse.json({ ok: true })
}
