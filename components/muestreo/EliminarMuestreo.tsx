'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function EliminarMuestreo({ id }: { id: number }) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const eliminar = async () => {
    if (!confirm('¿Eliminar este muestreo? No se puede deshacer.')) return
    setCargando(true)
    const res = await fetch(`/api/muestreos/${id}`, { method: 'DELETE' })
    setCargando(false)
    if (res.ok) { router.push('/muestreos'); router.refresh() } else alert('No se pudo eliminar')
  }
  return <button onClick={eliminar} disabled={cargando} className="btn-danger">{cargando ? '…' : 'Eliminar'}</button>
}
