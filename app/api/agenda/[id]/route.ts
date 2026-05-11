export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.agendaVisita.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
