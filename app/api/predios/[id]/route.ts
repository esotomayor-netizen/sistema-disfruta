export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, isSupervisor } from '@/lib/session'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const predio = await prisma.predio.findUnique({
    where: { id: parseInt(params.id) },
    include: { empresa: true, encargado: true, tecnico: true, cultivos: true },
  })
  if (!predio) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(predio)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json()
  const session = await getSession()
  const predioId = parseInt(params.id)
  const predio = await prisma.$transaction(async (tx) => {
    await tx.predioCultivo.deleteMany({ where: { predioId } })
    return tx.predio.update({
      where: { id: predioId },
      data: {
        nombre: data.nombre,
        csg: data.csg,
        superficie: parseFloat(data.superficie),
        ubicacion: data.ubicacion,
        activa: data.activa,
        empresaId: parseInt(data.empresaId),
        encargadoId: data.encargadoId ? parseInt(data.encargadoId) : null,
        ...(isSupervisor(session) ? { tecnicoId: data.tecnicoId ? parseInt(data.tecnicoId) : null } : {}),
        latitud: data.latitud ? parseFloat(data.latitud) : null,
        longitud: data.longitud ? parseFloat(data.longitud) : null,
        cultivos: {
          create: (data.cultivos || []).map((c: { cultivo: string; variedades?: string }) => ({
            cultivo: c.cultivo,
            variedades: c.variedades || null,
          })),
        },
      },
      include: { empresa: true, encargado: true, tecnico: true, cultivos: true },
    })
  })
  return NextResponse.json(predio)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.predio.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
