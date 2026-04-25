'use client'

interface ParcelaSelectProps {
  parcelas: { id: number; nombre: string }[]
  estado?: string
  parcelaId?: string
}

export default function ParcelaSelect({ parcelas, estado, parcelaId }: ParcelaSelectProps) {
  if (parcelas.length === 0) return null
  return (
    <select
      className="input ml-auto w-auto text-sm"
      value={parcelaId ?? ''}
      onChange={(e) => {
        const v = e.target.value
        window.location.href = v
          ? `/labores?${estado ? `estado=${estado}&` : ''}parcelaId=${v}`
          : `/labores${estado ? `?estado=${estado}` : ''}`
      }}
    >
      <option value="">Todas las parcelas</option>
      {parcelas.map((p) => (
        <option key={p.id} value={p.id}>{p.nombre}</option>
      ))}
    </select>
  )
}
