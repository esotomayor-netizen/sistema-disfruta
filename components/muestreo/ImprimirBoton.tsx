'use client'

export default function ImprimirBoton({ id }: { id: number }) {
  return (
    <div className="print:hidden flex flex-wrap items-center gap-3 mb-4">
      <a href={`/api/muestreos/${id}/pdf`} className="btn-primary" target="_blank" rel="noopener">Descargar PDF</a>
      <button onClick={() => window.print()} className="btn-secondary">Imprimir</button>
      <span className="text-xs text-gray-400">“Descargar PDF” funciona también en el celular; desde ahí puedes guardarlo o enviarlo por WhatsApp o correo.</span>
    </div>
  )
}
