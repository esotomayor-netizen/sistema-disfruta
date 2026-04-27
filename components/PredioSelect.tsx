'use client'

interface PredioSelectProps {
  predios: { id: number; nombre: string }[]
  estado?: string
  predioId?: string
}

export default function PredioSelect({ predios, estado, predioId }: PredioSelectProps) {
  if (predios.length === 0) return null
  return (
    <select
      className="input ml-auto w-auto text-sm"
      value={predioId ?? ''}
      onChange={(e) => {
        const v = e.target.value
        window.location.href = v
          ? `/labores?${estado ? `estado=${estado}&` : ''}predioId=${v}`
          : `/labores${estado ? `?estado=${estado}` : ''}`
      }}
    >
      <option value="">Todos los predios</option>
      {predios.map((p) => (
        <option key={p.id} value={p.id}>{p.nombre}</option>
      ))}
    </select>
  )
}
