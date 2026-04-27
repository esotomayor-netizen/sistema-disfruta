import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json()
  const aplicacion = await prisma.aplicacion.update({
    where: { id: parseInt(params.id) },
    data: {
      producto: data.producto,
      tipoProducto: data.tipoProducto,
      dosis: parseFloat(data.dosis),
      unidad: data.unidad,
      fecha: new Date(data.fecha),
      estado: data.estado,
      observaciones: data.observaciones || null,
      predioId: parseInt(data.predioId),
      tecnicoId: parseInt(data.tecnicoId),
    },
    include: { predio: true, tecnico: true },
  })
  return NextResponse.json(aplicacion)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.aplicacion.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
