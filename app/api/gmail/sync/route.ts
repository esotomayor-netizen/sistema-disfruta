export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized } from '@/lib/session'
import { syncGmailForOportunidad } from '@/lib/gmail'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const tecnicoId = (session.user as any).id as number
  const { oportunidadId, contactEmail } = await req.json()

  if (!oportunidadId || !contactEmail) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const user = await prisma.usuario.findUnique({
    where: { id: tecnicoId },
    select: { gmailRefreshToken: true },
  })

  if (!user?.gmailRefreshToken) {
    return NextResponse.json({ error: 'Gmail no conectado' }, { status: 400 })
  }

  try {
    const created = await syncGmailForOportunidad(
      user.gmailRefreshToken,
      contactEmail,
      Number(oportunidadId),
      tecnicoId,
    )
    return NextResponse.json({ ok: true, created })
  } catch (e: any) {
    console.error('Gmail sync error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
