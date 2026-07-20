'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import { parseCoordinate } from '@/lib/geo'

const ESTADOS = [
  { value: 'NUEVO', label: 'Nuevo' },
  { value: 'EN_CONTACTO', label: 'En Contacto' },
  { value: 'INTERESADO', label: 'Interesado' },
  { value: 'CERRADO', label: 'Cerrado' },
]

export default function NuevaOportunidadPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [latitud, setLatitud] = useState('')
  const [longitud, setLongitud] = useState('')
  const [notas, setNotas] = useState('')
  const [estado, setEstado] = useState('NUEVO')
  const [capturandoGPS, setCapturandoGPS] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const handleCapturarGPS = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización')
      return
    }
    setCapturandoGPS(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitud(pos.coords.latitude.toFixed(6))
        setLongitud(pos.coords.longitude.toFixed(6))
        setCapturandoGPS(false)
      },
      (err) => {
        setError('No se pudo obtener la ubicación: ' + err.message)
        setCapturandoGPS(false)
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const normalizarCoord = (field: 'latitud' | 'longitud') => {
    const raw = field === 'latitud' ? latitud : longitud
    if (!raw) return
    const parsed = parseCoordinate(raw)
    if (parsed !== null) {
      if (field === 'latitud') setLatitud(String(parsed))
      else setLongitud(String(parsed))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre del contacto es requerido'); return }
    const userId = (session?.user as any)?.id
    if (!userId) { setError('No hay sesión activa'); return }

    setGuardando(true)
    setError('')
    try {
      const res = await fetch('/api/oportunidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          telefono: telefono.trim() || null,
          email: email.trim() || null,
          latitud: latitud ? parseFloat(latitud) : null,
          longitud: longitud ? parseFloat(longitud) : null,
          ubicacion: ubicacion.trim() || null,
          notas: notas.trim() || null,
          estado,
          tecnicoId: userId,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      router.push('/oportunidades')
    } catch {
      setError('No se pudo guardar la oportunidad. Intenta nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <Header
        title="Nueva Oportunidad"
        subtitle="Registrar posible nuevo productor"
      />
      <div className="max-w-xl">
        <form onSubmit={handleSubmit} className="card space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del contacto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="input w-full"
              placeholder="Nombre del productor o contacto"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="input w-full"
                placeholder="+56 9 XXXX XXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email del contacto</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="contacto@empresa.cl"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Coordenadas GPS</label>
              <button type="button" onClick={handleCapturarGPS} disabled={capturandoGPS}
                className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-medium disabled:opacity-50">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {capturandoGPS ? 'Obteniendo…' : 'Capturar desde dispositivo'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="input font-mono text-sm" placeholder={"Latitud (Ej: -34.123456 o 34°47'56\"S)"}
                value={latitud} onChange={(e) => setLatitud(e.target.value)}
                onBlur={() => normalizarCoord('latitud')} />
              <input className="input font-mono text-sm" placeholder={"Longitud (Ej: -70.654321 o 70°39'15\"O)"}
                value={longitud} onChange={(e) => setLongitud(e.target.value)}
                onBlur={() => normalizarCoord('longitud')} />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Puedes pegar el formato del GPS tal cual (grados-minutos-segundos) — se convierte solo a decimal.
            </p>
            {latitud && longitud && (
              <p className="text-xs text-primary-600 mt-1">✓ Coordenadas capturadas — {latitud}, {longitud}</p>
            )}
            <div className="mt-3">
              <input
                type="text"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                className="input w-full"
                placeholder="Descripción de ubicación (ej: Camino a Lo Hernández km 3)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="input w-full"
            >
              {ESTADOS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="input w-full"
              rows={3}
              placeholder="Observaciones, interés mostrado, cultivos, superficie estimada, etc."
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={guardando} className="btn-primary">
              {guardando ? 'Guardando...' : 'Guardar Oportunidad'}
            </button>
            <button type="button" onClick={() => router.push('/oportunidades')} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
