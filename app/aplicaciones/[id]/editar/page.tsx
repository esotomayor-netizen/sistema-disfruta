'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { TIPOS_PRODUCTO, ESTADOS_APLICACION, UNIDADES } from '@/lib/constants'

interface Parcela { id: number; nombre: string; cultivo: string; activa: boolean }
interface Usuario { id: number; nombre: string; apellido: string; activo: boolean }

export default function EditarAplicacionPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [parcelas, setParcelas] = useState<Parcela[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [form, setForm] = useState({
    producto: '',
    tipoProducto: 'FUNGICIDA',
    dosis: '',
    unidad: 'L/ha',
    fecha: '',
    estado: 'PENDIENTE',
    observaciones: '',
    parcelaId: '',
    tecnicoId: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/parcelas').then((r) => r.json()),
      fetch('/api/equipo').then((r) => r.json()),
      fetch('/api/aplicaciones').then((r) => r.json()),
    ]).then(([p, u, aps]) => {
      setParcelas((p as Parcela[]).filter((x) => x.activa))
      setUsuarios((u as Usuario[]).filter((x) => x.activo))
      const ap = (aps as { id: number; producto: string; tipoProducto: string; dosis: number; unidad: string; fecha: string; estado: string; observaciones: string | null; parcelaId: number; tecnicoId: number }[]).find((a) => a.id === parseInt(id as string))
      if (ap) {
        setForm({
          producto: ap.producto,
          tipoProducto: ap.tipoProducto,
          dosis: String(ap.dosis),
          unidad: ap.unidad,
          fecha: new Date(ap.fecha).toISOString().split('T')[0],
          estado: ap.estado,
          observaciones: ap.observaciones ?? '',
          parcelaId: String(ap.parcelaId),
          tecnicoId: String(ap.tecnicoId),
        })
      }
    })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/aplicaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) router.push('/aplicaciones')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta aplicación?')) return
    await fetch(`/api/aplicaciones/${id}`, { method: 'DELETE' })
    router.push('/aplicaciones')
  }

  return (
    <div>
      <Header
        title="Editar Aplicación"
        subtitle="Actualizar registro de aplicación"
        action={<Link href="/aplicaciones" className="btn-secondary">← Volver</Link>}
      />
      <div className="max-w-2xl card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Producto</label>
              <input className="input" required value={form.producto} onChange={(e) => setForm({ ...form, producto: e.target.value })} />
            </div>
            <div>
              <label className="label">Tipo de producto</label>
              <select className="input" value={form.tipoProducto} onChange={(e) => setForm({ ...form, tipoProducto: e.target.value })}>
                {TIPOS_PRODUCTO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Dosis</label>
              <input className="input" type="number" step="0.01" min="0" required value={form.dosis} onChange={(e) => setForm({ ...form, dosis: e.target.value })} />
            </div>
            <div>
              <label className="label">Unidad</label>
              <select className="input" value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })}>
                {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Parcela</label>
              <select className="input" required value={form.parcelaId} onChange={(e) => setForm({ ...form, parcelaId: e.target.value })}>
                {parcelas.map((p) => <option key={p.id} value={p.id}>{p.nombre} ({p.cultivo})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Técnico</label>
              <select className="input" required value={form.tecnicoId} onChange={(e) => setForm({ ...form, tecnicoId: e.target.value })}>
                {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha</label>
              <input className="input" type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="input" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                {ESTADOS_APLICACION.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Observaciones</label>
            <textarea className="input" rows={3} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Guardando…' : 'Guardar Cambios'}</button>
            <Link href="/aplicaciones" className="btn-secondary">Cancelar</Link>
            <button type="button" onClick={handleDelete} className="btn-danger ml-auto">Eliminar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
