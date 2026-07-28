export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/session'
import { notifyInformeVisita } from '@/lib/notify'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { visitaId } = await req.json()
  if (!visitaId) return NextResponse.json({ error: 'visitaId requerido' }, { status: 400 })

  const userId = (session.user as any).id

  await prisma.informeGenerado.create({
    data: { visitaId: parseInt(visitaId), generadoPorId: userId },
  })

  try {
    await notifyInformeVisita(parseInt(visitaId), userId)
  } catch (e) {
    console.error('[notify] informe-visita:', e)
  }

  return NextResponse.json({ ok: true })
}
