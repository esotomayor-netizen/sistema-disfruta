export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json()
  const usuario = await prisma.usuario.update({
    where: { id: parseInt(params.id) },
    data: {
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      rol: data.rol,
      telefono: data.telefono || null,
      activo: data.activo,
    },
  })
  return NextResponse.json(usuario)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.usuario.update({
    where: { id: parseInt(params.id) },
    data: { activo: false },
  })
  return NextResponse.json({ ok: true })
}
