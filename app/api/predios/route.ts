export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, isSupervisor } from '@/lib/session'

export async function GET() {
  const predios = await prisma.predio.findMany({
    include: { empresa: true, encargado: true, tecnico: true },
    orderBy: { nombre: 'asc' },
  })
  return NextResponse.json(predios)
}

export async function POST(req: Request) {
  const data = await req.json()
  const session = await getSession()
  const predio = await prisma.predio.create({
    data: {
      nombre: data.nombre,
      csg: data.csg,
      superficie: parseFloat(data.superficie),
      cultivo: data.cultivo,
      ubicacion: data.ubicacion,
      activa: data.activa ?? true,
      empresaId: parseInt(data.empresaId),
      encargadoId: data.encargadoId ? parseInt(data.encargadoId) : null,
      tecnicoId: isSupervisor(session) && data.tecnicoId ? parseInt(data.tecnicoId) : null,
      variedades: data.variedades || null,
      latitud: data.latitud ? parseFloat(data.latitud) : null,
      longitud: data.longitud ? parseFloat(data.longitud) : null,
    },
    include: { empresa: true, encargado: true, tecnico: true },
  })
  return NextResponse.json(predio)
}
