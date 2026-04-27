import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado')
  const predioId = searchParams.get('predioId')

  const labores = await prisma.labor.findMany({
    where: {
      ...(estado ? { estado } : {}),
      ...(predioId ? { predioId: parseInt(predioId) } : {}),
    },
    orderBy: { fecha: 'desc' },
    include: { predio: true, responsable: true },
  })
  return NextResponse.json(labores)
}

export async function POST(req: Request) {
  const data = await req.json()
  const labor = await prisma.labor.create({
    data: {
      tipo: data.tipo,
      descripcion: data.descripcion,
      fecha: new Date(data.fecha),
      fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
      estado: data.estado || 'PENDIENTE',
      observaciones: data.observaciones || null,
      predioId: parseInt(data.predioId),
      responsableId: parseInt(data.responsableId),
    },
    include: { predio: true, responsable: true },
  })
  return NextResponse.json(labor, { status: 201 })
}
