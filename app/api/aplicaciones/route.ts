import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado')
  const tipoProducto = searchParams.get('tipoProducto')
  const parcelaId = searchParams.get('parcelaId')

  const aplicaciones = await prisma.aplicacion.findMany({
    where: {
      ...(estado ? { estado } : {}),
      ...(tipoProducto ? { tipoProducto } : {}),
      ...(parcelaId ? { parcelaId: parseInt(parcelaId) } : {}),
    },
    orderBy: { fecha: 'desc' },
    include: { parcela: true, tecnico: true },
  })
  return NextResponse.json(aplicaciones)
}

export async function POST(req: Request) {
  const data = await req.json()
  const aplicacion = await prisma.aplicacion.create({
    data: {
      producto: data.producto,
      tipoProducto: data.tipoProducto,
      dosis: parseFloat(data.dosis),
      unidad: data.unidad,
      fecha: new Date(data.fecha),
      estado: data.estado || 'PENDIENTE',
      observaciones: data.observaciones || null,
      parcelaId: parseInt(data.parcelaId),
      tecnicoId: parseInt(data.tecnicoId),
    },
    include: { parcela: true, tecnico: true },
  })
  return NextResponse.json(aplicacion, { status: 201 })
}
