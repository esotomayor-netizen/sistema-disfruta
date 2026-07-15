'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'

const ESTADOS = [
  { value: 'NUEVO', label: 'Nuevo' },
  { value: 'EN_CONTACTO', label: 'En Contacto' },
  { value: 'INTERESADO', label: 'Interesado' },
  { value: 'CERRADO', label: 'Cerrado' },
]

const estadoColor: Record<string, string> = {
  NUEVO: 'bg-blue-100 text-blue-800',
  EN_CONTACTO: 'bg-yellow-100 text-yellow-800',
  INTERESADO: 'bg-green-100 text-green-800',
  CERRADO: 'bg-gray-100 text-gray-600',
}

type Oportunidad = {
  id: number
  nombre: string
  telefono: string | null
  latitud: number | null
  longitud: number | null
  ubicacion: string | null
  notas: string | null
  estado: string
  createdAt: string
  tecnico: { nombre: string; apellido: string }
}

export default function OportunidadPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [oportunidad, setOportunidad] = useState<Oportunidad | null>(null)
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [latitud, setLatitud] = useState<number | null>(null)
  const [longitud, setLongitud] = useState<number | null>(null)
  const [notas, setNotas] = useState('')
  const [estado, setEstado] = useState('NUEVO')
  const [capturandoGPS, setCapturandoGPS] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/oportunidades/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setOportunidad(data)
        setNombre(data.nombre)
        setTelefono(data.telefono ?? '')
        setUbicacion(data.ubicacion ?? '')
        setLatitud(data.latitud)
        setLongitud(data.longitud)
        setNotas(data.notas ?? '')
        setEstado(data.estado)
      })
      .catch(() => setError('No se pudo cargar la oportunidad'))
  }, [id])

  const handleCapturarGPS = () => {
    if (!navigator.geolocation) { setError('Tu navegador no soporta geolocalización'); return }
    setCapturandoGPS(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLatitud(pos.coords.latitude); setLongitud(pos.coords.longitude); setCapturandoGPS(false) },
      (err) => { setError('No se pudo obtener la ubicación: ' + err.message); setCapturandoGPS(false) },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre es requerido'); return }
    setGuardando(true)
    setError('')
    try {
      const res = await fetch(`/api/oportunidades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), telefono: telefono.trim() || null, latitud, longitud, ubicacion: ubicacion.trim() || null, notas: notas.trim() || null, estado }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      const updated = await res.json()
      setOportunidad(updated)
      setEditando(false)
    } catch {
      setError('No se pudo guardar los cambios')
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async () => {
    if (!confirm('¿Eliminar esta oportunidad? Esta acción no se puede deshacer.')) return
    setEliminando(true)
    try {
      await fetch(`/api/oportunidades/${id}`, { method: 'DELETE' })
      router.push('/oportunidades')
    } catch {
      setError('No se pudo eliminar')
      setEliminando(false)
    }
  }

  if (!oportunidad && !error) {
    return <div className="p-8 text-gray-400">Cargando...</div>
  }

  if (error && !oportunidad) {
    return <div className="p-8 text-red-600">{error}</div>
  }

  return (
    <div>
      <Header
        title={oportunidad!.nombre}
        subtitle="Detalle de oportunidad"
        action={
          <Link href="/oportunidades" className="btn-secondary text-sm">
            ← Volver
          </Link>
        }
      />

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {!editando ? (
        <div className="card max-w-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className={`badge ${estadoColor[oportunidad!.estado] ?? 'bg-gray-100 text-gray-600'}`}>
              {ESTADOS.find((s) => s.value === oportunidad!.estado)?.label ?? oportunidad!.estado}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(oportunidad!.createdAt).toLocaleDateString('es-CL')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Contacto</p>
              <p className="font-medium text-gray-900">{oportunidad!.nombre}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Teléfono</p>
              {oportunidad!.telefono ? (
                <a href={`tel:${oportunidad!.telefono}`} className="text-primary-600 hover:underline font-medium">
                  {oportunidad!.telefono}
                </a>
              ) : <p className="text-gray-400">—</p>}
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Técnico</p>
              <p className="font-medium text-gray-900">{oportunidad!.tecnico.nombre} {oportunidad!.tecnico.apellido}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Ubicación GPS</p>
              {oportunidad!.latitud && oportunidad!.longitud ? (
                <a
                  href={`https://maps.google.com/?q=${oportunidad!.latitud},${oportunidad!.longitud}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline text-sm"
                >
                  Ver en Google Maps ↗
                </a>
              ) : <p className="text-gray-400">—</p>}
            </div>
          </div>

          {oportunidad!.ubicacion && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Descripción de ubicación</p>
              <p className="text-sm text-gray-700">{oportunidad!.ubicacion}</p>
            </div>
          )}

          {oportunidad!.notas && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Notas</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{oportunidad!.notas}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button onClick={() => setEditando(true)} className="btn-primary text-sm">
              Editar
            </button>
            <button onClick={handleEliminar} disabled={eliminando} className="btn-secondary text-sm text-red-600 hover:text-red-700">
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleGuardar} className="card max-w-xl space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del contacto <span className="text-red-500">*</span>
            </label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="input w-full" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="input w-full" placeholder="+56 9 XXXX XXXX" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación GPS</label>
            <button type="button" onClick={handleCapturarGPS} disabled={capturandoGPS} className="btn-secondary flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {capturandoGPS ? 'Obteniendo...' : 'Actualizar GPS'}
            </button>
            {latitud !== null && longitud !== null && (
              <p className="mt-1 text-xs text-green-700">{latitud.toFixed(6)}, {longitud.toFixed(6)}</p>
            )}
            <input type="text" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} className="input w-full mt-2" placeholder="Descripción de ubicación" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select value={estado} onChange={(e) => setEstado(e.target.value)} className="input w-full">
              {ESTADOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="input w-full" rows={3} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={guardando} className="btn-primary">
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={() => setEditando(false)} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
