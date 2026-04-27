'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'

export default function EditarEmpresaPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    razonSocial: '',
    rut: '',
    contactoNombre: '',
    contactoEmail: '',
    contactoTelefono: '',
  })

  useEffect(() => {
    fetch(`/api/empresas/${id}`)
      .then((r) => r.json())
      .then((empresa: { razonSocial: string; rut: string; contactoNombre: string; contactoEmail: string | null; contactoTelefono: string | null }) => {
        if (empresa) {
          setForm({
            razonSocial: empresa.razonSocial,
            rut: empresa.rut,
            contactoNombre: empresa.contactoNombre,
            contactoEmail: empresa.contactoEmail ?? '',
            contactoTelefono: empresa.contactoTelefono ?? '',
          })
        }
      })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/empresas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) router.push('/empresas')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta empresa? Se eliminarán también sus predios asociados.')) return
    await fetch(`/api/empresas/${id}`, { method: 'DELETE' })
    router.push('/empresas')
  }

  return (
    <div>
      <Header
        title="Editar Empresa"
        subtitle="Actualizar información de la empresa"
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
            />
          </div>
          <div>
            <label className="label">RUT</label>
            <input
              className="input"
              required
              value={form.rut}
              onChange={(e) => setForm({ ...form, rut: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Nombre de Contacto</label>
            <input
              className="input"
              required
              value={form.contactoNombre}
              onChange={(e) => setForm({ ...form, contactoNombre: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email de Contacto (opcional)</label>
            <input
              className="input"
              type="email"
              value={form.contactoEmail}
              onChange={(e) => setForm({ ...form, contactoEmail: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Teléfono de Contacto (opcional)</label>
            <input
              className="input"
              value={form.contactoTelefono}
              onChange={(e) => setForm({ ...form, contactoTelefono: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar Cambios'}
            </button>
            <Link href="/empresas" className="btn-secondary">Cancelar</Link>
            <button type="button" onClick={handleDelete} className="btn-danger ml-auto">Eliminar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
