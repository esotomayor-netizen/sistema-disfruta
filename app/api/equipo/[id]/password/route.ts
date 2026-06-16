import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const isSupervisor = session.user.rol === 'SUPERVISOR'
  const isSelf = session.user.id === parseInt(params.id)
  if (!isSupervisor && !isSelf) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const { password } = await req.json()
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 10)
  await prisma.usuario.update({
    where: { id: parseInt(params.id) },
    data: { password: hash },
  })

  return NextResponse.json({ ok: true })
}
