'use client'

interface MuestreoProductorFilterProps {
  productores: string[]
  productor?: string
  variedad?: string
  tipo?: string
  agrupar?: string
}

export default function MuestreoProductorFilter({ productores, productor, variedad, tipo, agrupar }: MuestreoProductorFilterProps) {
  return (
    <select
      className="input ml-auto w-auto text-sm"
      value={productor ?? ''}
      onChange={(e) => {
        const v = e.target.value
        const params = new URLSearchParams()
        if (variedad) params.set('variedad', variedad)
        if (tipo) params.set('tipo', tipo)
        if (agrupar) params.set('agrupar', agrupar)
        if (v) params.set('productor', v)
        window.location.href = `/muestreos${params.toString() ? `?${params.toString()}` : ''}`
      }}
    >
      <option value="">Todos los productores</option>
      {productores.map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>
  )
}
