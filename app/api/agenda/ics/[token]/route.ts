export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { construirIcs, type IcsEvento } from '@/lib/ics'

// Feed público de calendario (.ics) — sin sesión, protegido por el token
// en la URL. Así Outlook/Google Calendar/Apple Calendar pueden "suscribirse"
// y refrescarlo solos, sin que el usuario tenga que estar logueado.
const DURACION_VISITA_MIN = 90
const DIAS_ATRAS = 14
const DIAS_ADELANTE = 90

export async function GET(_: Request, { params }: { params: { token: string } }) {
  // Outlook de escritorio (clásico) exige que la URL termine en ".ics" para
  // reconocer el feed correctamente; aceptamos el token con o sin ese sufijo.
  const token = params.token.replace(/\.ics$/i, '')
  const usuario = await prisma.usuario.findUnique({ where: { icsToken: token } })
  if (!usuario) {
    return NextResponse.json({ error: 'Link no válido' }, { status: 404 })
  }

  const desde = new Date()
  desde.setDate(desde.getDate() - DIAS_ATRAS)
  const hasta = new Date()
  hasta.setDate(hasta.getDate() + DIAS_ADELANTE)

  const agendas = await prisma.agendaVisita.findMany({
    where: { tecnicoId: usuario.id, fecha: { gte: desde, lte: hasta } },
    include: {
      predio: { include: { empresa: true, cultivos: true } },
      oportunidad: true,
    },
    orderBy: { fecha: 'asc' },
  })

  const eventos: IcsEvento[] = agendas.map((a) => {
    const nombre = a.predio?.nombre ?? a.oportunidad?.nombre ?? 'Visita'
    const empresa = a.predio?.empresa.razonSocial
    const cultivos = a.predio?.cultivos.map((c) => c.cultivo).join(', ')
    const ubicacion = a.predio?.ubicacion ?? a.predio?.comuna ?? a.oportunidad?.ubicacion ?? undefined

    const descripcionPartes = [
      a.oportunidad ? 'Visita a oportunidad (prospecto)' : 'Visita técnica a predio',
      empresa ? `Empresa: ${empresa}` : null,
      cultivos ? `Cultivos: ${cultivos}` : null,
      a.notas ? `Notas: ${a.notas}` : null,
    ].filter(Boolean)

    return {
      uid: `agenda-visita-${a.id}@exportadoradisfruta.cl`,
      inicio: a.fecha,
      finMin: DURACION_VISITA_MIN,
      titulo: nombre,
      descripcion: descripcionPartes.join('\n'),
      ubicacion,
    }
  })

  const ics = construirIcs(`Agenda — ${usuario.nombre} ${usuario.apellido}`, eventos)

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="agenda-disfruta.ics"',
      'Cache-Control': 'no-cache',
    },
  })
}
