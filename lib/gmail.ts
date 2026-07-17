import { google } from 'googleapis'
import { prisma } from './prisma'

function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/gmail/callback`,
  )
}

export function getGmailAuthUrl(tecnicoId: number): string {
  const client = oauthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    state: String(tecnicoId),
  })
}

export async function exchangeGmailCode(code: string): Promise<string> {
  const client = oauthClient()
  const { tokens } = await client.getToken(code)
  if (!tokens.refresh_token) throw new Error('No refresh_token received — revoke app access in Google and try again')
  return tokens.refresh_token
}

export async function syncGmailForOportunidad(
  refreshToken: string,
  contactEmail: string,
  oportunidadId: number,
  tecnicoId: number,
): Promise<number> {
  const client = oauthClient()
  client.setCredentials({ refresh_token: refreshToken })
  const gmail = google.gmail({ version: 'v1', auth: client })

  // Search sent mail to this contact
  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: `to:${contactEmail} in:sent`,
    maxResults: 100,
  })

  const messages = listRes.data.messages ?? []
  let created = 0

  for (const msg of messages) {
    if (!msg.id) continue

    // Skip if already imported
    const exists = await prisma.interaccion.findUnique({ where: { gmailMessageId: msg.id } })
    if (exists) continue

    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'metadata',
      metadataHeaders: ['Subject', 'To', 'Date'],
    })

    const headers = detail.data.payload?.headers ?? []
    const subject = headers.find((h) => h.name === 'Subject')?.value ?? '(sin asunto)'
    const to = headers.find((h) => h.name === 'To')?.value ?? contactEmail
    const dateStr = headers.find((h) => h.name === 'Date')?.value
    const fecha = dateStr ? new Date(dateStr) : new Date()
    const snippet = detail.data.snippet ?? ''

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
