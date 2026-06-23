export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const conteos = await prisma.conteo.findMany({
    where: isSupervisor(session) ? {} : { tecnicoId: session.user.id },
    include: { rama: { include: { arbol: { include: { predio: true } } } } },
  })

  const porTipo: Record<string, number> = {}
  const porPredio: Record<string, { predioId: number; nombre: string; total: number }> = {}

  for (const c of conteos) {
    porTipo[c.tipoEstructura] = (porTipo[c.tipoEstructura] ?? 0) + c.cantidad

    const predio = c.rama.arbol.predio
    if (!porPredio[predio.id]) {
      porPredio[predio.id] = { predioId: predio.id, nombre: predio.nombre, total: 0 }
    }
    porPredio[predio.id].total += c.cantidad
  }

  return NextResponse.json({
    porTipo,
    porPredio: Object.values(porPredio).sort((a, b) => b.total - a.total),
  })
}
