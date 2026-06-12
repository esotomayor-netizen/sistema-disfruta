export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cultivo = searchParams.get('cultivo')
  const estadoFenologico = searchParams.get('estadoFenologico')

  const programa = await prisma.programaFitosanitario.findMany({
    where: {
      ...(cultivo ? { cultivo } : {}),
      ...(estadoFenologico ? { estadoFenologico } : {}),
    },
    orderBy: [{ temporada: 'asc' }, { id: 'asc' }],
  })
  return NextResponse.json(programa)
}

export async function POST(req: Request) {
  const data = await req.json()
  const item = await prisma.programaFitosanitario.create({ data })
  return NextResponse.json(item)
}
