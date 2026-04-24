'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'

export default function NuevaParcelaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    superficie: '',
    cultivo: '',
    ubicacion: '',
    activa: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/parcelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) router.push('/parcelas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header
        title="Nueva Parcela"
        subtitle="Registrar una nueva parcela en el fundo"
        action={
          <Link href="/parcelas" className="btn-secondary">
            ← Volver
          </Link>
        }
      />
      <div className="max-w-lg card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre de la parcela</label>
            <input
              className="input"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Parcela Norte"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cultivo</label>
              <input
                className="input"
                required
                value={form.cultivo}
                onChange={(e) => setForm({ ...form, cultivo: e.target.value })}
                placeholder="Ej: Vid"
              />
            </div>
            <div>
              <label className="label">Superficie (ha)</label>
              <input
                className="input"
                type="number"
                step="0.1"
                min="0"
                required
                value={form.superficie}
                onChange={(e) => setForm({ ...form, superficie: e.target.value })}
                placeholder="0.0"
              />
            </div>
          </div>
          <div>
            <label className="label">Ubicación</label>
            <input
              className="input"
              required
              value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
              placeholder="Ej: Sector Norte - Fundo Disfruta"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activa"
              checked={form.activa}
              onChange={(e) => setForm({ ...form, activa: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="activa" className="text-sm text-gray-700">Parcela activa</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar Parcela'}
            </button>
            <Link href="/parcelas" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
