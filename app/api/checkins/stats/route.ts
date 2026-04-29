import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rutaKm } from '@/lib/haversine'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tecnicoId = searchParams.get('tecnicoId')
  const meses = 6

  const desde = new Date()
  desde.setMonth(desde.getMonth() - meses + 1)
  desde.setDate(1)
  desde.setHours(0, 0, 0, 0)

  const where: Record<string, unknown> = { fecha: { gte: desde } }
  if (tecnicoId) where.tecnicoId = parseInt(tecnicoId)

  const checkins = await prisma.checkIn.findMany({
    where,
    orderBy: { fecha: 'asc' },
  })

  // Group by month
  const byMonth: Record<string, { count: number; puntos: { lat: number; lon: number }[] }> = {}
  for (const c of checkins) {
    const key = `${c.fecha.getFullYear()}-${String(c.fecha.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[key]) byMonth[key] = { count: 0, puntos: [] }
    byMonth[key].count++
    byMonth[key].puntos.push({ lat: c.latitud, lon: c.longitud })
  }

  // Group agenda by month for planned count
  const agendaWhere: Record<string, unknown> = { fecha: { gte: desde } }
  if (tecnicoId) agendaWhere.tecnicoId = parseInt(tecnicoId)
  const agendas = await prisma.agendaVisita.findMany({ where: agendaWhere })

  const agendaByMonth: Record<string, number> = {}
  for (const a of agendas) {
    const key = `${a.fecha.getFullYear()}-${String(a.fecha.getMonth() + 1).padStart(2, '0')}`
    agendaByMonth[key] = (agendaByMonth[key] || 0) + 1
  }

  // Build result
  const result = []
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const mes = d.toLocaleString('es-CL', { month: 'short', year: '2-digit' })
    const data = byMonth[key]
    result.push({
      mes,
      key,
      checkins: data?.count ?? 0,
      planificadas: agendaByMonth[key] ?? 0,
      kmGPS: data ? Math.round(rutaKm(data.puntos) * 10) / 10 : 0,
    })
  }

  return NextResponse.json(result)
}
