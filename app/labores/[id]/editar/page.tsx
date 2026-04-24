'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { LABOR_TIPOS, ESTADOS_LABOR } from '@/lib/constants'

interface Parcela { id: number; nombre: string; cultivo: string; activa: boolean }
interface Usuario { id: number; nombre: string; apellido: string; rol: string; activo: boolean }

function toDateInput(d: string | null | undefined) {
  if (!d) return ''
  return new Date(d).toISOString().split('T')[0]
}

export default function EditarLaborPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [parcelas, setParcelas] = useState<Parcela[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [form, setForm] = useState({
    tipo: 'SIEMBRA',
    descripcion: '',
    fecha: '',
    fechaFin: '',
    estado: 'PENDIENTE',
    observaciones: '',
    parcelaId: '',
    responsableId: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/parcelas').then((r) => r.json()),
      fetch('/api/equipo').then((r) => r.json()),
      fetch('/api/labores').then((r) => r.json()),
    ]).then(([p, u, labores]) => {
      setParcelas((p as Parcela[]).filter((x) => x.activa))
      setUsuarios((u as Usuario[]).filter((x) => x.activo))
      const labor = (labores as { id: number; tipo: string; descripcion: string; fecha: string; fechaFin: string | null; estado: string; observaciones: string | null; parcelaId: number; responsableId: number }[]).find((l) => l.id === parseInt(id as string))
      if (labor) {
        setForm({
          tipo: labor.tipo,
          descripcion: labor.descripcion,
          fecha: toDateInput(labor.fecha),
          fechaFin: toDateInput(labor.fechaFin),
          estado: labor.estado,
          observaciones: labor.observaciones ?? '',
          parcelaId: String(labor.parcelaId),
          responsableId: String(labor.responsableId),
        })
      }
    })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/labores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) router.push('/labores')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta labor?')) return
    await fetch(`/api/labores/${id}`, { method: 'DELETE' })
    router.push('/labores')
  }

  return (
    <div>
      <Header
        title="Editar Labor"
        subtitle="Actualizar información de la labor"
        action={<Link href="/labores" className="btn-secondary">← Volver</Link>}
      />
      <div className="max-w-2xl card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo de labor</label>
              <select className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {LABOR_TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="input" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                {ESTADOS_LABOR.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Descripción</label>
            <input className="input" required value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Parcela</label>
              <select className="input" required value={form.parcelaId} onChange={(e) => setForm({ ...form, parcelaId: e.target.value })}>
                {parcelas.map((p) => <option key={p.id} value={p.id}>{p.nombre} ({p.cultivo})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Responsable</label>
              <select className="input" required value={form.responsableId} onChange={(e) => setForm({ ...form, responsableId: e.target.value })}>
                {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha de inicio</label>
              <input className="input" type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </div>
            <div>
              <label className="label">Fecha de fin</label>
              <input className="input" type="date" value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Observaciones</label>
            <textarea className="input" rows={3} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Guardando…' : 'Guardar Cambios'}</button>
            <Link href="/labores" className="btn-secondary">Cancelar</Link>
            <button type="button" onClick={handleDelete} className="btn-danger ml-auto">Eliminar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
