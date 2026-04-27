'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'

export default function NuevaEmpresaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    razonSocial: '',
    rut: '',
    contactoNombre: '',
    contactoEmail: '',
    contactoTelefono: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) router.push('/empresas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header
        title="Nueva Empresa"
        subtitle="Registrar una nueva empresa agrícola"
        action={<Link href="/empresas" className="btn-secondary">← Volver</Link>}
      />
      <div className="max-w-lg card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Razón Social</label>
            <input
              className="input"
              required
              value={form.razonSocial}
              onChange={(e) => setForm({ ...form, razonSocial: e.target.value })}
              placeholder="Ej: Agrícola Disfruta SpA"
            />
          </div>
          <div>
            <label className="label">RUT</label>
            <input
              className="input"
              required
              value={form.rut}
              onChange={(e) => setForm({ ...form, rut: e.target.value })}
              placeholder="Ej: 76.123.456-7"
            />
          </div>
          <div>
            <label className="label">Nombre de Contacto</label>
            <input
              className="input"
              required
              value={form.contactoNombre}
              onChange={(e) => setForm({ ...form, contactoNombre: e.target.value })}
              placeholder="Ej: Juan González"
            />
          </div>
          <div>
            <label className="label">Email de Contacto (opcional)</label>
            <input
              className="input"
              type="email"
              value={form.contactoEmail}
              onChange={(e) => setForm({ ...form, contactoEmail: e.target.value })}
              placeholder="contacto@empresa.cl"
            />
          </div>
          <div>
            <label className="label">Teléfono de Contacto (opcional)</label>
            <input
              className="input"
              value={form.contactoTelefono}
              onChange={(e) => setForm({ ...form, contactoTelefono: e.target.value })}
              placeholder="+56912345678"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar Empresa'}
            </button>
            <Link href="/empresas" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
