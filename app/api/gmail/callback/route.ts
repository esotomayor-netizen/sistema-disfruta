export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exchangeGmailCode } from '@/lib/gmail'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // tecnicoId

  if (!code || !state) {
    return NextResponse.redirect(new URL('/oportunidades?gmailError=missing_params', req.url))
  }

  try {
    const refreshToken = await exchangeGmailCode(code)
    await prisma.usuario.update({
      where: { id: Number(state) },
      data: { gmailRefreshToken: refreshToken },
    })
    return NextResponse.redirect(new URL('/oportunidades?gmailConectado=1', req.url))
  } catch (e: any) {
    console.error('Gmail OAuth error:', e.message)
    return NextResponse.redirect(new URL(`/oportunidades?gmailError=${encodeURIComponent(e.message)}`, req.url))
  }
}
