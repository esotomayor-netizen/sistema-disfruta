import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: Request) {
  const { labor, categoria, descripcion } = await req.json()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Eres un agrónomo experto. Mejora la siguiente descripción de una labor agrícola.
Devuelve SOLO el texto mejorado, sin explicaciones ni comillas.

Labor: ${labor}
Categoría: ${categoria}
Descripción actual: ${descripcion}

La descripción debe ser clara, técnica y concisa (máximo 2 oraciones). Usa terminología agronómica precisa en español.`,
      },
    ],
  })

  const texto = (message.content[0] as { type: string; text: string }).text.trim()
  return NextResponse.json({ descripcion: texto })
}
