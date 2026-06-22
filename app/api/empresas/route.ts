export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, isSupervisor } from '@/lib/session'

export async function GET() {
  const empresas = await prisma.empresa.findMany({
    select: {
      id: true,
      razonSocial: true,
      contactoNombre: true,
      tecnico: { select: { id: true, nombre: true, apellido: true } },
      predios: {
        select: {
          id: true,
          nombre: true,
          activa: true,
          cultivos: { select: { cultivo: true, variedades: true } },
        },
      },
    },
    orderBy: { razonSocial: 'asc' },
  })
  return NextResponse.json(empresas)
}

export async function POST(req: Request) {
  const data = await req.json()
  const session = await getSession()
  const empresa = await prisma.empresa.create({
    data: {
      razonSocial: data.razonSocial,
      rut: data.rut,
      contactoNombre: data.contactoNombre,
      contactoEmail: data.contactoEmail || null,
      contactoTelefono: data.contactoTelefono || null,
      tecnicoId: isSupervisor(session) && data.tecnicoId ? parseInt(data.tecnicoId) : null,
    },
  })
  return NextResponse.json(empresa)
}
