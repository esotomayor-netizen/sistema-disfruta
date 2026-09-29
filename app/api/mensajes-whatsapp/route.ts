export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const mensajes = await prisma.mensajeWhatsApp.findMany({
    include: { empresa: true },
    orderBy: { fecha: 'desc' },
  })
  return NextResponse.json(mensajes)
}
