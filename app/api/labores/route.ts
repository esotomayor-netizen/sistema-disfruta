export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado')
  const predioId = searchParams.get('predioId')

  const labores = await prisma.labor.findMany({
    where: {
      ...(isSupervisor(session) ? {} : { responsableId: session.user.id }),
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
      dibujo: data.dibujo || null,
      fotos: Array.isArray(data.fotos) ? data.fotos : [],
      predioId: parseInt(data.predioId),
      responsableId: parseInt(data.responsableId),
      visitaId: data.visitaId ? parseInt(data.visitaId) : null,
    },
    include: { predio: true, responsable: true },
  })
  return NextResponse.json(labor, { status: 201 })
}
