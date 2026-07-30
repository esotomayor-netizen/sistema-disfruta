'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { ROLES_USUARIO, ROLES_ENCARGADO } from '@/lib/constants'

export default function EditarMiembroPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    rol: 'TECNICO',
    telefono: '',
    activo: true,
  })

  useEffect(() => {
    fetch(`/api/equipo/${id}`)
      .then((r) => r.json())
      .then((u: { nombre: string; apellido: string; email: string; rol: string; telefono: string | null; activo: boolean }) => {
        setForm({ nombre: u.nombre, apellido: u.apellido, email: u.email, rol: u.rol, telefono: u.telefono ?? '', activo: u.activo })
      })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/equipo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) router.push('/equipo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header
        title="Editar Miembro"
        subtitle="Actualizar información del integrante"
        action={<Link href="/equipo" className="btn-secondary">← Volver</Link>}
      />
      <div className="max-w-lg card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre</label>
              <input className="input" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div>
              <label className="label">Apellido</label>
              <input className="input" required value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Correo electrónico</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Rol</label>
              <select className="input" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                <optgroup label="Equipo interno">
                  {ROLES_USUARIO.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
                </optgroup>
                <optgroup label="Contacto externo">
                  {ROLES_ENCARGADO.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="activo" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
            <label htmlFor="activo" className="text-sm text-gray-700">Miembro activo</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Guardando…' : 'Guardar Cambios'}</button>
            <Link href="/equipo" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
