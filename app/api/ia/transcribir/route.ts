export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { toFile } from 'openai/uploads'

// Se instancia dentro del handler (no a nivel de módulo) para que el build
// de Next.js no falle recolectando datos de la página si OPENAI_API_KEY
// todavía no está configurada en el entorno.
function getClient() {
  return new OpenAI()
}

const EXTENSION_POR_SUBTIPO: Record<string, string> = {
  webm: 'webm',
  mp4: 'mp4',
  mpeg: 'mpeg',
  mpga: 'mpga',
  'x-m4a': 'm4a',
  m4a: 'm4a',
  wav: 'wav',
  'x-wav': 'wav',
  ogg: 'ogg',
}

// Un data URL de audio puede traer parámetros extra antes de ";base64"
// (ej. "data:audio/webm;codecs=opus;base64,..."), así que se busca la
// primera coma en vez de asumir un formato fijo.
function parseAudioDataUrl(dataUrl: string): { mediaType: string; data: Buffer } | null {
  const comaIdx = dataUrl.indexOf(',')
  if (comaIdx === -1) return null
  const header = dataUrl.slice(0, comaIdx)
  if (!header.startsWith('data:') || !header.endsWith(';base64')) return null
  const mediaType = header.slice('data:'.length, header.length - ';base64'.length).split(';')[0]
  if (!mediaType.startsWith('audio/')) return null
  return { mediaType, data: Buffer.from(dataUrl.slice(comaIdx + 1), 'base64') }
}

export async function POST(req: Request) {
  const { audio } = (await req.json()) as { audio?: string }
  if (!audio) return NextResponse.json({ error: 'Falta el audio' }, { status: 400 })

  const parsed = parseAudioDataUrl(audio)
  if (!parsed) return NextResponse.json({ error: 'Formato de audio no válido' }, { status: 400 })

  const subtipo = parsed.mediaType.split('/')[1] || 'webm'
  const extension = EXTENSION_POR_SUBTIPO[subtipo] || 'webm'

  try {
    const client = getClient()
    const file = await toFile(parsed.data, `audio.${extension}`)
    const transcripcion = await client.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'es',
    })
    return NextResponse.json({ texto: transcripcion.text })
  } catch (err) {
    console.error('[transcribir]', err)
    return NextResponse.json({ error: 'No se pudo transcribir el audio' }, { status: 500 })
  }
}
