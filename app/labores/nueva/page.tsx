'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { LABOR_TIPOS, ESTADOS_LABOR } from '@/lib/constants'

interface Parcela { id: number; nombre: string; cultivo: string }
interface Usuario { id: number; nombre: string; apellido: string; rol: string }

export default function NuevaLaborPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [parcelas, setParcelas] = useState<Parcela[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [form, setForm] = useState({
    tipo: 'SIEMBRA',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
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
    ]).then(([p, u]) => {
      const parcelasActivas = (p as (Parcela & { activa: boolean })[]).filter((x) => x.activa)
      const usuariosActivos = (u as (Usuario & { activo: boolean })[]).filter((x) => x.activo)
      setParcelas(parcelasActivas)
      setUsuarios(usuariosActivos)
      if (parcelasActivas.length) setForm((f) => ({ ...f, parcelaId: String(parcelasActivas[0].id) }))
      if (usuariosActivos.length) setForm((f) => ({ ...f, responsableId: String(usuariosActivos[0].id) }))
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/labores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) router.push('/labores')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header
        title="Nueva Labor"
        subtitle="Registrar una nueva labor agrícola"
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
            <input className="input" required value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej: Poda de formación temporada 2026" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Parcela</label>
              <select className="input" required value={form.parcelaId} onChange={(e) => setForm({ ...form, parcelaId: e.target.value })}>
                <option value="">Seleccionar parcela…</option>
                {parcelas.map((p) => <option key={p.id} value={p.id}>{p.nombre} ({p.cultivo})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Responsable</label>
              <select className="input" required value={form.responsableId} onChange={(e) => setForm({ ...form, responsableId: e.target.value })}>
                <option value="">Seleccionar responsable…</option>
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
              <label className="label">Fecha de fin (opcional)</label>
              <input className="input" type="date" value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Observaciones</label>
            <textarea className="input" rows={3} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} placeholder="Notas adicionales…" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Guardando…' : 'Guardar Labor'}</button>
            <Link href="/labores" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
