export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized } from '@/lib/session'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()
  const oportunidadId = Number(params.id)
  const interacciones = await prisma.interaccion.findMany({
    where: { oportunidadId },
    include: { tecnico: { select: { nombre: true, apellido: true } } },
    orderBy: { fecha: 'desc' },
  })
  return NextResponse.json(interacciones)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()
  const oportunidadId = Number(params.id)
  const { tipo, fecha, resumen, resultado, proximaAccion, tecnicoId } = await req.json()
  if (!tipo || !resumen?.trim() || !tecnicoId) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }
  const interaccion = await prisma.interaccion.create({
    data: {
      tipo,
      fecha: fecha ? new Date(fecha) : new Date(),
      resumen: resumen.trim(),
      resultado: resultado?.trim() || null,
      proximaAccion: proximaAccion?.trim() || null,
      oportunidadId,
      tecnicoId: Number(tecnicoId),
    },
    include: { tecnico: { select: { nombre: true, apellido: true } } },
  })
  return NextResponse.json(interaccion, { status: 201 })
}
