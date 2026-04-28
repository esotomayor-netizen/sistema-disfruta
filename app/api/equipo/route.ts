import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ROLES_TECNICOS = ['SUPERVISOR', 'TECNICO', 'APLICADOR']

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const encargados = searchParams.get('encargados') === 'true'
  const usuarios = await prisma.usuario.findMany({
    where: { rol: encargados ? 'ENCARGADO' : { in: ROLES_TECNICOS } },
    orderBy: { apellido: 'asc' },
  })
  return NextResponse.json(usuarios)
}

export async function POST(req: Request) {
  const data = await req.json()
  const usuario = await prisma.usuario.create({
    data: {
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      rol: data.rol,
      telefono: data.telefono || null,
      activo: data.activo !== false,
    },
  })
  return NextResponse.json(usuario, { status: 201 })
}
