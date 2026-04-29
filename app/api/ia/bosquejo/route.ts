import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: Request) {
  const { labor, categoria, descripcion } = await req.json()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Genera un diagrama SVG simple y claro de la siguiente labor agrícola.
El SVG debe ser educativo y mostrar la técnica de manera esquemática.

Labor: ${labor}
Categoría: ${categoria}
Descripción: ${descripcion}

Reglas para el SVG:
- viewBox="0 0 400 300"
- Usa solo colores simples (marrón para madera, verde para follaje, rojo para cortes)
- Incluye etiquetas de texto explicativas en español
- Estilo de bosquejo/esquema técnico, no fotorrealista
- Muestra claramente qué se hace (dónde cortar, cómo dirigir, etc.)
- Máximo 40 elementos SVG para mantenerlo simple

Devuelve ÚNICAMENTE el código SVG completo, sin explicaciones, sin markdown, sin bloques de código.
Empieza directamente con <svg y termina con </svg>.`,
      },
    ],
  })

  const svgRaw = (message.content[0] as { type: string; text: string }).text.trim()
  const svgMatch = svgRaw.match(/<svg[\s\S]*<\/svg>/i)
  const svg = svgMatch ? svgMatch[0] : svgRaw

  return NextResponse.json({ svg })
}
