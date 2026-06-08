export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const empresas = await prisma.empresa.findMany({
    select: {
      id: true,
      razonSocial: true,
      contactoNombre: true,
      predios: {
        select: { id: true, nombre: true, cultivo: true, variedades: true, activa: true },
      },
    },
    orderBy: { razonSocial: 'asc' },
  })
  return NextResponse.json(empresas)
}

export async function POST(req: Request) {
  const data = await req.json()
  const empresa = await prisma.empresa.create({
    data: {
      razonSocial: data.razonSocial,
      rut: data.rut,
      contactoNombre: data.contactoNombre,
      contactoEmail: data.contactoEmail || null,
      contactoTelefono: data.contactoTelefono || null,
    },
  })
  return NextResponse.json(empresa)
}
