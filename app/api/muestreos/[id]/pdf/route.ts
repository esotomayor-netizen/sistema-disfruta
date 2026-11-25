export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { cargarMuestreo } from '@/app/muestreos/cargar'
import { generarPdfMuestreo, nombreArchivoPdf } from '@/lib/muestreo-pdf'

// PDF del informe de muestreo generado en el servidor. Se usa en vez de
// window.print(), que no funciona en la app instalada en el celular.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const m = await cargarMuestreo(params.id)
  if (!m) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const pdf = generarPdfMuestreo(m).output('arraybuffer')
  const descargar = new URL(req.url).searchParams.get('descargar') === '1'
  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${descargar ? 'attachment' : 'inline'}; filename="${nombreArchivoPdf(m)}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
