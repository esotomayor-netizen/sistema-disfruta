'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import Link from 'next/link'

interface Usuario { id: number; nombre: string; apellido: string; activo: boolean }

export default function EditarEmpresaPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const esSupervisor = (session?.user as any)?.rol === 'SUPERVISOR'
  const [loading, setLoading] = useState(false)
  const [tecnicos, setTecnicos] = useState<Usuario[]>([])
  const [tecnicoActual, setTecnicoActual] = useState<string>('')
  const [form, setForm] = useState({
    razonSocial: '',
    rut: '',
    contactoNombre: '',
    contactoEmail: '',
    contactoTelefono: '',
    tecnicoId: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/equipo').then((r) => r.json()),
      fetch(`/api/empresas/${id}`).then((r) => r.json()),
    ]).then(([t, empresa]: [Usuario[], { razonSocial: string; rut: string; contactoNombre: string; contactoEmail: string | null; contactoTelefono: string | null; tecnicoId: number | null; tecnico: { nombre: string; apellido: string } | null }]) => {
      setTecnicos(t.filter((x) => x.activo))
      if (empresa) {
        setForm({
          razonSocial: empresa.razonSocial,
          rut: empresa.rut,
          contactoNombre: empresa.contactoNombre,
          contactoEmail: empresa.contactoEmail ?? '',
          contactoTelefono: empresa.contactoTelefono ?? '',
          tecnicoId: empresa.tecnicoId ? String(empresa.tecnicoId) : '',
        })
        setTecnicoActual(empresa.tecnico ? `${empresa.tecnico.nombre} ${empresa.tecnico.apellido}` : 'Sin técnico asignado')
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
          <div>
            <label className="label">Técnico / Supervisor asignado</label>
            {esSupervisor ? (
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
            ) : (
              <p className="text-sm text-gray-600 py-2">{tecnicoActual} <span className="text-xs text-gray-400">(solo un supervisor puede editar esta asignación)</span></p>
            )}
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
