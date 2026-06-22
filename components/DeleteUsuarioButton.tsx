'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteUsuarioButton({ userId, userName }: { userId: number; userName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar permanentemente a ${userName}? Esta acción no se puede deshacer.`)) return
    setLoading(true)
    setError('')
    const res = await fetch(`/api/equipo/${userId}`, { method: 'DELETE' })
    setLoading(false)
    if (res.ok) router.refresh()
    else { const d = await res.json(); setError(d.error || 'No se pudo eliminar') }
  }

  return (
    <div className="ml-auto flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button onClick={handleDelete} disabled={loading} className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50">
        {loading ? 'Eliminando…' : 'Eliminar'}
      </button>
    </div>
  )
}
