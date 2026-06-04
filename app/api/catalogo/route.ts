export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const catalogo = await prisma.catalogoLabor.findMany({
    orderBy: [{ grupo: 'asc' }, { especie: 'asc' }, { categoria: 'asc' }, { id: 'asc' }],
  })
  return NextResponse.json(catalogo)
}
