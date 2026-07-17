import { prisma } from './prisma'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1'

function redirectUri() {
  return `${process.env.NEXTAUTH_URL}/api/gmail/callback`
}

export function getGmailAuthUrl(tecnicoId: number): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state: String(tecnicoId),
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function exchangeGmailCode(code: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: 'authorization_code',
    }),
  })
  const data = await res.json()
  if (!data.refresh_token) throw new Error('No refresh_token received — revoke app access in Google and try again')
  return data.refresh_token
}

async function getAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Failed to get access token: ' + JSON.stringify(data))
  return data.access_token
}

export async function syncGmailForOportunidad(
  refreshToken: string,
  contactEmail: string,
  oportunidadId: number,
  tecnicoId: number,
): Promise<number> {
  const accessToken = await getAccessToken(refreshToken)

  const listUrl = new URL(`${GMAIL_API_BASE}/users/me/messages`)
  listUrl.searchParams.set('q', `to:${contactEmail} in:sent`)
  listUrl.searchParams.set('maxResults', '100')

  const listRes = await fetch(listUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const listData = await listRes.json()
  const messages: { id: string }[] = listData.messages ?? []
  let created = 0

  for (const msg of messages) {
    if (!msg.id) continue

    const exists = await prisma.interaccion.findUnique({ where: { gmailMessageId: msg.id } })
    if (exists) continue

    const detailRes = await fetch(
      `${GMAIL_API_BASE}/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=To&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    const detail = await detailRes.json()

    const headers: { name: string; value: string }[] = detail.payload?.headers ?? []
    const subject = headers.find((h) => h.name === 'Subject')?.value ?? '(sin asunto)'
    const to = headers.find((h) => h.name === 'To')?.value ?? contactEmail
    const dateStr = headers.find((h) => h.name === 'Date')?.value
    const fecha = dateStr ? new Date(dateStr) : new Date()
    const snippet: string = detail.snippet ?? ''

    await prisma.interaccion.create({
      data: {
        tipo: 'EMAIL',
        fecha,
        resumen: `Para: ${to}\nAsunto: ${subject}\n\n${snippet}`,
        oportunidadId,
        tecnicoId,
        gmailMessageId: msg.id,
      },
    })
    created++
  }

  return created
}
