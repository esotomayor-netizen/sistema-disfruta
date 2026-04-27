'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'

interface Empresa { id: number; razonSocial: string }
interface Usuario { id: number; nombre: string; apellido: string; activo: boolean }

export default function NuevoPredioPage() {
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
    ]).then(([e, u]) => {
      setEmpresas(e as Empresa[])
      const activos = (u as Usuario[]).filter((x) => x.activo)
      setUsuarios(activos)
      if ((e as Empresa[]).length) setForm((f) => ({ ...f, empresaId: String((e as Empresa[])[0].id) }))
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/predios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) router.push('/predios')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header
        title="Nuevo Predio"
        subtitle="Registrar un nuevo predio agrícola"
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
                placeholder="Ej: Predio Norte"
              />
            </div>
            <div>
              <label className="label">Código CSG (SAG)</label>
              <input
                className="input"
                required
                value={form.csg}
                onChange={(e) => setForm({ ...form, csg: e.target.value })}
                placeholder="Ej: CSG-2024-001"
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
              {loading ? 'Guardando…' : 'Guardar Predio'}
            </button>
            <Link href="/predios" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
