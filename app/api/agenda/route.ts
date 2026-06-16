export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // YYYY-MM
  const fecha = searchParams.get('fecha') // YYYY-MM-DD (single day)
  const tecnicoId = searchParams.get('tecnicoId')

  let start: Date | undefined
  let end: Date | undefined
  if (fecha) {
    start = new Date(fecha)
    start.setHours(0, 0, 0, 0)
    end = new Date(fecha)
    end.setHours(23, 59, 59, 999)
  } else if (month) {
    const [y, m] = month.split('-').map(Number)
    start = new Date(y, m - 1, 1)
    end = new Date(y, m, 1)
  }

  const agendas = await prisma.agendaVisita.findMany({
    where: {
      ...(start && end ? { fecha: fecha ? { gte: start, lte: end } : { gte: start, lt: end } } : {}),
      ...(tecnicoId ? { tecnicoId: parseInt(tecnicoId) } : {}),
    },
    orderBy: { fecha: 'asc' },
    include: { predio: true, tecnico: true },
  })
  return NextResponse.json(agendas)
}

export async function POST(req: Request) {
  const data = await req.json()
  const agenda = await prisma.agendaVisita.create({
    data: {
      fecha: new Date(data.fecha + 'T12:00:00'),
      notas: data.notas || null,
      predioId: parseInt(data.predioId),
      tecnicoId: parseInt(data.tecnicoId),
    },
    include: { predio: true, tecnico: true },
  })
  return NextResponse.json(agenda, { status: 201 })
}
