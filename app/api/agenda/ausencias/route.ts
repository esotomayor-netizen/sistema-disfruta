export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'
import { chileDateTime } from '@/lib/tz'

// Días en que un técnico no está disponible (vacaciones, licencia, etc.), para
// que "Generar Agenda" no le agende visitas en ese rango.

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { searchParams } = new URL(req.url)
  const tecnicoId = searchParams.get('tecnicoId')
  if (!tecnicoId) {
    return NextResponse.json({ error: 'Debe indicar tecnicoId' }, { status: 400 })
  }

  const ausencias = await prisma.ausenciaTecnico.findMany({
    where: { tecnicoId: Number(tecnicoId) },
    orderBy: { fechaInicio: 'asc' },
  })
  return NextResponse.json(ausencias)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!isSupervisor(session)) {
    return NextResponse.json({ error: 'Solo supervisores pueden registrar ausencias' }, { status: 403 })
  }

  const { tecnicoId, fechaInicio, fechaFin, motivo } = await req.json().catch(() => ({}))
  if (!tecnicoId || !fechaInicio) {
    return NextResponse.json({ error: 'Debe indicar tecnicoId y fechaInicio' }, { status: 400 })
  }

  const [yIni, mIni, dIni] = fechaInicio.split('-').map(Number)
  const finStr = fechaFin || fechaInicio
  const [yFin, mFin, dFin] = finStr.split('-').map(Number)

  const inicio = chileDateTime(yIni, mIni, dIni, 0, 0)
  const fin = chileDateTime(yFin, mFin, dFin, 23, 59)
  if (fin < inicio) {
    return NextResponse.json({ error: 'La fecha de fin no puede ser anterior a la de inicio' }, { status: 400 })
  }

  const ausencia = await prisma.ausenciaTecnico.create({
    data: {
      tecnicoId: Number(tecnicoId),
      fechaInicio: inicio,
      fechaFin: fin,
      motivo: motivo || null,
    },
  })
  return NextResponse.json(ausencia, { status: 201 })
}
