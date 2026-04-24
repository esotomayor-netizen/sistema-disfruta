import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado')
  const parcelaId = searchParams.get('parcelaId')

  const labores = await prisma.labor.findMany({
    where: {
      ...(estado ? { estado } : {}),
      ...(parcelaId ? { parcelaId: parseInt(parcelaId) } : {}),
    },
    orderBy: { fecha: 'desc' },
    include: { parcela: true, responsable: true },
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
      parcelaId: parseInt(data.parcelaId),
      responsableId: parseInt(data.responsableId),
    },
    include: { parcela: true, responsable: true },
  })
  return NextResponse.json(labor, { status: 201 })
}
