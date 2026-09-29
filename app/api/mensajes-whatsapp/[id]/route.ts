export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized } from '@/lib/session'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { leido } = await req.json().catch(() => ({ leido: true }))
  const mensaje = await prisma.mensajeWhatsApp.update({
    where: { id: Number(params.id) },
    data: { leido: leido !== false },
  })
  return NextResponse.json(mensaje)
}
