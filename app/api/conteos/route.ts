export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { searchParams } = new URL(req.url)
  const predioId = searchParams.get('predioId')
  const ramaId = searchParams.get('ramaId')
  const tipoEstructura = searchParams.get('tipoEstructura')

  const conteos = await prisma.conteo.findMany({
    where: {
      ...(isSupervisor(session) ? {} : { tecnicoId: session.user.id }),
      ...(ramaId ? { ramaId: parseInt(ramaId) } : {}),
      ...(tipoEstructura ? { tipoEstructura: tipoEstructura as any } : {}),
      ...(predioId ? { rama: { arbol: { predioId: parseInt(predioId) } } } : {}),
    },
    orderBy: { fecha: 'desc' },
    take: 200,
    include: {
      rama: { include: { arbol: { include: { predio: true } } } },
      tecnico: true,
      visita: true,
    },
  })
  return NextResponse.json(conteos)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const data = await req.json()

  const arbol = await prisma.arbol.upsert({
    where: { predioId_codigo: { predioId: parseInt(data.predioId), codigo: data.arbolCodigo } },
    update: {},
    create: {
      predioId: parseInt(data.predioId),
      codigo: data.arbolCodigo,
      variedad: data.variedad || null,
    },
  })

  const rama = await prisma.rama.upsert({
    where: { arbolId_codigo: { arbolId: arbol.id, codigo: data.ramaCodigo } },
    update: {},
    create: {
      arbolId: arbol.id,
      codigo: data.ramaCodigo,
      longitudCm: data.longitudCm ? parseFloat(data.longitudCm) : null,
    },
  })

  const conteo = await prisma.conteo.create({
    data: {
      ramaId: rama.id,
      tipoEstructura: data.tipoEstructura,
      cantidad: parseInt(data.cantidad),
      fecha: data.fecha ? new Date(data.fecha) : new Date(),
      notas: data.notas || null,
      visitaId: data.visitaId ? parseInt(data.visitaId) : null,
      tecnicoId: session.user.id,
    },
    include: {
      rama: { include: { arbol: { include: { predio: true } } } },
      tecnico: true,
      visita: true,
    },
  })
  return NextResponse.json(conteo, { status: 201 })
}
