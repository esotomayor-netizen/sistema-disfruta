'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { CULTIVOS, VARIEDADES_POR_CULTIVO } from '@/lib/constants'

interface Empresa { id: number; razonSocial: string; contactoNombre: string }
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
    variedades: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/empresas').then((r) => r.json()),
      fetch('/api/equipo?encargados=true').then((r) => r.json()),
    ]).then(([e, u]) => {
      setEmpresas(e as Empresa[])
      setUsuarios((u as Usuario[]).filter((x) => x.activo))
    })
  }, [])

  const handleEmpresaChange = (empresaId: string) => {
    const empresa = empresas.find((e) => String(e.id) === empresaId)
    if (empresa) {
      const nombreRef = empresa.contactoNombre.toLowerCase()
      const usuario = usuarios.find((u) =>
        `${u.nombre} ${u.apellido}`.toLowerCase() === nombreRef ||
        nombreRef.includes(u.apellido.toLowerCase())
      )
      setForm((f) => ({
        ...f,
        empresaId,
        encargadoId: usuario ? String(usuario.id) : f.encargadoId,
      }))
    } else {
      setForm((f) => ({ ...f, empresaId }))
    }
  }

  const handleCultivoChange = (cultivo: string) => {
    setForm((f) => ({ ...f, cultivo, variedades: '' }))
  }

  const toggleVariedad = (v: string) => {
    const current = form.variedades ? form.variedades.split(',') : []
    const updated = current.includes(v) ? current.filter((x) => x !== v) : [...current, v]
    setForm((f) => ({ ...f, variedades: updated.filter(Boolean).join(',') }))
  }

  const variedadesDisponibles = VARIEDADES_POR_CULTIVO[form.cultivo] ?? []
  const variedadesSeleccionadas = form.variedades ? form.variedades.split(',') : []

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
          <div>
            <label className="label">Empresa (Razón Social)</label>
            <select
              className="input"
              required
              value={form.empresaId}
              onChange={(e) => handleEmpresaChange(e.target.value)}
            >
              <option value="">Seleccionar empresa…</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.razonSocial}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre del Predio</label>
              <input
                className="input"
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Fundo Norte"
              />
            </div>
            <div>
              <label className="label">Código CSG (SAG)</label>
              <input
                className="input"
                required
                value={form.csg}
                onChange={(e) => setForm({ ...form, csg: e.target.value })}
                placeholder="Ej: 105294"
              />
            </div>
          </div>

          <div>
            <label className="label">Encargado / Responsable</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Especie / Cultivo</label>
              <select
                className="input"
                required
                value={form.cultivo}
                onChange={(e) => handleCultivoChange(e.target.value)}
              >
                <option value="">Seleccionar cultivo…</option>
                {CULTIVOS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
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

          {variedadesDisponibles.length > 0 && (
            <div>
              <label className="label">Variedades</label>
              <div className="grid grid-cols-3 gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                {variedadesDisponibles.map((v) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={variedadesSeleccionadas.includes(v)}
                      onChange={() => toggleVariedad(v)}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-sm text-gray-700">{v}</span>
                  </label>
                ))}
              </div>
              {variedadesSeleccionadas.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Seleccionadas: {variedadesSeleccionadas.join(', ')}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="label">Ubicación</label>
            <input
              className="input"
              required
              value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
              placeholder="Ej: Sector Norte, Curicó"
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
