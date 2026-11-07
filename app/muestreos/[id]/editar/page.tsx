import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import MuestreoForm, { MuestreoFormData } from '@/components/muestreo/MuestreoForm'
import { toConteos, toFotos } from '@/lib/muestreo'
import { cargarMuestreo } from '../../cargar'

export const dynamic = 'force-dynamic'

const s = (v: unknown) => (v === null || v === undefined ? '' : String(v))

export default async function EditarMuestreoPage({ params }: { params: { id: string } }) {
  const m = await cargarMuestreo(params.id)
  if (!m) notFound()
  // datetime-local en hora de Chile.
  const f = new Date(m.fecha)
  const local = new Date(f.toLocaleString('en-US', { timeZone: 'America/Santiago' }))
  const pad = (n: number) => String(n).padStart(2, '0')
  const fecha = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`
  const inicial: MuestreoFormData = {
    tipo: m.tipo, fecha, predioId: s(m.predioId), productor: s(m.productor), cuartel: s(m.cuartel),
    variedad: m.variedad, lote: s(m.lote), guia: s(m.guia), nEnvases: s(m.nEnvases), kilos: s(m.kilos),
    tamanoMuestra: s(m.tamanoMuestra), tempPulpa: s(m.tempPulpa), tempAmbiente: s(m.tempAmbiente),
    calibres: toConteos(m.calibres), colores: toConteos(m.colores), firmeza: toConteos(m.firmeza), brix: m.brix,
    defectosCalidad: toConteos(m.defectosCalidad), defectosCondicion: toConteos(m.defectosCondicion),
    fotos: toFotos(m.fotos), observaciones: s(m.observaciones), latitud: s(m.latitud), longitud: s(m.longitud),
  }
  return (
    <div>
      <Header title={`Editar muestreo #${m.id}`} subtitle={m.variedad}
        action={<Link href={`/muestreos/${m.id}`} className="btn-secondary">← Volver</Link>} />
      <MuestreoForm inicial={inicial} muestreoId={m.id} />
    </div>
  )
}
