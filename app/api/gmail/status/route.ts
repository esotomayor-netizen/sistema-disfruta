export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const user = await prisma.usuario.findUnique({
    where: { id: (session.user as any).id },
    select: { gmailRefreshToken: true },
  })

  return NextResponse.json({ connected: !!user?.gmailRefreshToken })
}
