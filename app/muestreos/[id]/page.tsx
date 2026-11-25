import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import InformeMuestreo from '@/components/muestreo/InformeMuestreo'
import EliminarMuestreo from '@/components/muestreo/EliminarMuestreo'
import PdfMuestreoBoton from '@/components/muestreo/PdfMuestreoBoton'
import { nombreArchivoPdf } from '@/lib/muestreo-pdf'
import { cargarMuestreo, curvaReferencia } from '../cargar'

export const dynamic = 'force-dynamic'

export default async function MuestreoPage({ params }: { params: { id: string } }) {
  const m = await cargarMuestreo(params.id)
  if (!m) notFound()
  const referencia = await curvaReferencia(m.variedad, m.id)
  return (
    <div>
      <Header
        title="Informe de muestreo"
        subtitle={`${m.variedad} · ${m.productor || m.predio?.nombre || ''}`}
        action={
          <div className="flex flex-wrap gap-2 justify-end">
            <Link href="/muestreos" className="btn-secondary">← Volver</Link>
            <Link href={`/muestreos/${m.id}/editar`} className="btn-secondary">Editar</Link>
            <PdfMuestreoBoton id={m.id} nombreArchivo={nombreArchivoPdf(m)} />
            <Link href={`/muestreos/${m.id}/imprimir`} className="btn-secondary hidden md:inline-flex" target="_blank">Imprimir</Link>
            <EliminarMuestreo id={m.id} />
          </div>
        }
      />
      <InformeMuestreo m={m} referencia={referencia} />
    </div>
  )
}
