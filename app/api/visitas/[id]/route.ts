export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const visita = await prisma.visita.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      predio: { include: { empresa: true, encargado: true, cultivos: true } },
      tecnico: true,
      labores: { include: { responsable: true }, orderBy: { createdAt: 'asc' } },
      aplicaciones: { include: { tecnico: true }, orderBy: { createdAt: 'asc' } },
    },
  })
  if (!visita) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(visita)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json()
  const visita = await prisma.visita.update({
    where: { id: parseInt(params.id) },
    data: {
      estado: data.estado,
      observaciones: data.observaciones,
      ...(Array.isArray(data.fotos) ? { fotos: data.fotos } : {}),
    },
  })
  return NextResponse.json(visita)
}
