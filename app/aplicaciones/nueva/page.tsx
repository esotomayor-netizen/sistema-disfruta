'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { ESTADOS_APLICACION } from '@/lib/constants'
import { ETAPAS } from '@/lib/programa-data'
import {
  GRUPOS_PRODUCTO,
  PRODUCTOS_SAG,
  getProductosByGrupo,
  type GrupoProducto,
  type ProductoSAG,
} from '@/lib/sag-catalog'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Empresa { id: number; razonSocial: string; predios: Predio[] }
interface Predio {
  id: number
  nombre: string
  cultivo: string
  variedades: string | null
  activa: boolean
  empresa: { id: number; razonSocial: string }
}
interface Usuario { id: number; nombre: string; apellido: string; activo: boolean }

interface ProductoAgregado {
  uid: string
  nombreComercial: string
  ingredienteActivo: string
  tipoProducto: string
  dosis: string
  unidad: string
  tipoDosis: 'por100L' | 'porHectarea' | 'riego'
  fuente: 'SAG' | 'PROGRAMA' | 'MANUAL'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2)
}

function grupoToTipo(grupo: GrupoProducto): string {
  const map: Record<GrupoProducto, string> = {
    FUNGICIDA: 'FUNGICIDA',
    INSECTICIDA: 'INSECTICIDA',
    ACARICIDA: 'ACARICIDA',
    HERBICIDA: 'HERBICIDA',
    FERTILIZANTE_FOLIAR: 'FERTILIZANTE_FOLIAR',
    BIOESTIMULANTE: 'BIOESTIMULANTE',
    OTRO: 'OTRO',
  }
  return map[grupo] ?? 'OTRO'
}

const tipoDosisLabel: Record<string, { label: string; color: string }> = {
  por100L:     { label: 'por 100 L de agua', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  porHectarea: { label: 'por hectárea (ha)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  riego:       { label: 'vía riego',         color: 'bg-sky-50 text-sky-700 border-sky-200' },
}

// ── Subcomponents ──────────────────────────────────────────────────────────────

function DosisTag({ tipo }: { tipo: string }) {
  const info = tipoDosisLabel[tipo] ?? tipoDosisLabel.por100L
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${info.color}`}>
      {tipo === 'por100L' ? '💧' : tipo === 'porHectarea' ? '🌾' : '🚿'} {info.label}
    </span>
  )
}

function ProgramaRecomendaciones({
  etapaId,
  onUsar,
}: {
  etapaId: string
  onUsar: (p: ProductoAgregado) => void
}) {
  const etapa = ETAPAS.find((e) => e.id === etapaId)
  if (!etapa) return null

  return (
    <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-3">
        Recomendaciones del Programa — {etapa.etapa}
      </p>
      <div className="space-y-2">
        {etapa.productos.map((p, i) => (
          <div key={i} className="bg-white border border-amber-100 rounded-lg p-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                    p.caracter === 'FIJA'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {p.caracter}
                </span>
                <span className="text-xs text-gray-500">{p.tratamiento}</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{p.producto}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {p.ingredienteActivo} · {p.concentracion} · Dosis/ha: <strong>{p.dosisHa}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onUsar({
                  uid: uid(),
                  nombreComercial: p.producto,
                  ingredienteActivo: p.ingredienteActivo,
                  tipoProducto: 'OTRO',
                  dosis: p.dosisHa.replace(/[^\d,.]/g, '').replace(',', '.') || '0',
                  unidad: p.mojamiento.includes('l/ha') ? 'L/ha' : 'L/ha',
                  tipoDosis: 'porHectarea',
                  fuente: 'PROGRAMA',
                })
              }
              className="flex-shrink-0 text-xs bg-primary-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Usar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NuevaAplicacionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  // Context selectors
  const [empresaId, setEmpresaId] = useState('')
  const [predioId, setPredioId] = useState('')
  const [variedad, setVariedad] = useState('')
  const [etapaId, setEtapaId] = useState('')
  const [tecnicoId, setTecnicoId] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [estado, setEstado] = useState('PENDIENTE')
  const [observaciones, setObservaciones] = useState('')

  // Product list being built
  const [productos, setProductos] = useState<ProductoAgregado[]>([])

  // Loading / error state for context data
  const [cargandoContexto, setCargandoContexto] = useState(true)
  const [errorEmpresas, setErrorEmpresas] = useState<string | null>(null)

  // Product adder state
  const [grupoSel, setGrupoSel] = useState<GrupoProducto>('FUNGICIDA')
  const [productoSagId, setProductoSagId] = useState('')
  const [dosisManual, setDosisManual] = useState('')
  const [unidadManual, setUnidadManual] = useState('cc/100L')
  const [nombreManual, setNombreManual] = useState('')
  const [iaManual, setIaManual] = useState('')
  const [modoManual, setModoManual] = useState(false)

  // Derived
  const prediosFiltrados = empresas.find((e) => String(e.id) === empresaId)?.predios.filter((p) => p.activa) ?? []
  const predio = prediosFiltrados.find((p) => String(p.id) === predioId)
  const variedadesDisponibles = predio?.variedades
    ? predio.variedades.split(',').map((v) => v.trim()).filter(Boolean)
    : []
  const productosSAGFiltrados = getProductosByGrupo(grupoSel)
  const productoSAG = PRODUCTOS_SAG.find((p) => p.id === productoSagId)

  useEffect(() => {
    fetch('/api/empresas')
      .then(async (r) => {
        if (!r.ok) throw new Error(`Error ${r.status} al cargar empresas: ${await r.text()}`)
        return r.json()
      })
      .then((emp) => setEmpresas(emp as Empresa[]))
      .catch((err) => {
        console.error('Error cargando empresas', err)
        setErrorEmpresas(err instanceof Error ? err.message : 'Error al cargar empresas')
      })
      .finally(() => setCargandoContexto(false))

    fetch('/api/equipo')
      .then(async (r) => {
        if (!r.ok) throw new Error(`Error ${r.status} al cargar equipo: ${await r.text()}`)
        return r.json()
      })
      .then((u) => {
        const ua = (u as Usuario[]).filter((x) => x.activo)
        setUsuarios(ua)
        if (ua.length) setTecnicoId(String(ua[0].id))
      })
      .catch((err) => console.error('Error cargando equipo', err))
  }, [])

  // Reset predio when empresa changes
  useEffect(() => {
    setPredioId('')
    setVariedad('')
  }, [empresaId])

  // Reset variedad when predio changes
  useEffect(() => {
    setVariedad('')
  }, [predioId])

  // Reset producto SAG when grupo changes
  useEffect(() => {
    setProductoSagId('')
    setDosisManual('')
  }, [grupoSel])

  // Auto-fill dosis when SAG product selected
  useEffect(() => {
    if (productoSAG) {
      setDosisManual(productoSAG.dosis)
      setUnidadManual(productoSAG.unidad)
    }
  }, [productoSagId])

  function agregarProductoSAG() {
    if (!productoSAG) return
    setProductos((prev) => [
      ...prev,
      {
        uid: uid(),
        nombreComercial: productoSAG.nombreComercial,
        ingredienteActivo: productoSAG.ingredienteActivo,
        tipoProducto: grupoToTipo(productoSAG.grupo),
        dosis: dosisManual || productoSAG.dosis,
        unidad: unidadManual || productoSAG.unidad,
        tipoDosis: productoSAG.tipoDosis,
        fuente: 'SAG',
      },
    ])
    setProductoSagId('')
    setDosisManual('')
  }

  function agregarProductoManual() {
    if (!nombreManual) return
    setProductos((prev) => [
      ...prev,
      {
        uid: uid(),
        nombreComercial: nombreManual,
        ingredienteActivo: iaManual,
        tipoProducto: grupoToTipo(grupoSel),
        dosis: dosisManual,
        unidad: unidadManual,
        tipoDosis: unidadManual.includes('/ha') ? 'porHectarea' : 'por100L',
        fuente: 'MANUAL',
      },
    ])
    setNombreManual('')
    setIaManual('')
    setDosisManual('')
    setModoManual(false)
  }

  function quitarProducto(id: string) {
    setProductos((prev) => prev.filter((p) => p.uid !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!predioId || !tecnicoId || productos.length === 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/aplicaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productos,
          fecha,
          estado,
          observaciones,
          predioId,
          tecnicoId,
        }),
      })
      if (res.ok) router.push('/aplicaciones')
    } finally {
      setLoading(false)
    }
  }

  const grupoInfo = GRUPOS_PRODUCTO.find((g) => g.value === grupoSel)

  return (
    <div>
      <Header
        title="Nueva Aplicación"
        subtitle="Registrar aplicación de productos agrícolas"
        action={<Link href="/aplicaciones" className="btn-secondary">← Volver</Link>}
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">

        {/* ── Sección 1: Contexto del predio ── */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            1. Selección del Predio
          </h2>

          {errorEmpresas && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">No se pudo cargar el listado de empresas</p>
              <p className="text-xs text-red-600 mt-0.5">{errorEmpresas}</p>
            </div>
          )}
          {!errorEmpresas && !cargandoContexto && empresas.length === 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                No hay empresas registradas. <Link href="/empresas/nueva" className="underline font-medium">Crear una empresa</Link> antes de registrar una aplicación.
              </p>
            </div>
          )}
          {cargandoContexto && (
            <p className="text-xs text-gray-400 mb-4">Cargando empresas y equipo técnico…</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Empresa</label>
              <select
                className="input"
                required
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
              >
                <option value="">Seleccionar empresa…</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.razonSocial}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Predio</label>
              <select
                className="input"
                required
                value={predioId}
                onChange={(e) => setPredioId(e.target.value)}
                disabled={!empresaId}
              >
                <option value="">Seleccionar predio…</option>
                {prediosFiltrados.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Especie</label>
              <div className="input bg-gray-50 text-gray-600 flex items-center">
                {predio?.cultivo ?? <span className="text-gray-400">Auto desde predio</span>}
              </div>
            </div>
            <div>
              <label className="label">Variedad</label>
              {variedadesDisponibles.length > 0 ? (
                <select
                  className="input"
                  value={variedad}
                  onChange={(e) => setVariedad(e.target.value)}
                >
                  <option value="">Todas las variedades</option>
                  {variedadesDisponibles.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              ) : (
                <div className="input bg-gray-50 text-gray-400 flex items-center">
                  {predioId ? 'Sin variedades registradas' : 'Seleccione predio primero'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Sección 2: Estado Fenológico + Programa ── */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            2. Estado Fenológico
          </h2>
          <div className="mb-4">
            <label className="label">Estado fenológico actual</label>
            <select
              className="input"
              value={etapaId}
              onChange={(e) => setEtapaId(e.target.value)}
            >
              <option value="">Seleccionar estado…</option>
              {ETAPAS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.etapa} — {e.fecha}
                </option>
              ))}
            </select>
          </div>

          {etapaId && (
            <ProgramaRecomendaciones
              etapaId={etapaId}
              onUsar={(p) => setProductos((prev) => [...prev, p])}
            />
          )}
        </div>

        {/* ── Sección 3: Agregar Productos ── */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            3. Productos a Aplicar
          </h2>

          {/* Lista de productos agregados */}
          {productos.length > 0 && (
            <div className="mb-5 space-y-2">
              {productos.map((p) => {
                const gi = GRUPOS_PRODUCTO.find((g) => g.value === p.tipoProducto)
                return (
                  <div key={p.uid} className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {gi && (
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${gi.color}`}>
                            {gi.label}
                          </span>
                        )}
                        <DosisTag tipo={p.tipoDosis} />
                        {p.fuente === 'PROGRAMA' && (
                          <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                            Programa
                          </span>
                        )}
                        {p.fuente === 'MANUAL' && (
                          <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded">
                            Manual
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{p.nombreComercial}</p>
                      {p.ingredienteActivo && (
                        <p className="text-xs text-gray-500">{p.ingredienteActivo}</p>
                      )}
                      <p className="text-xs text-gray-700 mt-0.5 font-medium">
                        Dosis: {p.dosis} {p.unidad}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => quitarProducto(p.uid)}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                      title="Quitar producto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )
              })}
              <p className="text-xs text-gray-400 pt-1">{productos.length} producto(s) agregado(s)</p>
            </div>
          )}

          {/* Selector de producto */}
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <p className="text-sm font-semibold text-gray-700 mb-3">Agregar producto</p>

            {/* Grupo */}
            <div className="mb-3">
              <label className="label">Grupo de producto (SAG)</label>
              <div className="flex flex-wrap gap-2">
                {GRUPOS_PRODUCTO.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => { setGrupoSel(g.value); setModoManual(false) }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      grupoSel === g.value && !modoManual
                        ? g.color + ' ring-2 ring-offset-1 ring-current'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {!modoManual ? (
              <>
                {/* Producto SAG */}
                <div className="mb-3">
                  <label className="label">
                    Producto registrado SAG
                    <span className={`ml-2 text-xs font-semibold px-1.5 py-0.5 rounded ${grupoInfo?.color ?? ''}`}>
                      {grupoInfo?.label}
                    </span>
                  </label>
                  <select
                    className="input"
                    value={productoSagId}
                    onChange={(e) => setProductoSagId(e.target.value)}
                  >
                    <option value="">Seleccionar producto…</option>
                    {productosSAGFiltrados.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombreComercial} — {p.ingredienteActivo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Detalles del producto SAG seleccionado */}
                {productoSAG && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-semibold text-blue-800 mb-1">Etiqueta SAG</p>
                    <p className="text-sm font-semibold text-gray-900">{productoSAG.nombreComercial}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{productoSAG.ingredienteActivo}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      <span className="font-medium">Uso:</span> {productoSAG.plaga}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Dosis recomendada:</span>
                        <span className="text-sm font-bold text-blue-900">
                          {productoSAG.dosis} {productoSAG.unidad}
                        </span>
                      </div>
                      <DosisTag tipo={productoSAG.tipoDosis} />
                    </div>
                    {productoSAG.carencia && (
                      <p className="text-xs text-orange-700 mt-1">
                        ⏱ Carencia: {productoSAG.carencia}
                      </p>
                    )}
                    {productoSAG.observaciones && (
                      <p className="text-xs text-orange-600 mt-1 italic">⚠ {productoSAG.observaciones}</p>
                    )}
                  </div>
                )}

                {/* Dosis editable */}
                {productoSagId && (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="label">Dosis real a aplicar</label>
                      <input
                        className="input"
                        type="text"
                        value={dosisManual}
                        onChange={(e) => setDosisManual(e.target.value)}
                        placeholder={productoSAG?.dosis ?? ''}
                      />
                    </div>
                    <div>
                      <label className="label">Unidad</label>
                      <input
                        className="input"
                        type="text"
                        value={unidadManual}
                        onChange={(e) => setUnidadManual(e.target.value)}
                        placeholder={productoSAG?.unidad ?? ''}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={agregarProductoSAG}
                    disabled={!productoSagId}
                    className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    + Agregar a la aplicación
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoManual(true)}
                    className="btn-secondary text-sm"
                  >
                    Ingresar manualmente
                  </button>
                </div>
              </>
            ) : (
              /* Modo manual */
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="col-span-2">
                    <label className="label">Nombre del producto</label>
                    <input
                      className="input"
                      type="text"
                      value={nombreManual}
                      onChange={(e) => setNombreManual(e.target.value)}
                      placeholder="Nombre comercial"
                      autoFocus
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Ingrediente activo</label>
                    <input
                      className="input"
                      type="text"
                      value={iaManual}
                      onChange={(e) => setIaManual(e.target.value)}
                      placeholder="Ingrediente activo"
                    />
                  </div>
                  <div>
                    <label className="label">Dosis</label>
                    <input
                      className="input"
                      type="text"
                      value={dosisManual}
                      onChange={(e) => setDosisManual(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="label">Unidad</label>
                    <select
                      className="input"
                      value={unidadManual}
                      onChange={(e) => setUnidadManual(e.target.value)}
                    >
                      <option>cc/100L</option>
                      <option>g/100L</option>
                      <option>mL/100L</option>
                      <option>L/ha</option>
                      <option>kg/ha</option>
                      <option>g/ha</option>
                      <option>L/riego</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={agregarProductoManual}
                    disabled={!nombreManual}
                    className="btn-primary text-sm disabled:opacity-40"
                  >
                    + Agregar manualmente
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoManual(false)}
                    className="btn-secondary text-sm"
                  >
                    ← Usar catálogo SAG
                  </button>
                </div>
              </>
            )}
          </div>

          {productos.length === 0 && (
            <p className="text-xs text-red-500 mt-2">Debe agregar al menos un producto.</p>
          )}
        </div>

        {/* ── Sección 4: Detalles de la Aplicación ── */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            4. Detalles de la Aplicación
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Técnico responsable</label>
              <select
                className="input"
                required
                value={tecnicoId}
                onChange={(e) => setTecnicoId(e.target.value)}
              >
                <option value="">Seleccionar técnico…</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Fecha de aplicación</label>
              <input
                className="input"
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="input" value={estado} onChange={(e) => setEstado(e.target.value)}>
                {ESTADOS_APLICACION.map((est) => (
                  <option key={est.value} value={est.value}>{est.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-full">
              <label className="label">Observaciones</label>
              <textarea
                className="input"
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Condiciones climáticas, equipo de aplicación, notas adicionales…"
              />
            </div>
          </div>
        </div>

        {/* ── Submit ── */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || productos.length === 0 || !predioId || !tecnicoId}
          >
            {loading ? 'Guardando…' : `Guardar Aplicación (${productos.length} producto${productos.length !== 1 ? 's' : ''})`}
          </button>
          <Link href="/aplicaciones" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
