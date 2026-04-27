'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'

interface Empresa { id: number; razonSocial: string }
interface Usuario { id: number; nombre: string; apellido: string; activo: boolean }

export default function EditarPredioPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [form, setForm] = useState({
    nombre: '',
    csg: '',
    superficie: '',
    cultivo: '',
    ubicacion: '',
    activa: true,
    empresaId: '',
    encargadoId: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/empresas').then((r) => r.json()),
      fetch('/api/equipo').then((r) => r.json()),
      fetch(`/api/predios/${id}`).then((r) => r.json()),
    ]).then(([e, u, predio]) => {
      setEmpresas(e as Empresa[])
      setUsuarios((u as Usuario[]).filter((x) => x.activo))
      if (predio) {
        setForm({
          nombre: predio.nombre,
          csg: predio.csg,
          superficie: String(predio.superficie),
          cultivo: predio.cultivo,
          ubicacion: predio.ubicacion,
          activa: predio.activa,
          empresaId: String(predio.empresaId),
          encargadoId: predio.encargadoId ? String(predio.encargadoId) : '',
        })
      }
    })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/predios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) router.push('/predios')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este predio?')) return
    await fetch(`/api/predios/${id}`, { method: 'DELETE' })
    router.push('/predios')
  }

  return (
    <div>
      <Header
        title="Editar Predio"
        subtitle="Actualizar información del predio"
        action={<Link href="/predios" className="btn-secondary">← Volver</Link>}
      />
      <div className="max-w-2xl card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre del Predio</label>
              <input
                className="input"
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Código CSG (SAG)</label>
              <input
                className="input"
                required
                value={form.csg}
                onChange={(e) => setForm({ ...form, csg: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Empresa</label>
            <select
              className="input"
              required
              value={form.empresaId}
              onChange={(e) => setForm({ ...form, empresaId: e.target.value })}
            >
              <option value="">Seleccionar empresa…</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.razonSocial}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cultivo</label>
              <input
                className="input"
                required
                value={form.cultivo}
                onChange={(e) => setForm({ ...form, cultivo: e.target.value })}
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
            />
          </div>

          <div>
            <label className="label">Encargado (opcional)</label>
            <select
              className="input"
              value={form.encargadoId}
              onChange={(e) => setForm({ ...form, encargadoId: e.target.value })}
            >
              <option value="">Sin encargado asignado</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activa"
              checked={form.activa}
              onChange={(e) => setForm({ ...form, activa: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="activa" className="text-sm text-gray-700">Predio activo</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar Cambios'}
            </button>
            <Link href="/predios" className="btn-secondary">Cancelar</Link>
            <button type="button" onClick={handleDelete} className="btn-danger ml-auto">Eliminar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
