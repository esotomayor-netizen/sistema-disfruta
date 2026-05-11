export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json()
  const labor = await prisma.labor.update({
    where: { id: parseInt(params.id) },
    data: {
      tipo: data.tipo,
      descripcion: data.descripcion,
      fecha: new Date(data.fecha),
      fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
      estado: data.estado,
      observaciones: data.observaciones || null,
      predioId: parseInt(data.predioId),
      responsableId: parseInt(data.responsableId),
    },
    include: { predio: true, responsable: true },
  })
  return NextResponse.json(labor)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.labor.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
