'use client'

interface ConteoPredioFilterProps {
  predios: { id: number; nombre: string }[]
  tipoEstructura?: string
  predioId?: string
}

export default function ConteoPredioFilter({ predios, tipoEstructura, predioId }: ConteoPredioFilterProps) {
  return (
    <select
      className="input ml-auto w-auto text-sm"
      value={predioId ?? ''}
      onChange={(e) => {
        const v = e.target.value
        const params = new URLSearchParams()
        if (tipoEstructura) params.set('tipoEstructura', tipoEstructura)
        if (v) params.set('predioId', v)
        window.location.href = `/conteos${params.toString() ? `?${params.toString()}` : ''}`
      }}
    >
      <option value="">Todos los predios</option>
      {predios.map((p) => (
        <option key={p.id} value={p.id}>{p.nombre}</option>
      ))}
    </select>
  )
}
