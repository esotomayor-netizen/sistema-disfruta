export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tecnicoId = searchParams.get('tecnicoId')
  const fecha = searchParams.get('fecha')

  const where: Record<string, unknown> = {}
  if (tecnicoId) where.tecnicoId = parseInt(tecnicoId)
  if (fecha) {
    const start = new Date(fecha)
    start.setHours(0, 0, 0, 0)
    const end = new Date(fecha)
    end.setHours(23, 59, 59, 999)
    where.fecha = { gte: start, lte: end }
  }

  const checkins = await prisma.checkIn.findMany({
    where,
    include: { tecnico: true, predio: true, agenda: { include: { predio: true } } },
    orderBy: { fecha: 'asc' },
  })
  return NextResponse.json(checkins)
}

export async function POST(req: Request) {
  const data = await req.json()
  const checkin = await prisma.checkIn.create({
    data: {
      latitud: parseFloat(data.latitud),
      longitud: parseFloat(data.longitud),
      notas: data.notas || null,
      tecnicoId: parseInt(data.tecnicoId),
      predioId: data.predioId ? parseInt(data.predioId) : null,
      agendaId: data.agendaId ? parseInt(data.agendaId) : null,
    },
    include: { tecnico: true, predio: true, agenda: { include: { predio: true } } },
  })
  return NextResponse.json(checkin)
}
