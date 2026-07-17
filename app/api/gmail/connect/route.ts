export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/session'
import { getGmailAuthUrl } from '@/lib/gmail'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  const url = getGmailAuthUrl((session.user as any).id)
  return NextResponse.redirect(url)
}
