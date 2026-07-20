export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized } from '@/lib/session'
import { notifyNuevaOportunidad } from '@/lib/notify'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const oportunidades = await prisma.oportunidad.findMany({
    orderBy: { createdAt: 'desc' },
    include: { tecnico: true },
  })
  return NextResponse.json(oportunidades)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const data = await req.json()
  const oportunidad = await prisma.oportunidad.create({
    data: {
      nombre: data.nombre,
      telefono: data.telefono || null,
      email: data.email || null,
      latitud: data.latitud != null ? parseFloat(data.latitud) : null,
      longitud: data.longitud != null ? parseFloat(data.longitud) : null,
      ubicacion: data.ubicacion || null,
      notas: data.notas || null,
      estado: data.estado || 'NUEVO',
      tecnicoId: parseInt(data.tecnicoId),
    },
    include: { tecnico: true },
  })
  // Fire-and-forget: don't block the response
  notifyNuevaOportunidad(oportunidad).catch((e) => console.error('[notify] nueva oportunidad:', e))

  return NextResponse.json(oportunidad, { status: 201 })
}
