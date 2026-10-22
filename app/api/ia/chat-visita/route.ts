export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { LABOR_TIPOS, TIPOS_PRODUCTO, UNIDADES } from '@/lib/constants'

const client = new Anthropic()

interface MensajeEntrada {
  role: 'user' | 'assistant'
  texto: string
  fotos?: string[] // solo se reenvían las del último mensaje del usuario
}

interface Borrador {
  observaciones: string
  labores: { tipo: string; descripcion: string; observaciones: string }[]
  aplicaciones: { producto: string; tipoProducto: string; dosis: string; unidad: string; observaciones: string }[]
}

// Convierte un data URL (data:image/jpeg;base64,xxxx) en los campos que
// espera el bloque "image" de la API de Claude.
function parseDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) return null
  return { mediaType: match[1], data: match[2] }
}

const BORRADOR_VACIO: Borrador = { observaciones: '', labores: [], aplicaciones: [] }

export async function POST(req: Request) {
  const { especie, predioNombre, mensajes, borradorActual } = (await req.json()) as {
    especie: string
    predioNombre: string
    mensajes: MensajeEntrada[]
    borradorActual: Borrador
  }

  if (!Array.isArray(mensajes) || mensajes.length === 0) {
    return NextResponse.json({ error: 'Faltan mensajes' }, { status: 400 })
  }

  const systemPrompt = `Eres el asistente de registro de visitas técnicas de un sistema para predios agrícolas (Exportadora Disfruta). Conversas en español, en tono natural y breve, con un técnico de campo que te cuenta — por texto y a veces con fotos — qué hizo durante una visita a un predio.

Predio: ${predioNombre}. Especie/cultivo de la visita: ${especie || 'no especificada'}.

Tu trabajo en cada turno:
1. Entender lo que el técnico fue contando en toda la conversación (no solo el último mensaje).
2. Mantener y actualizar un "borrador" acumulado con la información estructurada que se pueda extraer: labores realizadas y aplicaciones fitosanitarias realizadas, más un resumen de observaciones generales. El borrador de cada turno reemplaza por completo al anterior — siempre devuelve la versión más actualizada y completa con todo lo mencionado hasta ahora, no solo lo nuevo.
3. Responder de forma conversacional: si falta un dato importante para una aplicación (tipo de producto, dosis, unidad) pregúntalo de forma breve y natural, una o dos preguntas a la vez, no interrogues en bloque. Si ya tienes lo esencial, puedes simplemente confirmar lo que entendiste y preguntar si hay algo más que agregar.
4. Si el técnico adjunta fotos, agradécelas brevemente y, si el texto que las acompaña lo permite, usa lo que se ve en la foto para enriquecer la descripción de la labor correspondiente (ej. "se ve clorosis en hojas", "fruta con buen cuajado"), pero no inventes detalles que no se vean con claridad.

Reglas para el borrador:
- "tipo" de cada labor debe ser EXACTAMENTE uno de estos valores: ${LABOR_TIPOS.map((t) => t.value).join(', ')}.
- "tipoProducto" de cada aplicación debe ser EXACTAMENTE uno de estos valores: ${TIPOS_PRODUCTO.map((t) => t.value).join(', ')}.
- "unidad" de cada aplicación debe ser preferentemente uno de: ${UNIDADES.join(', ')} (si el técnico da otra unidad, usa la más parecida o la que él mencionó tal cual).
- Si no tienes la dosis exacta de una aplicación, dosis puede quedar vacía ("") — no inventes un número.
- No dupliques labores o aplicaciones ya registradas en el borrador salvo que el técnico aclare que son distintas.
- "observaciones" del borrador es un resumen breve (2-4 oraciones) de la visita en general, en lenguaje técnico agronómico, no una transcripción literal del chat.

Responde SIEMPRE con un único objeto JSON, sin texto antes ni después, sin bloques de código markdown, con esta forma exacta:
{"respuesta": "tu mensaje conversacional para el técnico", "borrador": {"observaciones": "...", "labores": [{"tipo": "...", "descripcion": "...", "observaciones": "..."}], "aplicaciones": [{"producto": "...", "tipoProducto": "...", "dosis": "...", "unidad": "...", "observaciones": "..."}]}}`

  const anthropicMessages: Anthropic.MessageParam[] = mensajes.map((m, idx) => {
    const esUltimo = idx === mensajes.length - 1
    const content: Anthropic.ContentBlockParam[] = []
    if (m.texto) content.push({ type: 'text', text: m.texto })
    if (esUltimo && m.role === 'user' && m.fotos && m.fotos.length > 0) {
      for (const foto of m.fotos) {
        const parsed = parseDataUrl(foto)
        if (parsed) {
          content.push({
            type: 'image',
            source: { type: 'base64', media_type: parsed.mediaType as any, data: parsed.data },
          })
        }
      }
    } else if (!esUltimo && m.fotos && m.fotos.length > 0) {
      content.push({ type: 'text', text: `[Adjuntó ${m.fotos.length} foto(s) en este mensaje]` })
    }
    if (content.length === 0) content.push({ type: 'text', text: '(mensaje vacío)' })
    return { role: m.role, content }
  })

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 2000,
      system: systemPrompt,
      messages: anthropicMessages,
    })

    const bloque = message.content.find((b) => b.type === 'text') as { type: 'text'; text: string } | undefined
    const texto = (bloque?.text ?? '').trim()

    try {
      const limpio = texto.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      const parsed = JSON.parse(limpio) as { respuesta: string; borrador: Borrador }
      return NextResponse.json({
        respuesta: parsed.respuesta || 'Listo, sigo atento.',
        borrador: {
          observaciones: parsed.borrador?.observaciones ?? borradorActual?.observaciones ?? '',
          labores: Array.isArray(parsed.borrador?.labores) ? parsed.borrador.labores : (borradorActual?.labores ?? []),
          aplicaciones: Array.isArray(parsed.borrador?.aplicaciones) ? parsed.borrador.aplicaciones : (borradorActual?.aplicaciones ?? []),
        },
      })
    } catch (parseErr) {
      console.error('[chat-visita] no se pudo parsear la respuesta como JSON:', texto)
      return NextResponse.json({
        respuesta: texto || 'No pude procesar eso, ¿puedes repetirlo de otra forma?',
        borrador: borradorActual ?? BORRADOR_VACIO,
      })
    }
  } catch (err) {
    console.error('[chat-visita]', err)
    return NextResponse.json({ error: 'Error al procesar el mensaje' }, { status: 500 })
  }
}
