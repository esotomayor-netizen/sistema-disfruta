'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { formatDate, TIPOS_PRODUCTO, UNIDADES, labelFromValue, tipoProductoColor } from '@/lib/constants'

interface Predio { id: number; nombre: string; csg: string; cultivo: string; variedades: string | null; empresa: { razonSocial: string }; encargado: { nombre: string; apellido: string } | null }
interface Usuario { id: number; nombre: string; apellido: string }
interface Labor { id: number; tipo: string; descripcion: string; observaciones: string | null; estado: string; responsable: Usuario }
interface Aplicacion { id: number; producto: string; tipoProducto: string; dosis: number; unidad: string; observaciones: string | null; estado: string; tecnico: Usuario }
interface Visita { id: number; fecha: string; estado: string; observaciones: string | null; predio: Predio; tecnico: Usuario; labores: Labor[]; aplicaciones: Aplicacion[] }
interface CatalogoItem { id: number; labor: string; categoria: string; descripcion: string; especie: string }
interface ProgramaItem { id: number; producto: string; ingredienteActivo: string | null; dosisHa: string | null; tratamientoObjetivo: string | null }

function normalizarCultivo(cultivo: string): string {
  const map: Record<string, string> = { 'Cerezo': 'Cerezos', 'Ciruela': 'Ciruelas', 'Durazno': 'Duraznos', 'Nectarin': 'Nectarines', 'Kiwi': 'Kiwi', 'Uva de mesa': 'Uva de mesa' }
  return map[cultivo] ?? cultivo
}

function parseDosisHa(dosisHa: string | null): { dosis: string; unidad: string } {
  if (!dosisHa) return { dosis: '', unidad: 'L/ha' }
  const match = dosisHa.match(/^([\d.]+)\s*(.+)$/)
  if (!match) return { dosis: '', unidad: 'L/ha' }
  const unitMap: Record<string, string> = { g: 'g/ha', cc: 'mL/ha', ml: 'mL/ha', kg: 'kg/ha', l: 'L/ha' }
  return { dosis: match[1], unidad: unitMap[match[2].toLowerCase().trim()] ?? 'L/ha' }
}

function inferTipo(item: ProgramaItem): string {
  const t = (item.tratamientoObjetivo ?? '').toLowerCase()
  if (['pulgon', 'mosca', 'trips', 'drosophila'].some((k) => t.includes(k))) return 'INSECTICIDA'
  if (['monilia', 'oidio', 'botrytis', 'pudricion', 'chancro', 'bacteriano'].some((k) => t.includes(k))) return 'FUNGICIDA'
  return 'OTRO'
}

export default function VisitaDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [visita, setVisita] = useState<Visita | null>(null)
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([])
  const [programa, setPrograma] = useState<ProgramaItem[]>([])
  const [modal, setModal] = useState<'labor' | 'aplicacion' | null>(null)
  const [saving, setSaving] = useState(false)
  const [laborSeleccionada, setLaborSeleccionada] = useState<CatalogoItem | null>(null)
  const [busquedaLabor, setBusquedaLabor] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProgramaItem | null>(null)
  const [dosisOverride, setDosisOverride] = useState('')
  const [unidadOverride, setUnidadOverride] = useState('L/ha')
  const [tipoOverride, setTipoOverride] = useState('FUNGICIDA')

  const fetchVisita = useCallback(() => {
    fetch(`/api/visitas/${id}`).then((r) => r.json()).then(setVisita)
  }, [id])

  useEffect(() => {
    fetchVisita()
    fetch('/api/catalogo').then((r) => r.json()).then(setCatalogo)
    fetch('/api/programa').then((r) => r.json()).then(setPrograma)
  }, [fetchVisita])

  const laboresDisponibles = visita
    ? catalogo.filter((c) => c.especie === normalizarCultivo(visita.predio.cultivo))
    : []

  const laboresFiltradas = busquedaLabor.trim()
    ? laboresDisponibles.filter((c) =>
        c.labor.toLowerCase().includes(busquedaLabor.toLowerCase()) ||
        c.categoria.toLowerCase().includes(busquedaLabor.toLowerCase()) ||
        c.descripcion.toLowerCase().includes(busquedaLabor.toLowerCase())
      )
    : laboresDisponibles

  const productosUnicos = programa.reduce<ProgramaItem[]>((acc, p) => {
    if (!acc.find((x) => x.producto === p.producto)) acc.push(p)
    return acc
  }, [])

  const handleSelectProducto = (productoNombre: string) => {
    const item = programa.find((p) => p.producto === productoNombre)
    if (!item) return
    setProductoSeleccionado(item)
    const { dosis, unidad } = parseDosisHa(item.dosisHa)
    setDosisOverride(dosis)
    setUnidadOverride(unidad)
    setTipoOverride(inferTipo(item))
  }

  const handleAgregarLabor = async () => {
    if (!laborSeleccionada || !visita) return
    setSaving(true)
    await fetch('/api/labores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: laborSeleccionada.categoria.toLowerCase().includes('poda') ? 'PODA'
          : laborSeleccionada.categoria.toLowerCase().includes('riego') ? 'RIEGO'
          : laborSeleccionada.categoria.toLowerCase().includes('cosecha') ? 'COSECHA'
          : laborSeleccionada.categoria.toLowerCase().includes('nutri') ? 'FERTILIZACION'
          : laborSeleccionada.categoria.toLowerCase().includes('sanidad') ? 'CONTROL_PLAGAS'
          : 'MANTENIMIENTO',
        descripcion: `${laborSeleccionada.labor} — ${visita.predio.cultivo}`,
        fecha: visita.fecha,
        estado: 'COMPLETADA',
        observaciones: laborSeleccionada.descripcion,
        predioId: visita.predio.id,
        responsableId: visita.tecnico.id,
        visitaId: visita.id,
      }),
    })
    setSaving(false)
    setModal(null)
    setLaborSeleccionada(null)
    setBusquedaLabor('')
    fetchVisita()
  }

  const handleAgregarAplicacion = async () => {
    if (!productoSeleccionado || !visita || !dosisOverride) return
    setSaving(true)
    await fetch('/api/aplicaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        producto: productoSeleccionado.producto,
        tipoProducto: tipoOverride,
        dosis: dosisOverride,
        unidad: unidadOverride,
        fecha: visita.fecha,
        estado: 'COMPLETADA',
        observaciones: productoSeleccionado.tratamientoObjetivo,
        predioId: visita.predio.id,
        tecnicoId: visita.tecnico.id,
        visitaId: visita.id,
      }),
    })
    setSaving(false)
    setModal(null)
    setProductoSeleccionado(null)
    fetchVisita()
  }

  const handleCompletar = async () => {
    await fetch(`/api/visitas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'COMPLETADA', observaciones: visita?.observaciones }),
    })
    fetchVisita()
  }

  if (!visita) return <div className="p-8 text-gray-400">Cargando…</div>

  return (
    <div>
      <Header
        title={`Visita — ${visita.predio.nombre}`}
        subtitle={`${formatDate(visita.fecha)} · ${visita.tecnico.nombre} ${visita.tecnico.apellido}`}
        action={
          <div className="flex gap-2">
            <Link href="/visitas" className="btn-secondary">← Visitas</Link>
            {visita.estado === 'COMPLETADA' && (
              <Link href={`/visitas/${id}/imprimir`} target="_blank" className="btn-secondary flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar PDF
              </Link>
            )}
            {visita.estado === 'EN_PROGRESO' && (
              <button onClick={handleCompletar} className="btn-primary">Marcar completada</button>
            )}
          </div>
        }
      />

      {/* Info del predio */}
      <div className="card mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-1">Empresa</p>
            <p className="font-medium text-gray-900">{visita.predio.empresa.razonSocial}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">CSG</p>
            <p className="font-mono text-gray-900">{visita.predio.csg}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Cultivo</p>
            <p className="text-gray-900">{visita.predio.cultivo}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Variedades</p>
            <p className="text-gray-900">{visita.predio.variedades ?? '—'}</p>
          </div>
        </div>
        {visita.estado === 'COMPLETADA' && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="badge bg-green-100 text-green-800">Visita completada</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Labores */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Labores ({visita.labores.length})</h2>
            {visita.estado === 'EN_PROGRESO' && (
              <button onClick={() => { setModal('labor'); setBusquedaLabor(''); setLaborSeleccionada(null) }} className="btn-primary text-xs py-1.5 px-3">+ Agregar labor</button>
            )}
          </div>
          <div className="space-y-2">
            {visita.labores.length === 0 && (
              <div className="card text-center py-8 text-gray-400 text-sm">No hay labores aún</div>
            )}
            {visita.labores.map((l) => (
              <div key={l.id} className="card py-3 px-4">
                <p className="font-medium text-gray-900 text-sm">{l.descripcion}</p>
                {l.observaciones && (
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{l.observaciones}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{l.tipo} · {l.responsable.nombre} {l.responsable.apellido}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Aplicaciones */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Aplicaciones ({visita.aplicaciones.length})</h2>
            {visita.estado === 'EN_PROGRESO' && (
              <button onClick={() => { setModal('aplicacion'); setProductoSeleccionado(null); setDosisOverride(''); }} className="btn-primary text-xs py-1.5 px-3">+ Agregar aplicación</button>
            )}
          </div>
          <div className="space-y-2">
            {visita.aplicaciones.length === 0 && (
              <div className="card text-center py-8 text-gray-400 text-sm">No hay aplicaciones aún</div>
            )}
            {visita.aplicaciones.map((a) => (
              <div key={a.id} className="card py-3 px-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 text-sm">{a.producto}</p>
                  <span className={`badge text-xs ${tipoProductoColor(a.tipoProducto)}`}>{labelFromValue(TIPOS_PRODUCTO, a.tipoProducto)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{a.dosis} {a.unidad}</p>
                {a.observaciones && (
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">Objetivo: {a.observaciones}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal agregar labor */}
      {modal === 'labor' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Agregar labor del catálogo</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {/* Buscador */}
            <div className="px-4 pt-4 pb-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar labor…"
                  value={busquedaLabor}
                  onChange={(e) => setBusquedaLabor(e.target.value)}
                  className="input pl-9"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{laboresFiltradas.length} labor{laboresFiltradas.length !== 1 ? 'es' : ''} encontrada{laboresFiltradas.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-2">
              {laboresFiltradas.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  {busquedaLabor ? `Sin resultados para "${busquedaLabor}"` : `No hay labores en el catálogo para ${visita.predio.cultivo}`}
                </p>
              )}
              {laboresFiltradas.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setLaborSeleccionada(item)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${laborSeleccionada?.id === item.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
                >
                  <p className="font-medium text-sm text-gray-900">{item.labor}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.categoria}</p>
                  {item.descripcion && (
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={handleAgregarLabor} disabled={!laborSeleccionada || saving} className="btn-primary flex-1">
                {saving ? 'Guardando…' : 'Agregar labor'}
              </button>
              <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal agregar aplicacion */}
      {modal === 'aplicacion' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Agregar aplicación</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Producto (Programa Fitosanitario)</label>
                <select
                  className="input"
                  value={productoSeleccionado?.producto ?? ''}
                  onChange={(e) => handleSelectProducto(e.target.value)}
                >
                  <option value="">Seleccionar producto…</option>
                  {productosUnicos.map((p) => (
                    <option key={p.id} value={p.producto}>{p.producto}{p.ingredienteActivo ? ` — ${p.ingredienteActivo}` : ''}</option>
                  ))}
                </select>
              </div>
              {productoSeleccionado && (
                <>
                  {productoSeleccionado.tratamientoObjetivo && (
                    <div className="bg-blue-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-blue-600 font-medium mb-0.5">Objetivo</p>
                      <p className="text-xs text-blue-800">{productoSeleccionado.tratamientoObjetivo}</p>
                    </div>
                  )}
                  <div>
                    <label className="label">Tipo de producto</label>
                    <select className="input" value={tipoOverride} onChange={(e) => setTipoOverride(e.target.value)}>
                      {TIPOS_PRODUCTO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Dosis</label>
                      <input className="input" type="number" step="0.01" value={dosisOverride} onChange={(e) => setDosisOverride(e.target.value)} placeholder="0.00" />
                    </div>
                    <div>
                      <label className="label">Unidad</label>
                      <select className="input" value={unidadOverride} onChange={(e) => setUnidadOverride(e.target.value)}>
                        {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={handleAgregarAplicacion} disabled={!productoSeleccionado || !dosisOverride || saving} className="btn-primary flex-1">
                {saving ? 'Guardando…' : 'Agregar aplicación'}
              </button>
              <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
