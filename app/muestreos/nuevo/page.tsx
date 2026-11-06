import Link from 'next/link'
import Header from '@/components/Header'
import MuestreoForm from '@/components/muestreo/MuestreoForm'

export default function NuevoMuestreoPage() {
  return (
    <div>
      <Header
        title="Nuevo muestreo de cerezas"
        subtitle="Calibre, color, firmeza, °Brix, defectos y fotos en terreno"
        action={<Link href="/muestreos" className="btn-secondary">← Volver</Link>}
      />
      <MuestreoForm />
    </div>
  )
}
