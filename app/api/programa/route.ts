export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const programa = await prisma.programaFitosanitario.findMany({
    orderBy: [{ temporada: 'asc' }, { id: 'asc' }],
  })
  return NextResponse.json(programa)
}

export async function POST(req: Request) {
  const data = await req.json()
  const item = await prisma.programaFitosanitario.create({ data })
  return NextResponse.json(item)
}
