'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'

export default function EditarParcelaPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    superficie: '',
    cultivo: '',
    ubicacion: '',
    activa: true,
  })

  useEffect(() => {
    fetch('/api/parcelas')
      .then((r) => r.json())
      .then((parcelas: { id: number; nombre: string; superficie: number; cultivo: string; ubicacion: string; activa: boolean }[]) => {
        const p = parcelas.find((x) => x.id === parseInt(id as string))
        if (p) setForm({ nombre: p.nombre, superficie: String(p.superficie), cultivo: p.cultivo, ubicacion: p.ubicacion, activa: p.activa })
      })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/parcelas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, superficie: parseFloat(form.superficie) }),
      })
      if (res.ok) router.push('/parcelas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header
        title="Editar Parcela"
        subtitle="Actualizar información de la parcela"
        action={<Link href="/parcelas" className="btn-secondary">← Volver</Link>}
      />
      <div className="max-w-lg card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre de la parcela</label>
            <input className="input" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cultivo</label>
              <input className="input" required value={form.cultivo} onChange={(e) => setForm({ ...form, cultivo: e.target.value })} />
            </div>
            <div>
              <label className="label">Superficie (ha)</label>
              <input className="input" type="number" step="0.1" min="0" required value={form.superficie} onChange={(e) => setForm({ ...form, superficie: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Ubicación</label>
            <input className="input" required value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="activa" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
            <label htmlFor="activa" className="text-sm text-gray-700">Parcela activa</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Guardando…' : 'Guardar Cambios'}</button>
            <Link href="/parcelas" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
