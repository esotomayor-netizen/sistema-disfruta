import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const parcelas = await prisma.parcela.findMany({ orderBy: { nombre: 'asc' } })
  return NextResponse.json(parcelas)
}

export async function POST(req: Request) {
  const data = await req.json()
  const parcela = await prisma.parcela.create({
    data: {
      nombre: data.nombre,
      superficie: parseFloat(data.superficie),
      cultivo: data.cultivo,
      ubicacion: data.ubicacion,
      activa: data.activa !== false,
    },
  })
  return NextResponse.json(parcela, { status: 201 })
}
