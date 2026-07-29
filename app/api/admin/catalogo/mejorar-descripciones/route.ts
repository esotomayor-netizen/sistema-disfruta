export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'
import { prisma } from '@/lib/prisma'

const client = new Anthropic()

async function generarDescripcion(item: {
  labor: string
  categoria: string
  especie: string
  grupo: string
  prioridad: string
  mesesEjecucion: string
  descripcion: string
}): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `Eres un ingeniero agrónomo experto en fruticultura. Redacta una descripción técnica extensa (4 a 6 oraciones) para la siguiente labor agrícola del catálogo de un sistema de gestión de campo.

Labor: ${item.labor}
Categoría: ${item.categoria}
Grupo: ${item.grupo}
Especie: ${item.especie}
Prioridad: ${item.prioridad}
Meses de ejecución habitual: ${item.mesesEjecucion}
Descripción actual (breve): ${item.descripcion}

La nueva descripción debe:
- Explicar en qué consiste la labor de forma clara y técnica.
- Explicar POR QUÉ debe realizarse (el problema agronómico o fisiológico que aborda).
- Explicar los BENEFICIOS concretos que trae para el cultivo, la productividad o la calidad de la fruta.
- Usar terminología agronómica precisa en español, en tono profesional pero fácil de entender para un técnico de campo.
- No usar viñetas ni títulos, solo un párrafo corrido.

Devuelve SOLO el párrafo de descripción, sin comillas ni explicaciones adicionales.`,
      },
    ],
  })

  return (message.content[0] as { type: string; text: string }).text.trim()
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!isSupervisor(session)) return unauthorized()

  const { offset = 0, limit = 5 } = await req.json().catch(() => ({}))

  const total = await prisma.catalogoLabor.count()
  const items = await prisma.catalogoLabor.findMany({
    orderBy: { id: 'asc' },
    skip: offset,
    take: limit,
  })

  const resultados = await Promise.all(
    items.map(async (item) => {
      try {
        const nuevaDescripcion = await generarDescripcion(item)
        await prisma.catalogoLabor.update({
          where: { id: item.id },
          data: { descripcion: nuevaDescripcion },
        })
        return true
      } catch (e) {
        console.error('[mejorar-descripciones]', item.id, e)
        return false
      }
    })
  )

  const updated = resultados.filter(Boolean).length
  const nextOffset = offset + limit < total ? offset + limit : null

  return NextResponse.json({ updated, processed: items.length, total, nextOffset })
}
