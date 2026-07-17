export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized } from '@/lib/session'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const oportunidad = await prisma.oportunidad.findUnique({
    where: { id: parseInt(params.id) },
    include: { tecnico: true },
  })
  if (!oportunidad) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(oportunidad)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const data = await req.json()
  const oportunidad = await prisma.oportunidad.update({
    where: { id: parseInt(params.id) },
    data: {
      nombre: data.nombre,
      telefono: data.telefono || null,
      email: data.email || null,
      latitud: data.latitud != null ? parseFloat(data.latitud) : null,
      longitud: data.longitud != null ? parseFloat(data.longitud) : null,
      ubicacion: data.ubicacion || null,
      notas: data.notas || null,
      estado: data.estado,
    },
    include: { tecnico: true },
  })
  return NextResponse.json(oportunidad)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()

  await prisma.oportunidad.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
