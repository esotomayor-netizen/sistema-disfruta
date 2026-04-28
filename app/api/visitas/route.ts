import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const visitas = await prisma.visita.findMany({
    orderBy: { fecha: 'desc' },
    include: {
      predio: { include: { empresa: true } },
      tecnico: true,
      _count: { select: { labores: true, aplicaciones: true } },
    },
  })
  return NextResponse.json(visitas)
}

export async function POST(req: Request) {
  const data = await req.json()
  const visita = await prisma.visita.create({
    data: {
      fecha: new Date(data.fecha),
      predioId: parseInt(data.predioId),
      tecnicoId: parseInt(data.tecnicoId),
      observaciones: data.observaciones || null,
      estado: 'EN_PROGRESO',
    },
    include: {
      predio: { include: { empresa: true } },
      tecnico: true,
    },
  })
  return NextResponse.json(visita, { status: 201 })
}
