'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'

interface Predio { id: number; nombre: string; cultivo: string; csg: string; activa: boolean; empresa: { razonSocial: string } }
interface Usuario { id: number; nombre: string; apellido: string }

export default function NuevaVisitaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [predios, setPredios] = useState<Predio[]>([])
  const [tecnicos, setTecnicos] = useState<Usuario[]>([])
  const [form, setForm] = useState({
    predioId: '',
    tecnicoId: '',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/predios').then((r) => r.json()),
      fetch('/api/equipo').then((r) => r.json()),
    ]).then(([p, u]) => {
      const activos = (p as Predio[]).filter((x) => x.activa)
      setPredios(activos)
      setTecnicos(u as Usuario[])
      if (activos.length) setForm((f) => ({ ...f, predioId: String(activos[0].id) }))
      if ((u as Usuario[]).length) setForm((f) => ({ ...f, tecnicoId: String((u as Usuario[])[0].id) }))
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/visitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const visita = await res.json()
        router.push(`/visitas/${visita.id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header
        title="Nueva Visita"
        subtitle="Registrar una visita técnica a un predio"
        action={<Link href="/visitas" className="btn-secondary">← Volver</Link>}
      />
      <div className="max-w-xl card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Predio</label>
            <select
              className="input"
              required
              value={form.predioId}
              onChange={(e) => setForm({ ...form, predioId: e.target.value })}
            >
              <option value="">Seleccionar predio…</option>
              {predios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — {p.empresa.razonSocial} (CSG {p.csg})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Técnico</label>
              <select
                className="input"
                required
                value={form.tecnicoId}
                onChange={(e) => setForm({ ...form, tecnicoId: e.target.value })}
              >
                <option value="">Seleccionar técnico…</option>
                {tecnicos.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Fecha de visita</label>
              <input
                className="input"
                type="date"
                required
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Observaciones iniciales (opcional)</label>
            <textarea
              className="input"
              rows={3}
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              placeholder="Estado general del predio, condiciones climáticas…"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creando…' : 'Crear visita y agregar actividades'}
            </button>
            <Link href="/visitas" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
