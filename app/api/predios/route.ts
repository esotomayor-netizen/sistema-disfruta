import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const predios = await prisma.predio.findMany({ orderBy: { nombre: 'asc' } })
  return NextResponse.json(predios)
}

export async function POST(req: Request) {
  const data = await req.json()
  const predio = await prisma.predio.create({
    data: {
      nombre: data.nombre,
      superficie: parseFloat(data.superficie),
      cultivo: data.cultivo,
      ubicacion: data.ubicacion,
      activa: data.activa !== false,
    },
  })
  return NextResponse.json(predio, { status: 201 })
}
