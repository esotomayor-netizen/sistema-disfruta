'use client'

import PdfMuestreoBoton from './PdfMuestreoBoton'

export default function ImprimirBoton({ id, nombreArchivo }: { id: number; nombreArchivo: string }) {
  return (
    <div className="print:hidden flex flex-wrap items-center gap-3 mb-4">
      <PdfMuestreoBoton id={id} nombreArchivo={nombreArchivo} />
      <button onClick={() => window.print()} className="btn-secondary">Imprimir</button>
      <span className="text-xs text-gray-400">En el celular, “Enviar / guardar PDF” abre las opciones para mandarlo por WhatsApp o correo, o guardarlo en Archivos.</span>
    </div>
  )
}
