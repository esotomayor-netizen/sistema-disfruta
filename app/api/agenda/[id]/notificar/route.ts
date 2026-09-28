export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized } from '@/lib/session'
import { notifyAgendaProgramada, AGENDA_WHATSAPP_SUPERVISOR_EMAIL } from '@/lib/notify'

// Reenvía manualmente el aviso de WhatsApp de una visita ya agendada — útil
// para probar la integración sin tener que crear/regenerar visitas nuevas.

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.user?.email !== AGENDA_WHATSAPP_SUPERVISOR_EMAIL) {
    return NextResponse.json({ error: `Solo ${AGENDA_WHATSAPP_SUPERVISOR_EMAIL} puede reenviar este aviso` }, { status: 403 })
  }

  const agenda = await prisma.agendaVisita.findUnique({
    where: { id: Number(params.id) },
    include: { predio: { include: { encargado: true, empresa: true } } },
  })
  if (!agenda) return NextResponse.json({ error: 'Visita no encontrada' }, { status: 404 })
  if (!agenda.predio) {
    return NextResponse.json({ error: 'La visita está agendada a una oportunidad (sin predio), no aplica el aviso' }, { status: 400 })
  }

  const contacto = agenda.predio.encargado?.telefono
    ? { nombre: `${agenda.predio.encargado.nombre} ${agenda.predio.encargado.apellido}`, telefono: agenda.predio.encargado.telefono }
    : agenda.predio.empresa?.contactoTelefono
      ? { nombre: agenda.predio.empresa.contactoNombre, telefono: agenda.predio.empresa.contactoTelefono }
      : null

  if (!contacto) {
    return NextResponse.json({ error: `El predio "${agenda.predio.nombre}" no tiene contacto con teléfono (ni encargado ni empresa)` }, { status: 400 })
  }

  await notifyAgendaProgramada(contacto, agenda.predio.nombre, agenda.fecha)
  return NextResponse.json({ ok: true, contacto: contacto.nombre, telefono: contacto.telefono })
}
