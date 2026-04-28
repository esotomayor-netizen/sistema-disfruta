import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const catalogo = await prisma.catalogoLabor.findMany({
    orderBy: [{ grupo: 'asc' }, { especie: 'asc' }, { categoria: 'asc' }, { id: 'asc' }],
  })
  return NextResponse.json(catalogo)
}
