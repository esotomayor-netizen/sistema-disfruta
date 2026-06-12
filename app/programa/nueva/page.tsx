'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { CULTIVOS, ESTADOS_FENOLOGICOS } from '@/lib/constants'

const CARACTERES = [
  { value: 'FIJA', label: 'Fija (calendario)' },
  { value: 'MOVIL', label: 'Móvil (estado fenológico)' },
  { value: 'PREVENTIVO', label: 'Preventivo' },
  { value: 'CURATIVO', label: 'Curativo' },
  { value: 'ERRADICANTE', label: 'Erradicante' },
]

const TRATAMIENTOS_COMUNES = [
  'Control de Monilia',
  'Control de Botrytis',
  'Control de Oidio',
  'Control de Pudrición parda',
  'Control de Chancro bacteriano',
  'Control de Pulgón verde',
  'Control de Trips',
  'Control de Mosca de la fruta',
  'Control de Drosophila suzukii',
  'Control de Escama de San José',
  'Control de Araña roja',
  'Control de Tortrícidos',
  'Fertilización foliar',
  'Bioestimulante',
  'Regulador de crecimiento',
  'Engrosamiento de fruto',
  'Raleo químico',
  'Adelanto de madurez',
  'Protección post-cosecha',
]

const MOJAMIENTO_OPCIONES = ['300 L/ha', '500 L/ha', '800 L/ha', '1000 L/ha', '1500 L/ha', '2000 L/ha']

const currentYear = new Date().getFullYear()
const TEMPORADAS = [`${currentYear - 1}/${currentYear}`, `${currentYear}/${currentYear + 1}`, `${currentYear + 1}/${currentYear + 2}`]

const emptyForm = {
  temporada: `${currentYear}/${currentYear + 1}`,
  cultivo: '',
  estadoFenologico: '',
  caracterAplicacion: 'PREVENTIVO',
  tratamientoObjetivo: '',
  fechaEstimada: '',
  producto: '',
  ingredienteActivo: '',
  concentracion: '',
  mojamiento: '',
  dosisHa: '',
  observaciones: '',
  productosAlternativos: '',
}

export default function NuevoProgramaPage() {
  const router = useRouter()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [tratamientoCustom, setTratamientoCustom] = useState(false)

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/programa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) router.push('/programa')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Header
        title="Nuevo Producto al Programa"
        subtitle="Agrega un producto al programa fitosanitario"
        action={<Link href="/programa" className="btn-secondary">← Volver</Link>}
      />

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Sección: Contexto */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide text-primary-700">Contexto de aplicación</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Temporada</label>
                <select className="input" value={form.temporada} onChange={(e) => set('temporada', e.target.value)}>
                  {TEMPORADAS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Cultivo</label>
                <select className="input" required value={form.cultivo} onChange={(e) => set('cultivo', e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {CULTIVOS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Estado fenológico</label>
                <select className="input" value={form.estadoFenologico} onChange={(e) => set('estadoFenologico', e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {ESTADOS_FENOLOGICOS.map((ef) => <option key={ef} value={ef}>{ef}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Carácter de aplicación</label>
                <select className="input" required value={form.caracterAplicacion} onChange={(e) => set('caracterAplicacion', e.target.value)}>
                  {CARACTERES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Tratamiento / Objetivo</label>
                <button
                  type="button"
                  onClick={() => { setTratamientoCustom(!tratamientoCustom); set('tratamientoObjetivo', '') }}
                  className="text-xs text-primary-600 hover:text-primary-800"
                >
                  {tratamientoCustom ? '← Usar lista' : '+ Escribir manualmente'}
                </button>
              </div>
              {tratamientoCustom ? (
                <input className="input" value={form.tratamientoObjetivo} onChange={(e) => set('tratamientoObjetivo', e.target.value)} placeholder="Ej: Control de mosca de la fruta en pre-cosecha" />
              ) : (
                <select className="input" value={form.tratamientoObjetivo} onChange={(e) => set('tratamientoObjetivo', e.target.value)}>
                  <option value="">Seleccionar tratamiento…</option>
                  {TRATAMIENTOS_COMUNES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              )}
            </div>

            <div>
              <label className="label">Fecha estimada de aplicación</label>
              <input
                className="input"
                type="text"
                placeholder="Ej: Agosto, Semana 3 post-flor, Plena flor"
                value={form.fechaEstimada}
                required
                onChange={(e) => set('fechaEstimada', e.target.value)}
              />
            </div>
          </div>

          {/* Sección: Producto */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-primary-700">Producto</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre del producto</label>
                <input className="input" required value={form.producto} onChange={(e) => set('producto', e.target.value)} placeholder="Ej: Amistar 50 WG" />
              </div>
              <div>
                <label className="label">Ingrediente activo</label>
                <input className="input" value={form.ingredienteActivo} onChange={(e) => set('ingredienteActivo', e.target.value)} placeholder="Ej: Azoxistrobina 50%" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Concentración</label>
                <input className="input" value={form.concentracion} onChange={(e) => set('concentracion', e.target.value)} placeholder="Ej: 50 WG" />
              </div>
              <div>
                <label className="label">Mojamiento</label>
                <select className="input" value={form.mojamiento} onChange={(e) => set('mojamiento', e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {MOJAMIENTO_OPCIONES.map((m) => <option key={m} value={m}>{m}</option>)}
                  <option value="custom">Otro…</option>
                </select>
                {form.mojamiento === 'custom' && (
                  <input className="input mt-2" placeholder="Ej: 600 L/ha" onChange={(e) => set('mojamiento', e.target.value)} />
                )}
              </div>
              <div>
                <label className="label">Dosis/ha</label>
                <input className="input" value={form.dosisHa} onChange={(e) => set('dosisHa', e.target.value)} placeholder="Ej: 150 g" />
              </div>
            </div>

            <div>
              <label className="label">Productos alternativos</label>
              <input className="input" value={form.productosAlternativos} onChange={(e) => set('productosAlternativos', e.target.value)} placeholder="Ej: Switch 62.5 WG, Teldor 500 SC" />
            </div>

            <div>
              <label className="label">Observaciones</label>
              <textarea className="input" rows={2} value={form.observaciones} onChange={(e) => set('observaciones', e.target.value)} placeholder="Condiciones de aplicación, precauciones, etc." />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Agregar al programa'}
            </button>
            <Link href="/programa" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
