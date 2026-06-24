'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { TIPOS_ESTRUCTURA } from '@/lib/constants'

interface Predio { id: number; nombre: string; cultivo: string; activa: boolean }
interface Arbol { id: number; codigo: string; predioId: number }
interface Rama { id: number; codigo: string; arbolId: number }

export default function NuevoConteoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [predios, setPredios] = useState<Predio[]>([])
  const [arboles, setArboles] = useState<Arbol[]>([])
  const [ramas, setRamas] = useState<Rama[]>([])
  const [form, setForm] = useState({
    predioId: '',
    arbolCodigo: '',
    variedad: '',
    ramaCodigo: '',
    longitudCm: '',
    tipoEstructura: 'DARDO',
    cantidad: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
  })

  useEffect(() => {
    fetch('/api/predios').then((r) => r.json()).then((p: Predio[]) => {
      const activos = p.filter((x) => x.activa)
      setPredios(activos)
      if (activos.length) setForm((f) => ({ ...f, predioId: String(activos[0].id) }))
    })
  }, [])

  useEffect(() => {
    if (!form.predioId) { setArboles([]); return }
    fetch(`/api/arboles?predioId=${form.predioId}`).then((r) => r.json()).then(setArboles)
  }, [form.predioId])

  useEffect(() => {
    const arbol = arboles.find((a) => a.codigo === form.arbolCodigo)
    if (!arbol) { setRamas([]); return }
    fetch(`/api/ramas?arbolId=${arbol.id}`).then((r) => r.json()).then(setRamas)
  }, [form.arbolCodigo, arboles])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/conteos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) router.push('/conteos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header
        title="Nuevo Conteo"
        subtitle="Registrar conteo de dardos, carozos u otras estructuras"
        action={<Link href="/conteos" className="btn-secondary">← Volver</Link>}
      />
      <div className="max-w-2xl card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Predio</label>
            <select className="input" required value={form.predioId} onChange={(e) => setForm({ ...form, predioId: e.target.value, arbolCodigo: '', ramaCodigo: '' })}>
              <option value="">Seleccionar predio…</option>
              {predios.map((p) => <option key={p.id} value={p.id}>{p.nombre} ({p.cultivo})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Árbol (código)</label>
              <input
                className="input"
                required
                list="arboles-list"
                value={form.arbolCodigo}
                onChange={(e) => setForm({ ...form, arbolCodigo: e.target.value, ramaCodigo: '' })}
                placeholder="Ej: A-12"
              />
              <datalist id="arboles-list">
                {arboles.map((a) => <option key={a.id} value={a.codigo} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Variedad (opcional)</label>
              <input className="input" value={form.variedad} onChange={(e) => setForm({ ...form, variedad: e.target.value })} placeholder="Solo si el árbol es nuevo" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Rama (código)</label>
              <input
                className="input"
                required
                list="ramas-list"
                value={form.ramaCodigo}
                onChange={(e) => setForm({ ...form, ramaCodigo: e.target.value })}
                placeholder="Ej: R-1"
              />
              <datalist id="ramas-list">
                {ramas.map((r) => <option key={r.id} value={r.codigo} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Longitud rama en cm (opcional)</label>
              <input className="input" type="number" step="0.1" value={form.longitudCm} onChange={(e) => setForm({ ...form, longitudCm: e.target.value })} placeholder="Solo si la rama es nueva" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo de estructura</label>
              <select className="input" value={form.tipoEstructura} onChange={(e) => setForm({ ...form, tipoEstructura: e.target.value })}>
                {TIPOS_ESTRUCTURA.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Cantidad</label>
              <input className="input" type="number" min="0" required value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Fecha</label>
            <input className="input" type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea className="input" rows={3} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Observaciones adicionales…" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Guardando…' : 'Guardar Conteo'}</button>
            <Link href="/conteos" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
