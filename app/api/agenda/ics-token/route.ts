export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized } from '@/lib/session'

// GET: devuelve el token de suscripción del usuario logueado, generándolo la
// primera vez. POST: lo regenera (invalida el link anterior, por si se filtró).

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const usuario = await prisma.usuario.findUnique({ where: { id: session.user.id } })
  if (!usuario) return unauthorized()

  let token = usuario.icsToken
  if (!token) {
    token = randomBytes(24).toString('hex')
    await prisma.usuario.update({ where: { id: usuario.id }, data: { icsToken: token } })
  }

  return NextResponse.json({ token })
}

export async function POST() {
  const session = await getSession()
  if (!session) return unauthorized()

  const token = randomBytes(24).toString('hex')
  await prisma.usuario.update({ where: { id: session.user.id }, data: { icsToken: token } })

  return NextResponse.json({ token })
}
