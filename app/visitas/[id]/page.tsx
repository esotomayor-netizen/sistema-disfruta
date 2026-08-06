'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import Link from 'next/link'
import { formatDate, TIPOS_PRODUCTO, UNIDADES, ESTADOS_FENOLOGICOS, LABOR_TIPOS, labelFromValue, tipoProductoColor } from '@/lib/constants'

interface Predio { id: number; nombre: string; csg: string; cultivos: { cultivo: string; variedades: string | null }[]; empresa: { razonSocial: string }; encargado: { nombre: string; apellido: string } | null }
interface Usuario { id: number; nombre: string; apellido: string }
interface Labor { id: number; tipo: string; descripcion: string; observaciones: string | null; dibujo: string | null; fotos: string[]; estado: string; responsable: Usuario }
interface Aplicacion { id: number; producto: string; tipoProducto: string; dosis: number; unidad: string; observaciones: string | null; estado: string; tecnico: Usuario }
interface Visita { id: number; fecha: string; estado: string; observaciones: string | null; checkinLat: number | null; checkinLng: number | null; especie: string | null; variedades: string | null; fotos: string[]; predio: Predio; tecnico: Usuario; labores: Labor[]; aplicaciones: Aplicacion[] }
interface CatalogoItem { id: number; labor: string; categoria: string; descripcion: string; especie: string }
interface ProgramaItem { id: number; producto: string; ingredienteActivo: string | null; dosisHa: string | null; tratamientoObjetivo: string | null; grupo?: string }
interface ProgramaFitoItem { id: number; producto: string; ingredienteActivo: string | null; concentracion: string | null; dosisHa: string | null; tratamientoObjetivo: string | null; observaciones: string | null }

function normalizarCultivo(cultivo: string): string {
  return cultivo
}

function especieDeVisita(visita: Visita): string {
  return visita.especie || visita.predio.cultivos[0]?.cultivo || ''
}

function parseDosisHa(dosisHa: string | null): { dosis: string; unidad: string } {
  if (!dosisHa) return { dosis: '', unidad: 'L/ha' }
  const match = dosisHa.match(/^([\d.]+)\s*(.+)$/)
  if (!match) return { dosis: '', unidad: 'L/ha' }
  const unitMap: Record<string, string> = { g: 'g/ha', cc: 'mL/ha', ml: 'mL/ha', kg: 'kg/ha', l: 'L/ha' }
  return { dosis: match[1], unidad: unitMap[match[2].toLowerCase().trim()] ?? 'L/ha' }
}

function inferTipo(item: ProgramaItem): string {
  if (item.grupo) {
    const grupoMap: Record<string, string> = {
      FUNGICIDA: 'FUNGICIDA', INSECTICIDA: 'INSECTICIDA', ACARICIDA: 'ACARICIDA',
      HERBICIDA: 'HERBICIDA', FERTILIZANTE_FOLIAR: 'FERTILIZANTE_FOLIAR',
      BIOESTIMULANTE: 'BIOESTIMULANTE', OTRO: 'OTRO',
    }
    return grupoMap[item.grupo] ?? 'OTRO'
  }
  const t = (item.tratamientoObjetivo ?? '').toLowerCase()
  if (['pulgon', 'mosca', 'trips', 'drosophila'].some((k) => t.includes(k))) return 'INSECTICIDA'
  if (['monilia', 'oidio', 'botrytis', 'pudricion', 'chancro', 'bacteriano'].some((k) => t.includes(k))) return 'FUNGICIDA'
  return 'OTRO'
}

export default function VisitaDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const puedeEliminarVisita = (session?.user as any)?.email === 'e.sotomayor@exportadoradisfruta.cl'
  const [visita, setVisita] = useState<Visita | null>(null)
  const [eliminandoVisita, setEliminandoVisita] = useState(false)
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([])
  const [programa, setPrograma] = useState<ProgramaItem[]>([])
  const [modal, setModal] = useState<'labor' | 'aplicacion' | null>(null)
  const [saving, setSaving] = useState(false)
  const [laborSeleccionada, setLaborSeleccionada] = useState<CatalogoItem | null>(null)
  const [descripcionEditable, setDescripcionEditable] = useState('')
  const [refinando, setRefinando] = useState(false)
  const [bosquejo, setBosquejo] = useState<string | null>(null)
  const [generandoBosquejo, setGenerandoBosquejo] = useState(false)
  const [busquedaLabor, setBusquedaLabor] = useState('')
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProgramaItem | null>(null)
  const [dosisOverride, setDosisOverride] = useState('')
  const [unidadOverride, setUnidadOverride] = useState('L/ha')
  const [tipoOverride, setTipoOverride] = useState('FUNGICIDA')
  const [modoEdicion, setModoEdicion] = useState(false)
  const [fotosNuevas, setFotosNuevas] = useState<string[]>([])
  const [observacionesEdit, setObservacionesEdit] = useState('')
  const [guardandoObs, setGuardandoObs] = useState(false)
  const [refinandoObs, setRefinandoObs] = useState(false)
  const [estadoFenologico, setEstadoFenologico] = useState('')
  const [programaFito, setProgramaFito] = useState<ProgramaFitoItem[]>([])
  const [mostrarManual, setMostrarManual] = useState(false)
  const [manualProducto, setManualProducto] = useState('')
  const [manualDosis, setManualDosis] = useState('')
  const [manualUnidad, setManualUnidad] = useState('L/ha')
  const [manualTipo, setManualTipo] = useState('OTRO')
  const [manualObjetivo, setManualObjetivo] = useState('')
  const [mostrarManualLabor, setMostrarManualLabor] = useState(false)
  const [manualLaborTipo, setManualLaborTipo] = useState('MANTENIMIENTO')
  const [manualLaborDescripcion, setManualLaborDescripcion] = useState('')
  const [manualLaborDetalle, setManualLaborDetalle] = useState('')
  const [imagenesVisita, setImagenesVisita] = useState<(string | null)[]>([null, null, null, null])
  const [guardandoImagenes, setGuardandoImagenes] = useState(false)

  const fetchVisita = useCallback(() => {
    fetch(`/api/visitas/${id}`).then((r) => r.json()).then((v) => {
      setVisita(v)
      setObservacionesEdit(v.observaciones ?? '')
      const fotos = (v.fotos ?? []) as string[]
      setImagenesVisita([0, 1, 2, 3].map((i) => fotos[i] ?? null))
    })
  }, [id])

  useEffect(() => {
    fetchVisita()
    fetch('/api/catalogo').then((r) => r.json()).then(setCatalogo)
    fetch('/api/productos-visita').then((r) => r.json()).then(setPrograma)
  }, [fetchVisita])

  useEffect(() => {
    if (!estadoFenologico || !visita) { setProgramaFito([]); return }
    fetch(`/api/programa?cultivo=${encodeURIComponent(especieDeVisita(visita))}&estadoFenologico=${encodeURIComponent(estadoFenologico)}`)
      .then((r) => r.json())
      .then(setProgramaFito)
  }, [estadoFenologico, visita])

  const laboresDisponibles = visita
    ? catalogo
        .filter((c) => c.especie === normalizarCultivo(especieDeVisita(visita)))
        .reduce<CatalogoItem[]>((acc, c) => {
          if (!acc.find((x) => x.labor === c.labor)) acc.push(c)
          return acc
        }, [])
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

  const productosFiltrados = busquedaProducto.trim()
    ? productosUnicos.filter((p) =>
        p.producto.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        (p.ingredienteActivo ?? '').toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        (p.tratamientoObjetivo ?? '').toLowerCase().includes(busquedaProducto.toLowerCase())
      )
    : productosUnicos

  const handleSelectProducto = (productoNombre: string) => {
    const item = programa.find((p) => p.producto === productoNombre)
    if (!item) return
    setProductoSeleccionado(item)
    const { dosis, unidad } = parseDosisHa(item.dosisHa)
    setDosisOverride(dosis)
    setUnidadOverride(unidad)
    setTipoOverride(inferTipo(item))
  }

  const handleSeleccionarLabor = (item: CatalogoItem) => {
    setLaborSeleccionada(item)
    setDescripcionEditable(item.descripcion)
    setBosquejo(null)
  }

  const handleGenerarBosquejo = async () => {
    if (!laborSeleccionada) return
    setGenerandoBosquejo(true)
    const res = await fetch('/api/ia/bosquejo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        labor: laborSeleccionada.labor,
        categoria: laborSeleccionada.categoria,
        descripcion: descripcionEditable,
      }),
    })
    const data = await res.json()
    if (data.svg) setBosquejo(data.svg)
    setGenerandoBosquejo(false)
  }

  const handleRefinarDescripcion = async () => {
    if (!laborSeleccionada) return
    setRefinando(true)
    const res = await fetch('/api/ia/refinar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        labor: laborSeleccionada.labor,
        categoria: laborSeleccionada.categoria,
        descripcion: descripcionEditable,
      }),
    })
    const data = await res.json()
    if (data.descripcion) setDescripcionEditable(data.descripcion)
    setRefinando(false)
  }

  const handleAgregarLabor = async () => {
    if (!laborSeleccionada || !visita) return
    setSaving(true)
    await fetch('/api/labores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: (() => {
          const c = laborSeleccionada.categoria.toLowerCase()
          if (c.includes('cosecha')) return 'COSECHA'
          if (c.includes('poda')) return 'PODA'
          if (c.includes('riego')) return 'RIEGO'
          if (c.includes('raleo')) return 'RALEO'
          if (c.includes('monitoreo')) return 'MONITOREO'
          if (c.includes('sanidad') || c.includes('plaga') || c.includes('enfermedad')) return 'CONTROL_PLAGAS'
          if (c.includes('formac') || c.includes('ortopedia') || c.includes('tutoraje')) return 'FORMACION'
          if (c.includes('plantac') || c.includes('infraestructura') || c.includes('preparac')) return 'ESTABLECIMIENTO'
          if (c.includes('nutri') || c.includes('suelo') || c.includes('maleza') || c.includes('fertiliz')) return 'FERTILIZACION'
          if (c.includes('fruto') || c.includes('florac') || c.includes('cuaje') || c.includes('calibre')) return 'MANEJO_FRUTO'
          return 'MANTENIMIENTO'
        })(),
        descripcion: `${laborSeleccionada.labor} — ${especieDeVisita(visita)}`,
        fecha: visita.fecha,
        estado: 'COMPLETADA',
        observaciones: descripcionEditable,
        dibujo: bosquejo,
        fotos: fotosNuevas,
        predioId: visita.predio.id,
        responsableId: visita.tecnico.id,
        visitaId: visita.id,
      }),
    })
    setSaving(false)
    setModal(null)
    setLaborSeleccionada(null)
    setBusquedaLabor('')
    setBosquejo(null)
    setFotosNuevas([])
    fetchVisita()
  }

  const handleAgregarFotos = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') setFotosNuevas((prev) => [...prev, result])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleEliminarFotoNueva = (index: number) => {
    setFotosNuevas((prev) => prev.filter((_, i) => i !== index))
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

  const handleAgregarProductoPrograma = async (item: ProgramaFitoItem) => {
    if (!visita) return
    const { dosis, unidad } = parseDosisHa(item.dosisHa)
    setSaving(true)
    await fetch('/api/aplicaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        producto: item.producto,
        tipoProducto: inferTipo({ id: item.id, producto: item.producto, ingredienteActivo: item.ingredienteActivo, dosisHa: item.dosisHa, tratamientoObjetivo: item.tratamientoObjetivo }),
        dosis: dosis || '0',
        unidad,
        fecha: visita.fecha,
        estado: 'COMPLETADA',
        observaciones: item.tratamientoObjetivo,
        predioId: visita.predio.id,
        tecnicoId: visita.tecnico.id,
        visitaId: visita.id,
      }),
    })
    setSaving(false)
    fetchVisita()
  }

  const handleAgregarProductoManual = async () => {
    if (!visita || !manualProducto.trim()) return
    setSaving(true)
    await fetch('/api/aplicaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        producto: manualProducto.trim(),
        tipoProducto: manualTipo,
        dosis: manualDosis || '0',
        unidad: manualUnidad,
        fecha: visita.fecha,
        estado: 'COMPLETADA',
        observaciones: manualObjetivo ? `${manualObjetivo} (agregado manualmente)` : 'Agregado manualmente',
        predioId: visita.predio.id,
        tecnicoId: visita.tecnico.id,
        visitaId: visita.id,
      }),
    })
    setSaving(false)
    setManualProducto('')
    setManualDosis('')
    setManualUnidad('L/ha')
    setManualTipo('OTRO')
    setManualObjetivo('')
    setMostrarManual(false)
    fetchVisita()
  }

  const handleImagenChange = (index: number, files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        setImagenesVisita((prev) => prev.map((img, i) => (i === index ? result : img)))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleEliminarImagen = (index: number) => {
    setImagenesVisita((prev) => prev.map((img, i) => (i === index ? null : img)))
  }

  const handleGuardarImagenes = async () => {
    if (!visita) return
    setGuardandoImagenes(true)
    await fetch(`/api/visitas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado: visita.estado,
        observaciones: visita.observaciones,
        fotos: imagenesVisita.filter((img): img is string => !!img),
      }),
    })
    setGuardandoImagenes(false)
    fetchVisita()
  }

  const handleAgregarLaborManual = async () => {
    if (!visita || !manualLaborDescripcion.trim()) return
    setSaving(true)
    await fetch('/api/labores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: manualLaborTipo,
        descripcion: manualLaborDescripcion.trim(),
        fecha: visita.fecha,
        estado: 'COMPLETADA',
        observaciones: manualLaborDetalle.trim() || null,
        fotos: fotosNuevas,
        predioId: visita.predio.id,
        responsableId: visita.tecnico.id,
        visitaId: visita.id,
      }),
    })
    setSaving(false)
    setModal(null)
    setManualLaborTipo('MANTENIMIENTO')
    setManualLaborDescripcion('')
    setManualLaborDetalle('')
    setMostrarManualLabor(false)
    setFotosNuevas([])
    fetchVisita()
  }

  const handleGuardarObservaciones = async () => {
    if (!visita) return
    setGuardandoObs(true)
    await fetch(`/api/visitas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: visita.estado, observaciones: observacionesEdit }),
    })
    setGuardandoObs(false)
    fetchVisita()
  }

  const handleRefinarObservaciones = async () => {
    if (!visita || !observacionesEdit.trim()) return
    setRefinandoObs(true)
    const res = await fetch('/api/ia/refinar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        labor: 'Observaciones generales de visita técnica',
        categoria: visita.predio.nombre,
        descripcion: observacionesEdit,
      }),
    })
    const data = await res.json()
    if (data.descripcion) setObservacionesEdit(data.descripcion)
    setRefinandoObs(false)
  }

  const handleEliminarLabor = async (laborId: number) => {
    await fetch(`/api/labores/${laborId}`, { method: 'DELETE' })
    fetchVisita()
  }

  const handleEliminarAplicacion = async (aplicacionId: number) => {
    await fetch(`/api/aplicaciones/${aplicacionId}`, { method: 'DELETE' })
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

  const handleEliminarVisita = async () => {
    if (!confirm('¿Eliminar esta visita? Se eliminarán también sus labores, aplicaciones e informes asociados. Esta acción no se puede deshacer.')) return
    setEliminandoVisita(true)
    const res = await fetch(`/api/visitas/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/visitas')
    } else {
      setEliminandoVisita(false)
      alert('No se pudo eliminar la visita.')
    }
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
            <button
              onClick={() => setModoEdicion(!modoEdicion)}
              className={`btn-secondary flex items-center gap-1.5 ${modoEdicion ? 'ring-2 ring-red-300 text-red-600' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {modoEdicion ? 'Salir de edición' : 'Editar visita'}
            </button>
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
            {puedeEliminarVisita && (
              <button
                onClick={handleEliminarVisita}
                disabled={eliminandoVisita}
                className="btn-secondary flex items-center gap-1.5 text-red-600 hover:bg-red-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {eliminandoVisita ? 'Eliminando…' : 'Eliminar visita'}
              </button>
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
            <p className="text-gray-400 text-xs mb-1">Cultivos del predio</p>
            <p className="text-gray-900">{visita.predio.cultivos.map((c) => c.cultivo).join(', ') || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Variedades de la visita</p>
            <p className="text-gray-900">
              {visita.variedades || visita.predio.cultivos.find((c) => c.cultivo === especieDeVisita(visita))?.variedades || '—'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-gray-400 text-xs mb-1">Especie (visita)</p>
            <p className="text-gray-900">{especieDeVisita(visita)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Check-in GPS</p>
            {visita.checkinLat != null && visita.checkinLng != null ? (
              <a
                className="text-primary-600 underline"
                href={`https://www.google.com/maps?q=${visita.checkinLat},${visita.checkinLng}`}
                target="_blank"
                rel="noreferrer"
              >
                {visita.checkinLat.toFixed(5)}, {visita.checkinLng.toFixed(5)} ↗
              </a>
            ) : (
              <p className="text-gray-400">Sin registro</p>
            )}
          </div>
        </div>
        {visita.estado === 'COMPLETADA' && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="badge bg-green-100 text-green-800">Visita completada</span>
          </div>
        )}
      </div>

      {/* Observaciones */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-800">Observaciones</h2>
          <button
            onClick={handleRefinarObservaciones}
            disabled={refinandoObs || !observacionesEdit.trim()}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium disabled:opacity-40"
          >
            {refinandoObs ? (
              <span className="animate-pulse">Mejorando…</span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Mejorar con IA
              </>
            )}
          </button>
        </div>
        <textarea
          className="input"
          rows={4}
          value={observacionesEdit}
          onChange={(e) => setObservacionesEdit(e.target.value)}
          placeholder="Observaciones generales de la visita…"
        />
        <div className="flex justify-end mt-2">
          <button onClick={handleGuardarObservaciones} disabled={guardandoObs} className="btn-secondary text-xs py-1.5 px-3">
            {guardandoObs ? 'Guardando…' : 'Guardar observaciones'}
          </button>
        </div>
      </div>

      {/* Imágenes generales de la visita (independiente de labores) */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Imágenes</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {imagenesVisita.map((img, i) => (
            <div key={i} className="aspect-square">
              {img ? (
                <div className="relative w-full h-full">
                  <img src={img} className="w-full h-full object-cover rounded-lg border border-gray-200" alt={`Imagen ${i + 1}`} />
                  <button
                    type="button"
                    onClick={() => handleEliminarImagen(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full rounded-lg border-2 border-dashed border-gray-200 text-gray-400 hover:border-primary-300 hover:text-primary-500 cursor-pointer transition-colors">
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs">Foto {i + 1}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImagenChange(i, e.target.files)}
                  />
                </label>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={handleGuardarImagenes} disabled={guardandoImagenes} className="btn-secondary text-xs py-1.5 px-3">
            {guardandoImagenes ? 'Guardando…' : 'Guardar imágenes'}
          </button>
        </div>
      </div>

      {/* Banner modo edición */}
      {modoEdicion && (
        <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span><strong>Modo edición activo</strong> — haz clic en el icono de papelera para eliminar una labor o aplicación. Esta acción no se puede deshacer.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Labores */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Labores ({visita.labores.length})</h2>
            {(visita.estado === 'EN_PROGRESO' || modoEdicion) && (
              <button onClick={() => { setModal('labor'); setBusquedaLabor(''); setLaborSeleccionada(null); setBosquejo(null); setFotosNuevas([]); setMostrarManualLabor(false); setManualLaborDescripcion(''); setManualLaborDetalle('') }} className="btn-primary text-xs py-1.5 px-3">+ Agregar labor</button>
            )}
          </div>
          <div className="space-y-2">
            {visita.labores.length === 0 && (
              <div className="card text-center py-8 text-gray-400 text-sm">No hay labores aún</div>
            )}
            {visita.labores.map((l) => (
              <div key={l.id} className={`card py-3 px-4 transition-colors ${modoEdicion ? 'border-red-100 hover:border-red-300' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{l.descripcion}</p>
                    {l.observaciones && (
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{l.observaciones}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{l.tipo} · {l.responsable.nombre} {l.responsable.apellido}</p>
                  </div>
                  {modoEdicion && (
                    <button
                      onClick={() => handleEliminarLabor(l.id)}
                      className="flex-shrink-0 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar labor"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                {l.dibujo && (
                  <div className="mt-2 border border-purple-100 rounded-lg overflow-hidden">
                    <div className="px-2 py-1 bg-purple-50 text-xs text-purple-600 font-medium">Bosquejo técnico</div>
                    <div className="p-1" dangerouslySetInnerHTML={{ __html: l.dibujo }} />
                  </div>
                )}
                {l.fotos && l.fotos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {l.fotos.map((src, i) => (
                      <img key={i} src={src} className="w-16 h-16 object-cover rounded-lg border border-gray-200" alt="Foto de la labor" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Aplicaciones */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Aplicaciones ({visita.aplicaciones.length})</h2>
            {(visita.estado === 'EN_PROGRESO' || modoEdicion) && (
              <button onClick={() => { setModal('aplicacion'); setProductoSeleccionado(null); setDosisOverride(''); setBusquedaProducto(''); setEstadoFenologico(''); setMostrarManual(false); }} className="btn-primary text-xs py-1.5 px-3">+ Agregar aplicación</button>
            )}
          </div>
          <div className="space-y-2">
            {visita.aplicaciones.length === 0 && (
              <div className="card text-center py-8 text-gray-400 text-sm">No hay aplicaciones aún</div>
            )}
            {visita.aplicaciones.map((a) => (
              <div key={a.id} className={`card py-3 px-4 transition-colors ${modoEdicion ? 'border-red-100 hover:border-red-300' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm">{a.producto}</p>
                      <span className={`badge text-xs ${tipoProductoColor(a.tipoProducto)}`}>{labelFromValue(TIPOS_PRODUCTO, a.tipoProducto)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{a.dosis} {a.unidad}</p>
                    {a.observaciones && (
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">Objetivo: {a.observaciones}</p>
                    )}
                  </div>
                  {modoEdicion && (
                    <button
                      onClick={() => handleEliminarAplicacion(a.id)}
                      className="flex-shrink-0 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar aplicación"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
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

            <div className="overflow-y-auto px-4 pb-2 space-y-2" style={{ maxHeight: laborSeleccionada ? 200 : 340 }}>
              {laboresFiltradas.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  {busquedaLabor ? `Sin resultados para "${busquedaLabor}"` : `No hay labores en el catálogo para ${especieDeVisita(visita)}`}
                </p>
              )}
              {laboresFiltradas.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSeleccionarLabor(item)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${laborSeleccionada?.id === item.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
                >
                  <p className="font-medium text-sm text-gray-900">{item.labor}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.categoria}</p>
                  {!laborSeleccionada && item.descripcion && (
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.descripcion}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Descripción editable + IA + Bosquejo */}
            {laborSeleccionada && (
              <div className="px-4 pb-2 border-t border-gray-100 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="label mb-0">Detalle de la labor</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleRefinarDescripcion}
                      disabled={refinando}
                      className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium disabled:opacity-50"
                    >
                      {refinando ? (
                        <span className="animate-pulse">Refinando…</span>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Mejorar con IA
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleGenerarBosquejo}
                      disabled={generandoBosquejo}
                      className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium disabled:opacity-50"
                    >
                      {generandoBosquejo ? (
                        <span className="animate-pulse">Generando…</span>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          {bosquejo ? 'Regenerar bosquejo' : 'Generar bosquejo'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  className="input text-sm leading-relaxed"
                  rows={3}
                  value={descripcionEditable}
                  onChange={(e) => setDescripcionEditable(e.target.value)}
                  placeholder="Describe el detalle de esta labor…"
                />
                {bosquejo && (
                  <div className="border border-purple-200 rounded-lg overflow-hidden bg-white">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-purple-50 border-b border-purple-100">
                      <span className="text-xs text-purple-700 font-medium">Bosquejo técnico generado</span>
                      <button onClick={() => setBosquejo(null)} className="text-purple-400 hover:text-purple-600 text-xs">✕ quitar</button>
                    </div>
                    <div
                      className="p-2"
                      dangerouslySetInnerHTML={{ __html: bosquejo }}
                    />
                  </div>
                )}

                <div>
                  <label className="label">Fotos adjuntas</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleAgregarFotos(e.target.files)}
                    className="input text-sm"
                  />
                  {fotosNuevas.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {fotosNuevas.map((src, i) => (
                        <div key={i} className="relative">
                          <img src={src} className="w-16 h-16 object-cover rounded-lg border border-gray-200" alt="Foto adjunta" />
                          <button
                            type="button"
                            onClick={() => handleEliminarFotoNueva(i)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Agregar labor manualmente */}
            <div className="px-4 pb-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => setMostrarManualLabor(!mostrarManualLabor)}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
              >
                {mostrarManualLabor ? '− Ocultar' : '+ Agregar labor manualmente (no está en el catálogo)'}
              </button>
              {mostrarManualLabor && (
                <div className="mt-2 space-y-2">
                  <select className="input" value={manualLaborTipo} onChange={(e) => setManualLaborTipo(e.target.value)}>
                    {LABOR_TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input
                    className="input"
                    type="text"
                    placeholder="Nombre de la labor"
                    value={manualLaborDescripcion}
                    onChange={(e) => setManualLaborDescripcion(e.target.value)}
                  />
                  <textarea
                    className="input text-sm"
                    rows={2}
                    placeholder="Detalle / observaciones (opcional)"
                    value={manualLaborDetalle}
                    onChange={(e) => setManualLaborDetalle(e.target.value)}
                  />
                  <div>
                    <label className="label">Fotos (opcional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleAgregarFotos(e.target.files)}
                      className="input text-sm"
                    />
                    {fotosNuevas.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {fotosNuevas.map((src, i) => (
                          <div key={i} className="relative">
                            <img src={src} className="w-16 h-16 object-cover rounded-lg border border-gray-200" alt="Foto adjunta" />
                            <button
                              type="button"
                              onClick={() => handleEliminarFotoNueva(i)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={handleAgregarLaborManual} disabled={!manualLaborDescripcion.trim() || saving} className="btn-primary w-full text-sm">
                    {saving ? 'Guardando…' : 'Agregar labor manual'}
                  </button>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={handleAgregarLabor} disabled={!laborSeleccionada || saving} className="btn-primary flex-1">
                {saving ? 'Guardando…' : 'Agregar labor'}
              </button>
              <button onClick={() => { setModal(null); setFotosNuevas([]); setMostrarManualLabor(false) }} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal agregar aplicacion */}
      {modal === 'aplicacion' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Agregar aplicación</h3>
              <button onClick={() => { setModal(null); setEstadoFenologico(''); setMostrarManual(false) }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {/* Estado fenológico + Programa Fitosanitario */}
            <div className="px-4 pt-4 pb-2">
              <label className="label">Estado fenológico</label>
              <select className="input" value={estadoFenologico} onChange={(e) => setEstadoFenologico(e.target.value)}>
                <option value="">Seleccionar estado fenológico…</option>
                {ESTADOS_FENOLOGICOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
              {estadoFenologico && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 font-medium mb-1">Productos del programa fitosanitario para &quot;{estadoFenologico}&quot;</p>
                  {programaFito.length === 0 ? (
                    <p className="text-xs text-gray-400">No hay productos del programa para este estado fenológico. Busca en el catálogo abajo o agrega un producto manualmente.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {programaFito.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 bg-blue-50/40">
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-gray-900">{p.producto}</p>
                            {p.tratamientoObjetivo && <p className="text-xs text-gray-500 italic">{p.tratamientoObjetivo}</p>}
                            {p.dosisHa && <p className="text-xs text-gray-400">Dosis sugerida: {p.dosisHa}</p>}
                          </div>
                          <button onClick={() => handleAgregarProductoPrograma(p)} disabled={saving} className="btn-primary text-xs py-1 px-2.5 flex-shrink-0">
                            + Agregar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Buscador de producto */}
            <div className="px-4 pt-2 pb-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">Catálogo SAG (fuera del programa)</p>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar producto, ingrediente activo u objetivo…"
                  value={busquedaProducto}
                  onChange={(e) => { setBusquedaProducto(e.target.value); setProductoSeleccionado(null) }}
                  className="input pl-9"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''} encontrado{productosFiltrados.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Lista de productos */}
            <div className="overflow-y-auto px-4 pb-2 space-y-1.5" style={{ maxHeight: productoSeleccionado ? 160 : 320 }}>
              {productosFiltrados.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  {busquedaProducto ? `Sin resultados para "${busquedaProducto}"` : 'No hay productos en el programa'}
                </p>
              )}
              {productosFiltrados.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProducto(p.producto)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${productoSeleccionado?.producto === p.producto ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
                >
                  <p className="font-medium text-sm text-gray-900">{p.producto}</p>
                  {p.ingredienteActivo && <p className="text-xs text-gray-400 mt-0.5">{p.ingredienteActivo}</p>}
                  {p.tratamientoObjetivo && <p className="text-xs text-gray-500 mt-0.5 italic">{p.tratamientoObjetivo}</p>}
                </div>
              ))}
            </div>

            {/* Detalle del producto seleccionado */}
            {productoSeleccionado && (
              <div className="px-4 pb-2 space-y-3 border-t border-gray-100 pt-3">
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
              </div>
            )}

            {/* Agregar producto manualmente */}
            <div className="px-4 pb-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => setMostrarManual(!mostrarManual)}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
              >
                {mostrarManual ? '− Ocultar' : '+ Agregar producto manualmente (no está en el listado)'}
              </button>
              {mostrarManual && (
                <div className="mt-2 space-y-2">
                  <input
                    className="input"
                    type="text"
                    placeholder="Nombre del producto"
                    value={manualProducto}
                    onChange={(e) => setManualProducto(e.target.value)}
                  />
                  <input
                    className="input"
                    type="text"
                    placeholder="Objetivo / observación"
                    value={manualObjetivo}
                    onChange={(e) => setManualObjetivo(e.target.value)}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <select className="input" value={manualTipo} onChange={(e) => setManualTipo(e.target.value)}>
                      {TIPOS_PRODUCTO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <input className="input" type="number" step="0.01" placeholder="Dosis" value={manualDosis} onChange={(e) => setManualDosis(e.target.value)} />
                    <select className="input" value={manualUnidad} onChange={(e) => setManualUnidad(e.target.value)}>
                      {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <button onClick={handleAgregarProductoManual} disabled={!manualProducto.trim() || saving} className="btn-primary w-full text-sm">
                    {saving ? 'Guardando…' : 'Agregar producto manual'}
                  </button>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={handleAgregarAplicacion} disabled={!productoSeleccionado || !dosisOverride || saving} className="btn-primary flex-1">
                {saving ? 'Guardando…' : 'Agregar aplicación'}
              </button>
              <button onClick={() => { setModal(null); setEstadoFenologico(''); setMostrarManual(false) }} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
