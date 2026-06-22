'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import Link from 'next/link'

interface Usuario { id: number; nombre: string; apellido: string; activo: boolean }

export default function NuevaEmpresaPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const esSupervisor = (session?.user as any)?.rol === 'SUPERVISOR'
  const [loading, setLoading] = useState(false)
  const [tecnicos, setTecnicos] = useState<Usuario[]>([])
  const [form, setForm] = useState({
    razonSocial: '',
    rut: '',
    contactoNombre: '',
    contactoEmail: '',
    contactoTelefono: '',
    tecnicoId: '',
  })

  useEffect(() => {
    fetch('/api/equipo')
      .then((r) => r.json())
      .then((t: Usuario[]) => setTecnicos(t.filter((x) => x.activo)))
  }, [])

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
          {esSupervisor && (
            <div>
              <label className="label">Técnico / Supervisor asignado</label>
              <select
                className="input"
                value={form.tecnicoId}
                onChange={(e) => setForm({ ...form, tecnicoId: e.target.value })}
              >
                <option value="">Sin técnico asignado</option>
                {tecnicos.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
                ))}
              </select>
            </div>
          )}
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
