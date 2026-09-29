export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyMensajeWhatsApp } from '@/lib/notify'

// Webhook público de Meta (sin sesión) que recibe los mensajes que los
// contactos responden al número de WhatsApp Business de la plataforma.
// Como ese número es distinto al celular personal del técnico, las
// respuestas no le llegan directo — quedan guardadas acá para verlas en
// /mensajes, y se avisa por email.
const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN

// Últimos 8 dígitos alcanzan para distinguir un celular chileno sin
// depender de si el número viene con/sin +56, espacios, guiones, etc.
function last8Digits(raw: string): string {
  return raw.replace(/\D/g, '').slice(-8)
}

// Verificación del webhook que hace Meta al configurarlo en el App Dashboard.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && VERIFY_TOKEN && token === VERIFY_TOKEN) {
    return new NextResponse(challenge ?? '', { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: true })

  try {
    const empresas = await prisma.empresa.findMany({
      where: { contactoTelefono: { not: null } },
      select: { id: true, razonSocial: true, contactoTelefono: true },
    })

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value
        const mensajes = value?.messages
        if (!mensajes) continue // status updates (entregado/leído), no interesan acá

        const nombrePorWaId = new Map<string, string>(
          (value.contacts ?? []).map((c: any) => [c.wa_id, c.profile?.name ?? ''])
        )

        for (const msg of mensajes) {
          const telefono = String(msg.from).replace(/\D/g, '')
          const sufijo = last8Digits(telefono)
          const empresaMatch = empresas.find((e) => e.contactoTelefono && last8Digits(e.contactoTelefono) === sufijo)

          const data = {
            telefono,
            nombreContacto: nombrePorWaId.get(msg.from) || null,
            texto: msg.text?.body ?? `[mensaje tipo ${msg.type}]`,
            waMessageId: msg.id as string,
            empresaId: empresaMatch?.id ?? null,
            fecha: new Date(Number(msg.timestamp) * 1000),
          }

          try {
            const creado = await prisma.mensajeWhatsApp.create({ data })
            await notifyMensajeWhatsApp(creado, empresaMatch?.razonSocial ?? null)
          } catch (e) {
            // waMessageId duplicado: Meta reintenta la entrega del webhook, se ignora.
          }
        }
      }
    }
  } catch (e) {
    console.error('[whatsapp-webhook]', e)
  }

  // Meta espera 200 rápido, incluso si algo interno falló, para no reintentar en bucle.
  return NextResponse.json({ ok: true })
}
