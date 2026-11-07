import { notFound } from 'next/navigation'
import InformeMuestreo from '@/components/muestreo/InformeMuestreo'
import ImprimirBoton from '@/components/muestreo/ImprimirBoton'
import { cargarMuestreo } from '../../cargar'

export const dynamic = 'force-dynamic'

export default async function ImprimirMuestreoPage({ params }: { params: { id: string } }) {
  const m = await cargarMuestreo(params.id)
  if (!m) notFound()
  return (
    <div className="max-w-5xl mx-auto p-4 print:p-0 bg-white">
      <style>{`@media print { @page { size: A4; margin: 10mm } .card { box-shadow: none !important; break-inside: avoid } body { background: white } }`}</style>
      <ImprimirBoton />
      <div className="flex items-end justify-between border-b-2 border-primary-700 pb-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-800">Informe de Muestreo de Calidad · Cerezas</h1>
          <p className="text-sm text-gray-600">Exportadora Disfruta S.A. — datos en base a la muestra tomada</p>
        </div>
        <p className="text-xs text-gray-500">Emitido {new Date().toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}</p>
      </div>
      <InformeMuestreo m={m} />
    </div>
  )
}
