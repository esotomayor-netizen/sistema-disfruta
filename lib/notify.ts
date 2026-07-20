import { Resend } from 'resend'
import { prisma } from './prisma'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.NOTIFY_FROM_EMAIL ?? 'Sistema Disfruta <onboarding@resend.dev>'
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN
const WA_PHONE_ID = process.env.META_PHONE_NUMBER_ID

// ─── Canales ──────────────────────────────────────────────────────────────────

function normalizeChileanPhone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.startsWith('56') && d.length >= 10) return d
  if (d.startsWith('9') && d.length === 9) return '56' + d
  if (d.startsWith('0') && d.length === 10) return '56' + d.slice(1)
  return '56' + d
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!resend) return
  try {
    await resend.emails.send({ from: FROM, to: [to], subject, html })
  } catch (err) {
    console.error('[notify:email]', err)
  }
}

async function sendWhatsApp(phone: string, template: string, params: string[]): Promise<void> {
  if (!WA_TOKEN || !WA_PHONE_ID || !phone.trim()) return
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizeChileanPhone(phone),
        type: 'template',
        template: {
          name: template,
          language: { code: 'es' },
          components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }],
        },
      }),
    })
    if (!res.ok) console.error('[notify:whatsapp]', await res.text())
  } catch (err) {
    console.error('[notify:whatsapp]', err)
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Usuario = { id: number; nombre: string; apellido: string; email: string; telefono: string | null }

function fullName(u: Usuario) { return `${u.nombre} ${u.apellido}` }

async function getSupervisores(): Promise<Usuario[]> {
  return prisma.usuario.findMany({ where: { rol: 'SUPERVISOR', activo: true } })
}

async function notifyAll(
  destinatarios: Usuario[],
  subject: string,
  html: string,
  waTemplate: string,
  waParamsFn: (saludo: string) => string[]
): Promise<void> {
  await Promise.all(
    destinatarios.map(async (u) => {
      const saludo = fullName(u)
      await sendEmail(u.email, subject, html.replace('{{SALUDO}}', saludo))
      if (u.telefono) await sendWhatsApp(u.telefono, waTemplate, waParamsFn(saludo))
    })
  )
}

// ─── Nueva oportunidad ────────────────────────────────────────────────────────
// Templates WhatsApp requeridos en Meta Business Manager:
//   Nombre: nueva_oportunidad | Idioma: es | Categoría: UTILITY
//   Body: "Hola {{1}}, se registró una nueva oportunidad: {{2}}. Técnico: {{3}}."

export async function notifyNuevaOportunidad(oportunidad: {
  id: number
  nombre: string
  tecnico: Usuario
}): Promise<void> {
  const supervisores = await getSupervisores()
  const tec = oportunidad.tecnico
  const nombreTec = fullName(tec)

  const destinatarios: Usuario[] = [tec, ...supervisores.filter((s) => s.id !== tec.id)]

  const html = `
    <div style="font-family:sans-serif;max-width:480px">
      <h2 style="color:#2563eb;margin-bottom:4px">Nueva Oportunidad Registrada</h2>
      <p>Hola <strong>{{SALUDO}}</strong>,</p>
      <p>Se registró una nueva oportunidad en el sistema:</p>
      <table style="border-collapse:collapse;margin:12px 0;width:100%">
        <tr><td style="padding:6px 16px 6px 0;color:#6b7280;white-space:nowrap">Contacto</td><td><strong>${oportunidad.nombre}</strong></td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#6b7280;white-space:nowrap">Técnico asignado</td><td>${nombreTec}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#6b7280;white-space:nowrap">Estado</td><td>Nuevo</td></tr>
      </table>
      <p style="color:#6b7280;font-size:14px">Ingresa al sistema para registrar el primer contacto.</p>
    </div>`

  await notifyAll(
    destinatarios,
    `Nueva oportunidad: ${oportunidad.nombre}`,
    html,
    'nueva_oportunidad',
    (saludo) => [saludo, oportunidad.nombre, nombreTec]
  )
}

// ─── Recordatorios de contacto (cron diario) ─────────────────────────────────
// Templates WhatsApp requeridos:
//   Nombre: recordatorio_tecnico | Idioma: es | Categoría: UTILITY
//   Body: "Hola {{1}}, tienes {{2}} oportunidad(es) sin contacto hace más de 3 días. Revisa el sistema."
//
//   Nombre: recordatorio_supervisor | Idioma: es | Categoría: UTILITY
//   Body: "Hola {{1}}, hay {{2}} oportunidad(es) sin contacto reciente en el equipo. Revisa el sistema."

export async function procesarRecordatorios(): Promise<number> {
  const hace3dias = new Date()
  hace3dias.setDate(hace3dias.getDate() - 3)

  const pendientes = await prisma.oportunidad.findMany({
    where: {
      estado: { not: 'CERRADO' },
      OR: [
        { interacciones: { none: {} } },
        { interacciones: { none: { fecha: { gte: hace3dias } } } },
      ],
    },
    include: { tecnico: true, interacciones: { orderBy: { fecha: 'desc' }, take: 1 } },
  })

  if (pendientes.length === 0) return 0

  // Group by technician
  const porTecnico = new Map<number, typeof pendientes>()
  for (const op of pendientes) {
    const list = porTecnico.get(op.tecnicoId) ?? []
    list.push(op)
    porTecnico.set(op.tecnicoId, list)
  }

  const supervisores = await getSupervisores()

  // Notify each technician individually
  for (const [, ops] of porTecnico) {
    const tec = ops[0].tecnico
    const saludo = fullName(tec)
    const cantidad = ops.length
    const listaHtml = ops.map((o) => `<li>${o.nombre}</li>`).join('')

    const html = `
      <div style="font-family:sans-serif;max-width:480px">
        <h2 style="color:#d97706;margin-bottom:4px">Recordatorio de Contacto</h2>
        <p>Hola <strong>${saludo}</strong>,</p>
        <p>Tienes <strong>${cantidad} oportunidad(es)</strong> sin contacto en los últimos 3 días:</p>
        <ul style="line-height:1.8">${listaHtml}</ul>
        <p style="color:#6b7280;font-size:14px">Ingresa al sistema para registrar el contacto o actualizar el estado.</p>
      </div>`

    await sendEmail(tec.email, `Recordatorio: ${cantidad} contacto(s) pendiente(s)`, html)
    if (tec.telefono) await sendWhatsApp(tec.telefono, 'recordatorio_tecnico', [saludo, String(cantidad)])
  }

  // Notify supervisors with consolidated summary
  if (supervisores.length > 0) {
    const resumenHtml = Array.from(porTecnico.values())
      .map((ops) => {
        const tec = ops[0].tecnico
        return `<li><strong>${fullName(tec)}</strong>: ${ops.map((o) => o.nombre).join(', ')}</li>`
      })
      .join('')

    const html = `
      <div style="font-family:sans-serif;max-width:480px">
        <h2 style="color:#d97706;margin-bottom:4px">Resumen Oportunidades Pendientes</h2>
        <p>Hola <strong>{{SALUDO}}</strong>,</p>
        <p>Hay <strong>${pendientes.length}</strong> oportunidad(es) sin contacto en los últimos 3 días:</p>
        <ul style="line-height:1.8">${resumenHtml}</ul>
      </div>`

    await notifyAll(
      supervisores,
      `Resumen: ${pendientes.length} oportunidad(es) sin contacto`,
      html,
      'recordatorio_supervisor',
      (saludo) => [saludo, String(pendientes.length)]
    )
  }

  return pendientes.length
}
