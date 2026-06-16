export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nearestNeighborOrder, googleMapsRouteUrl } from '@/lib/geo'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const fecha = searchParams.get('fecha') // YYYY-MM-DD
  const tecnicoId = searchParams.get('tecnicoId')

  if (!fecha || !tecnicoId) {
    return NextResponse.json({ error: 'fecha y tecnicoId son requeridos' }, { status: 400 })
  }

  const start = new Date(fecha + 'T00:00:00')
  const end = new Date(fecha + 'T23:59:59')

  const agendas = await prisma.agendaVisita.findMany({
    where: { tecnicoId: parseInt(tecnicoId), fecha: { gte: start, lte: end } },
    include: { predio: { include: { empresa: true } } },
    orderBy: { id: 'asc' },
  })

  const conGPS = agendas.filter(a => a.predio.latitud !== null && a.predio.longitud !== null)
  const sinGPS = agendas.filter(a => a.predio.latitud === null || a.predio.longitud === null)

  const ordered = nearestNeighborOrder(
    conGPS.map(a => ({ lat: a.predio.latitud!, lng: a.predio.longitud!, agenda: a }))
  )

  const paradas = ordered.map((p, i) => ({
    orden:    i + 1,
    agendaId: p.agenda.id,
    predio:   p.agenda.predio.nombre,
    empresa:  p.agenda.predio.empresa.razonSocial,
    lat:      p.lat,
    lng:      p.lng,
  }))

  const mapsUrl = googleMapsRouteUrl(ordered.map(p => ({ lat: p.lat, lng: p.lng })))

  return NextResponse.json({
    fecha,
    totalVisitas:  agendas.length,
    prediosConGPS: ordered.length,
    prediosSinGPS: sinGPS.map(a => a.predio.nombre),
    paradas,
    mapsUrl,
  })
}
