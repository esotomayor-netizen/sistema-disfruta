export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { LABOR_TIPOS, TIPOS_PRODUCTO, UNIDADES } from '@/lib/constants'

const client = new Anthropic()

interface Propuesta {
  id: string
  tipo: 'labor' | 'aplicacion' | 'observacion'
  estado: 'pendiente' | 'guardada' | 'descartada'
  datos: Record<string, string>
  referenciaId?: number
}

function parseDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) return null
  return { mediaType: match[1], data: match[2] }
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const mensajes = await prisma.visitaMensaje.findMany({
    where: { visitaId: parseInt(params.id) },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(mensajes)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const visitaId = parseInt(params.id)
  const { texto, fotos } = (await req.json()) as { texto: string; fotos?: string[] }

  if (!texto?.trim() && (!fotos || fotos.length === 0)) {
    return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 })
  }

  const visita = await prisma.visita.findUnique({
    where: { id: visitaId },
    include: { predio: true },
  })
  if (!visita) return NextResponse.json({ error: 'Visita no encontrada' }, { status: 404 })

  const [mensajeUsuario] = await prisma.$transaction([
    prisma.visitaMensaje.create({
      data: { visitaId, role: 'user', texto: texto ?? '', fotos: Array.isArray(fotos) ? fotos : [] },
    }),
    ...(fotos && fotos.length > 0
      ? [
          prisma.visita.update({
            where: { id: visitaId },
            data: { fotos: Array.from(new Set([...visita.fotos, ...fotos])) },
          }),
        ]
      : []),
  ])

  const [labores, aplicaciones, historial] = await Promise.all([
    prisma.labor.findMany({ where: { visitaId }, select: { tipo: true, descripcion: true } }),
    prisma.aplicacion.findMany({ where: { visitaId }, select: { producto: true, dosis: true, unidad: true } }),
    prisma.visitaMensaje.findMany({ where: { visitaId }, orderBy: { createdAt: 'asc' } }),
  ])

  const propuestasPendientes = historial.flatMap((m) =>
    ((m.propuestas as unknown as Propuesta[]) || []).filter((p) => p.estado === 'pendiente')
  )

  const yaRegistrado = [
    ...labores.map((l) => `Labor "${l.tipo}": ${l.descripcion}`),
    ...aplicaciones.map((a) => `Aplicación: ${a.producto} (${a.dosis} ${a.unidad})`),
  ]
  const pendientesDeConfirmar = propuestasPendientes.map((p) => `[${p.tipo}] ${JSON.stringify(p.datos)}`)

  const systemPrompt = `Eres el asistente de registro de visitas técnicas de un sistema para predios agrícolas (Exportadora Disfruta). Conversas en español, en tono natural, breve y cercano (como un chat de WhatsApp), con un técnico de campo que te va contando — por texto y a veces con fotos — qué hace mientras recorre un predio, en tiempo real.

Predio: ${visita.predio.nombre}. Especie/cultivo de la visita: ${visita.especie || 'no especificada'}.

${yaRegistrado.length > 0 ? `Ya quedaron registradas en esta visita (NO las vuelvas a proponer):\n${yaRegistrado.map((l) => `- ${l}`).join('\n')}\n` : ''}
${pendientesDeConfirmar.length > 0 ? `Ya se las propusiste antes y el técnico todavía no las confirma (NO las repitas, salvo que dé un dato nuevo que las corrija):\n${pendientesDeConfirmar.map((l) => `- ${l}`).join('\n')}\n` : ''}

Tu trabajo en cada turno, mirando solo el ÚLTIMO mensaje del técnico (con el resto de la conversación como contexto):
1. Responder de forma conversacional y breve — como si fuera un chat real. Si falta un dato importante para una aplicación (tipo de producto, dosis, unidad) preguñtalo de forma natural, una cosa a la vez. Si ya tienes lo esencial, confirma brevemente lo que entendiste.
2. Si en ese último mensaje el técnico contó una labor o aplicación NUEVA (no registrada ni ya propuesta antes), inclúyela en "propuestas" para que la confirme con un botón en el chat. Si no mencionó nada nuevo que registrar, "propuestas" va vacío.
3. Si lo que contó es relevante como nota general de la visita (algo que no es una labor o aplicación puntual, ej. estado general del huerto, alguna alerta), puedes proponer también un ítem tipo "observacion" con un resumen breve en lenguaje técnico agronómico (2-3 oraciones), para que el técnico decida si lo agrega a las observaciones de la visita.
4. Si el técnico adjunta fotos, agradécelas brevemente y, si el texto que las acompaña lo permite, usa lo que se ve en la foto para enriquecer la descripción de la labor o aplicación correspondiente, pero no inventes detalles que no se vean con claridad.

Reglas para cada propuesta:
- "tipo" debe ser exactamente "labor", "aplicacion" u "observacion".
- Si tipo es "labor", "datos" = {"tipo": uno de [${LABOR_TIPOS.map((t) => t.value).join(', ')}], "descripcion": "...", "observaciones": "..."}.
- Si tipo es "aplicacion", "datos" = {"producto": "...", "tipoProducto": uno de [${TIPOS_PRODUCTO.map((t) => t.value).join(', ')}], "dosis": "...", "unidad": uno de [${UNIDADES.join(', ')}] o el que dio el técnico, "observaciones": "..."}. Si no tienes la dosis exacta, dosis puede quedar "" — no inventes un número.
- Si tipo es "observacion", "datos" = {"texto": "..."}.
- No propongas algo que ya está en la lista de "ya registradas" o "ya propuestas pendientes" de arriba.

Responde SIEMPRE con un único objeto JSON, sin texto antes ni después, sin bloques de código markdown, con esta forma exacta:
{"respuesta": "tu mensaje conversacional para el técnico", "propuestas": [{"tipo": "labor|aplicacion|observacion", "datos": {...}}]}`

  const anthropicMessages: Anthropic.MessageParam[] = historial.map((m, idx) => {
    const esUltimo = idx === historial.length - 1
    const content: Anthropic.ContentBlockParam[] = []
    if (m.texto) content.push({ type: 'text', text: m.texto })
    if (esUltimo && m.role === 'user' && m.fotos.length > 0) {
      for (const foto of m.fotos) {
        const parsed = parseDataUrl(foto)
        if (parsed) {
          content.push({ type: 'image', source: { type: 'base64', media_type: parsed.mediaType as any, data: parsed.data } })
        }
      }
    } else if (!esUltimo && m.fotos.length > 0) {
      content.push({ type: 'text', text: `[Adjuntó ${m.fotos.length} foto(s) en este mensaje]` })
    }
    if (content.length === 0) content.push({ type: 'text', text: '(mensaje vacío)' })
    return { role: m.role as 'user' | 'assistant', content }
  })

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1500,
      system: systemPrompt,
      messages: anthropicMessages,
    })

    const bloque = message.content.find((b) => b.type === 'text') as { type: 'text'; text: string } | undefined
    const texto = (bloque?.text ?? '').trim()

    let respuesta = 'Listo, sigo atento.'
    let propuestas: Propuesta[] = []
    try {
      const limpio = texto.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      const parsed = JSON.parse(limpio) as { respuesta: string; propuestas: { tipo: Propuesta['tipo']; datos: Record<string, string> }[] }
      respuesta = parsed.respuesta || respuesta
      propuestas = (Array.isArray(parsed.propuestas) ? parsed.propuestas : []).map((p) => ({
        id: randomUUID(),
        tipo: p.tipo,
        estado: 'pendiente' as const,
        datos: p.datos || {},
      }))
    } catch (parseErr) {
      console.error('[mensajes] no se pudo parsear la respuesta como JSON:', texto)
      respuesta = texto || respuesta
    }

    const mensajeAsistente = await prisma.visitaMensaje.create({
      data: { visitaId, role: 'assistant', texto: respuesta, fotos: [], propuestas: propuestas as any },
    })

    return NextResponse.json({ mensajeUsuario, mensajeAsistente })
  } catch (err) {
    console.error('[mensajes]', err)
    return NextResponse.json({ error: 'Error al procesar el mensaje' }, { status: 500 })
  }
}
