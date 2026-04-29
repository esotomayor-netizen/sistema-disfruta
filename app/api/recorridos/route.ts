import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tecnicoId = searchParams.get('tecnicoId')
  const mes = searchParams.get('mes') // YYYY-MM

  let start: Date | undefined
  let end: Date | undefined
  if (mes) {
    const [y, m] = mes.split('-').map(Number)
    start = new Date(y, m - 1, 1)
    end = new Date(y, m, 1)
  }

  const recorridos = await prisma.recorrido.findMany({
    where: {
      ...(tecnicoId ? { tecnicoId: parseInt(tecnicoId) } : {}),
      ...(start && end ? { fecha: { gte: start, lt: end } } : {}),
    },
    orderBy: { fecha: 'desc' },
    include: { tecnico: true },
  })
  return NextResponse.json(recorridos)
}

export async function POST(req: Request) {
  const data = await req.json()
  const recorrido = await prisma.recorrido.create({
    data: {
      fecha: new Date(data.fecha),
      kmInicio: parseFloat(data.kmInicio),
      kmFin: parseFloat(data.kmFin),
      litrosCargados: data.litrosCargados ? parseFloat(data.litrosCargados) : null,
      notas: data.notas || null,
      tecnicoId: parseInt(data.tecnicoId),
    },
    include: { tecnico: true },
  })
  return NextResponse.json(recorrido, { status: 201 })
}
