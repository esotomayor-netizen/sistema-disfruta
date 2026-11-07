'use client'

export default function ImprimirBoton() {
  return (
    <div className="print:hidden flex items-center gap-3 mb-4">
      <button onClick={() => window.print()} className="btn-primary">Imprimir / Guardar como PDF</button>
      <span className="text-xs text-gray-400">En el diálogo elige “Guardar como PDF” para enviarlo al cliente o productor</span>
    </div>
  )
}
