import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rutaKm } from '@/lib/haversine'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const fecha = searchParams.get('fecha') // YYYY-MM-DD
  const tecnicoId = searchParams.get('tecnicoId')

  if (!fecha || !tecnicoId) return NextResponse.json({ kmEstimado: null, predios: 0 })

  const start = new Date(fecha + 'T00:00:00')
  const end = new Date(fecha + 'T23:59:59')

  const visitas = await prisma.visita.findMany({
    where: {
      tecnicoId: parseInt(tecnicoId),
      fecha: { gte: start, lte: end },
    },
    include: { predio: { select: { nombre: true, latitud: true, longitud: true } } },
    orderBy: { id: 'asc' },
  })

  const puntos = visitas
    .filter((v) => v.predio.latitud !== null && v.predio.longitud !== null)
    .map((v) => ({ lat: v.predio.latitud!, lon: v.predio.longitud! }))

  const kmEstimado = puntos.length >= 2 ? Math.round(rutaKm(puntos)) : null

  return NextResponse.json({
    kmEstimado,
    prediosConGPS: puntos.length,
    totalPredios: visitas.length,
    predios: visitas.map((v) => v.predio.nombre),
  })
}
