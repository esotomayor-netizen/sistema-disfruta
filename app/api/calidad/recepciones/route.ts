import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productor = searchParams.get('productor')
  const variedad = searchParams.get('variedad')
  const decision = searchParams.get('decision')
  const fechaDesde = searchParams.get('fechaDesde')
  const fechaHasta = searchParams.get('fechaHasta')

  const where: Record<string, unknown> = {}
  if (productor) where.productor = productor
  if (variedad) where.variedad = variedad
  if (decision) where.decisionFinal = decision
  if (fechaDesde || fechaHasta) {
    where.fechaMuestra = {
      ...(fechaDesde ? { gte: new Date(fechaDesde) } : {}),
      ...(fechaHasta ? { lte: new Date(fechaHasta) } : {}),
    }
  }

  const data = await prisma.recepcionCalidad.findMany({
    where,
    orderBy: { fechaMuestra: 'desc' },
  })

  return NextResponse.json(data)
}
