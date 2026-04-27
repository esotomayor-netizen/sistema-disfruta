'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { TIPOS_PRODUCTO, ESTADOS_APLICACION, UNIDADES } from '@/lib/constants'

interface Predio { id: number; nombre: string; cultivo: string; activa: boolean }
interface Usuario { id: number; nombre: string; apellido: string; rol: string; activo: boolean }
interface ProgramaItem {
  id: number
  producto: string
  tratamientoObjetivo: string | null
  dosisHa: string | null
  ingredienteActivo: string | null
}

function parseDosisHa(dosisHa: string | null): { dosis: string; unidad: string } {
  if (!dosisHa) return { dosis: '', unidad: 'L/ha' }
  const match = dosisHa.match(/^([\d.]+)\s*(.+)$/)
  if (!match) return { dosis: '', unidad: 'L/ha' }
  const unitMap: Record<string, string> = { g: 'g/ha', cc: 'mL/ha', ml: 'mL/ha', kg: 'kg/ha', l: 'L/ha', lt: 'L/ha' }
  return { dosis: match[1], unidad: unitMap[match[2].toLowerCase().trim()] ?? 'L/ha' }
}

function inferTipo(item: ProgramaItem): string {
  const t = (item.tratamientoObjetivo ?? '').toLowerCase()
  if (['pulgon', 'mosca', 'trips', 'drosophila', 'tortricides', 'cochinillas'].some((k) => t.includes(k))) return 'INSECTICIDA'
  if (['monilia', 'oidio', 'botrytis', 'pudricion', 'chancro', 'cancro', 'tiro de municion', 'bacteriano', 'pseudomonas', 'limpieza'].some((k) => t.includes(k))) return 'FUNGICIDA'
  return 'OTRO'
}

export default function NuevaAplicacionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [predios, setPredios] = useState<Predio[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [programa, setPrograma] = useState<ProgramaItem[]>([])
  const [productoPersonalizado, setProductoPersonalizado] = useState(false)
  const [form, setForm] = useState({
    producto: '',
    tipoProducto: 'FUNGICIDA',
    dosis: '',
    unidad: 'L/ha',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'PENDIENTE',
    observaciones: '',
    predioId: '',
    tecnicoId: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/predios').then((r) => r.json()),
      fetch('/api/equipo').then((r) => r.json()),
      fetch('/api/programa').then((r) => r.json()),
    ]).then(([p, u, prog]) => {
      const pa = (p as Predio[]).filter((x) => x.activa)
      const ua = (u as Usuario[]).filter((x) => x.activo)
      setPredios(pa)
      setUsuarios(ua)
      setPrograma(prog as ProgramaItem[])
      if (pa.length) setForm((f) => ({ ...f, predioId: String(pa[0].id) }))
      if (ua.length) setForm((f) => ({ ...f, tecnicoId: String(ua[0].id) }))
    })
  }, [])

  // Productos únicos del programa (sin duplicados por nombre)
  const productosUnicos = programa.reduce<ProgramaItem[]>((acc, p) => {
    if (!acc.find((x) => x.producto === p.producto)) acc.push(p)
    return acc
  }, [])

  const handleProductoSelect = (productoNombre: string) => {
    if (productoNombre === '__otro__') {
      setProductoPersonalizado(true)
      setForm((f) => ({ ...f, producto: '' }))
      return
    }
    const item = programa.find((p) => p.producto === productoNombre)
    if (!item) return
    const { dosis, unidad } = parseDosisHa(item.dosisHa)
    setForm((f) => ({
      ...f,
      producto: item.producto,
      tipoProducto: inferTipo(item),
      dosis,
      unidad,
    }))
  }

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
              {productoPersonalizado ? (
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    required
                    value={form.producto}
                    onChange={(e) => setForm({ ...form, producto: e.target.value })}
                    placeholder="Nombre del producto"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="text-xs text-primary-600 underline whitespace-nowrap"
                    onClick={() => { setProductoPersonalizado(false); setForm((f) => ({ ...f, producto: '' })) }}
                  >
                    Usar programa
                  </button>
                </div>
              ) : (
                <select
                  className="input"
                  required
                  value={form.producto}
                  onChange={(e) => handleProductoSelect(e.target.value)}
                >
                  <option value="">Seleccionar producto…</option>
                  {productosUnicos.map((p) => (
                    <option key={p.id} value={p.producto}>
                      {p.producto}{p.ingredienteActivo ? ` — ${p.ingredienteActivo}` : ''}
                    </option>
                  ))}
                  <option value="__otro__">Otro (ingresar manualmente)…</option>
                </select>
              )}
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
              <label className="label">Predio</label>
              <select className="input" required value={form.predioId} onChange={(e) => setForm({ ...form, predioId: e.target.value })}>
                <option value="">Seleccionar predio…</option>
                {predios.map((p) => <option key={p.id} value={p.id}>{p.nombre} ({p.cultivo})</option>)}
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
