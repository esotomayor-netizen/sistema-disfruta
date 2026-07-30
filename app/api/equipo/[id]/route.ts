export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const usuario = await prisma.usuario.findUnique({ where: { id: parseInt(params.id) } })
  if (!usuario) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(usuario)
}

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
  try {
    await prisma.usuario.delete({ where: { id: parseInt(params.id) } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'No se puede eliminar: tiene labores, visitas u otros registros asociados. Desactívalo en su lugar.' },
      { status: 409 }
    )
  }
}
