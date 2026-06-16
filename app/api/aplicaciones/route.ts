export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado')
  const tipoProducto = searchParams.get('tipoProducto')
  const predioId = searchParams.get('predioId')

  const aplicaciones = await prisma.aplicacion.findMany({
    where: {
      ...(isSupervisor(session) ? {} : { tecnicoId: session.user.id }),
      ...(estado ? { estado } : {}),
      ...(tipoProducto ? { tipoProducto } : {}),
      ...(predioId ? { predioId: parseInt(predioId) } : {}),
    },
    orderBy: { fecha: 'desc' },
    include: { predio: true, tecnico: true },
  })
  return NextResponse.json(aplicaciones)
}

export async function POST(req: Request) {
  const data = await req.json()

  // Bulk creation: array of productos in a single application session
  if (Array.isArray(data.productos) && data.productos.length > 0) {
    const base = {
      fecha: new Date(data.fecha),
      estado: data.estado || 'PENDIENTE',
      observaciones: data.observaciones || null,
      predioId: parseInt(data.predioId),
      tecnicoId: parseInt(data.tecnicoId),
      visitaId: data.visitaId ? parseInt(data.visitaId) : null,
    }
    const aplicaciones = await prisma.$transaction(
      data.productos.map((p: { producto: string; tipoProducto: string; dosis: string; unidad: string }) =>
        prisma.aplicacion.create({
          data: {
            ...base,
            producto: p.producto,
            tipoProducto: p.tipoProducto,
            dosis: parseFloat(p.dosis) || 0,
            unidad: p.unidad,
          },
          include: { predio: true, tecnico: true },
        })
      )
    )
    return NextResponse.json(aplicaciones, { status: 201 })
  }

  // Single product (backward compatible)
  const aplicacion = await prisma.aplicacion.create({
    data: {
      producto: data.producto,
      tipoProducto: data.tipoProducto,
      dosis: parseFloat(data.dosis),
      unidad: data.unidad,
      fecha: new Date(data.fecha),
      estado: data.estado || 'PENDIENTE',
      observaciones: data.observaciones || null,
      predioId: parseInt(data.predioId),
      tecnicoId: parseInt(data.tecnicoId),
      visitaId: data.visitaId ? parseInt(data.visitaId) : null,
    },
    include: { predio: true, tecnico: true },
  })
  return NextResponse.json(aplicacion, { status: 201 })
}
