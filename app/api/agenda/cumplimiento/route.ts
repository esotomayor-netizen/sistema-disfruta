export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // YYYY-MM
  const tecnicoId = searchParams.get('tecnicoId')

  const now = new Date()
  const [y, m] = month
    ? month.split('-').map(Number)
    : [now.getFullYear(), now.getMonth() + 1]

  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 1)

  const agendas = await prisma.agendaVisita.findMany({
    where: {
      fecha: { gte: start, lt: end },
      ...(tecnicoId ? { tecnicoId: parseInt(tecnicoId) } : {}),
    },
    include: { predio: true, tecnico: true },
    orderBy: [{ fecha: 'asc' }, { tecnico: { apellido: 'asc' } }],
  })

  const result = await Promise.all(
    agendas.map(async (a) => {
      const dayStart = new Date(a.fecha)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(a.fecha)
      dayEnd.setHours(23, 59, 59, 999)

      const visita = await prisma.visita.findFirst({
        where: {
          predioId: a.predioId,
          tecnicoId: a.tecnicoId,
          fecha: { gte: dayStart, lte: dayEnd },
          checkinLat: { not: null },
          aplicaciones: { some: {} },
          labores: { some: { fotos: { isEmpty: false } } },
        },
        select: { id: true },
      })

      return {
        id: a.id,
        fecha: a.fecha,
        predio: { id: a.predio.id, nombre: a.predio.nombre, cultivo: a.predio.cultivo },
        tecnico: { id: a.tecnico.id, nombre: a.tecnico.nombre, apellido: a.tecnico.apellido },
        notas: a.notas,
        cumplida: !!visita,
        visitaId: visita?.id ?? null,
      }
    })
  )

  return NextResponse.json(result)
}
