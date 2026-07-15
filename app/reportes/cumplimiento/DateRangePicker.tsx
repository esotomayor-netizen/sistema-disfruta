'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DateRangePicker({ desde, hasta }: { desde: string; hasta: string }) {
  const router = useRouter()
  const [d, setD] = useState(desde)
  const [h, setH] = useState(hasta)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/reportes/cumplimiento?desde=${d}&hasta=${h}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 mb-6">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
        <input
          type="date"
          value={d}
          onChange={(e) => setD(e.target.value)}
          className="input"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
        <input
          type="date"
          value={h}
          onChange={(e) => setH(e.target.value)}
          className="input"
          required
        />
      </div>
      <button type="submit" className="btn-primary">
        Filtrar
      </button>
    </form>
  )
}
