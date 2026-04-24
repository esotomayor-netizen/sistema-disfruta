'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { TIPOS_PRODUCTO, ESTADOS_APLICACION, UNIDADES } from '@/lib/constants'

interface Parcela { id: number; nombre: string; cultivo: string; activa: boolean }
interface Usuario { id: number; nombre: string; apellido: string; rol: string; activo: boolean }

export default function NuevaAplicacionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [parcelas, setParcelas] = useState<Parcela[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [form, setForm] = useState({
    producto: '',
    tipoProducto: 'FUNGICIDA',
    dosis: '',
    unidad: 'L/ha',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'PENDIENTE',
    observaciones: '',
    parcelaId: '',
    tecnicoId: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/parcelas').then((r) => r.json()),
      fetch('/api/equipo').then((r) => r.json()),
    ]).then(([p, u]) => {
      const pa = (p as Parcela[]).filter((x) => x.activa)
      const ua = (u as Usuario[]).filter((x) => x.activo)
      setParcelas(pa)
      setUsuarios(ua)
      if (pa.length) setForm((f) => ({ ...f, parcelaId: String(pa[0].id) }))
      if (ua.length) setForm((f) => ({ ...f, tecnicoId: String(ua[0].id) }))
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/aplicaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) router.push('/aplicaciones')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header
        title="Nueva Aplicación"
        subtitle="Registrar aplicación de producto agrícola"
        action={<Link href="/aplicaciones" className="btn-secondary">← Volver</Link>}
      />
      <div className="max-w-2xl card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Producto</label>
              <input className="input" required value={form.producto} onChange={(e) => setForm({ ...form, producto: e.target.value })} placeholder="Ej: Mancozeb 80 WP" />
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
              <input className="input" type="number" step="0.01" min="0" required value={form.dosis} onChange={(e) => setForm({ ...form, dosis: e.target.value })} placeholder="0.00" />
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
                <option value="">Seleccionar parcela…</option>
                {parcelas.map((p) => <option key={p.id} value={p.id}>{p.nombre} ({p.cultivo})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Técnico responsable</label>
              <select className="input" required value={form.tecnicoId} onChange={(e) => setForm({ ...form, tecnicoId: e.target.value })}>
                <option value="">Seleccionar técnico…</option>
                {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha de aplicación</label>
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
            <textarea className="input" rows={3} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} placeholder="Notas, condiciones climáticas, equipo usado…" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Guardando…' : 'Guardar Aplicación'}</button>
            <Link href="/aplicaciones" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
