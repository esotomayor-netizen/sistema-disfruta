export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'
import { parseMuestreo } from '../parse'

async function cargar(id: number, session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  const m = await prisma.muestreo.findUnique({ where: { id } })
  if (!m) return null
  if (!isSupervisor(session) && m.tecnicoId !== session.user.id) return null
  return m
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()
  const m = await cargar(parseInt(params.id), session)
  if (!m) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(m)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()
  const id = parseInt(params.id)
  if (!(await cargar(id, session))) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const data = parseMuestreo(await req.json())
  if (!data.variedad) return NextResponse.json({ error: 'La variedad es obligatoria' }, { status: 400 })
  await prisma.muestreo.update({ where: { id }, data })
  return NextResponse.json({ id })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()
  const id = parseInt(params.id)
  if (!(await cargar(id, session))) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  await prisma.muestreo.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
