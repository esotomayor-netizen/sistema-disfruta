import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const empresa = await prisma.empresa.findUnique({
    where: { id: parseInt(params.id) },
    include: { predios: true },
  })
  return NextResponse.json(empresa)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json()
  const empresa = await prisma.empresa.update({
    where: { id: parseInt(params.id) },
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

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.empresa.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
