export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'
import { parseMuestreo } from './parse'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()
  const { searchParams } = new URL(req.url)
  const predioId = searchParams.get('predioId')
  const variedad = searchParams.get('variedad')

  const muestreos = await prisma.muestreo.findMany({
    where: {
      ...(isSupervisor(session) ? {} : { tecnicoId: session.user.id }),
      ...(predioId ? { predioId: parseInt(predioId) } : {}),
      ...(variedad ? { variedad } : {}),
    },
    orderBy: { fecha: 'desc' },
    take: 300,
    // Las fotos van en base64 y pesan; el listado no las necesita.
    select: {
      id: true, fecha: true, tipo: true, variedad: true, productor: true, cuartel: true,
      tamanoMuestra: true, calibres: true, colores: true, firmeza: true, brix: true,
      defectosCalidad: true, defectosCondicion: true,
      predio: { select: { id: true, nombre: true } },
      tecnico: { select: { nombre: true, apellido: true } },
    },
  })
  return NextResponse.json(muestreos)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()
  const data = parseMuestreo(await req.json())
  if (!data.variedad) return NextResponse.json({ error: 'La variedad es obligatoria' }, { status: 400 })
  const muestreo = await prisma.muestreo.create({
    data: { ...data, tecnicoId: session.user.id },
  })
  return NextResponse.json({ id: muestreo.id }, { status: 201 })
}
