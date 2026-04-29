import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tecnicoId = searchParams.get('tecnicoId')
  const meses = parseInt(searchParams.get('meses') ?? '6')

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - (meses - 1), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const tecnicoFilter = tecnicoId ? { tecnicoId: parseInt(tecnicoId) } : {}

  const [agendas, visitas] = await Promise.all([
    prisma.agendaVisita.findMany({
      where: { fecha: { gte: start, lt: end }, ...tecnicoFilter },
      select: { fecha: true },
    }),
    prisma.visita.findMany({
      where: { fecha: { gte: start, lt: end }, estado: 'COMPLETADA', ...tecnicoFilter },
      select: { fecha: true },
    }),
  ])

  const months: Record<string, { mes: string; planificadas: number; realizadas: number }> = {}

  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' })
    months[key] = { mes: label, planificadas: 0, realizadas: 0 }
  }

  for (const a of agendas) {
    const key = `${a.fecha.getFullYear()}-${String(a.fecha.getMonth() + 1).padStart(2, '0')}`
    if (months[key]) months[key].planificadas++
  }

  for (const v of visitas) {
    const key = `${v.fecha.getFullYear()}-${String(v.fecha.getMonth() + 1).padStart(2, '0')}`
    if (months[key]) months[key].realizadas++
  }

  return NextResponse.json(Object.values(months))
}
