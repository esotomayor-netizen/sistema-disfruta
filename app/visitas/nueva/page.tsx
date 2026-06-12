'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { CULTIVOS, VARIEDADES_POR_CULTIVO } from '@/lib/constants'

interface Predio { id: number; nombre: string; cultivo: string; csg: string; activa: boolean; variedades: string | null; empresa: { razonSocial: string } }
interface Usuario { id: number; nombre: string; apellido: string }

function datetimeLocalNow() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

export default function NuevaVisitaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [predios, setPredios] = useState<Predio[]>([])
  const [tecnicos, setTecnicos] = useState<Usuario[]>([])
  const [checkin, setCheckin] = useState<{ lat: number; lng: number } | null>(null)
  const [checkinError, setCheckinError] = useState('')
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false)
  const [form, setForm] = useState({
    predioId: '',
    tecnicoId: '',
    fecha: datetimeLocalNow(),
    especie: '',
    variedades: [] as string[],
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
      if (activos.length) {
        const predio = activos[0]
        setForm((f) => ({
          ...f,
          predioId: String(predio.id),
          especie: predio.cultivo,
          variedades: predio.variedades ? predio.variedades.split(',').map((v) => v.trim()).filter(Boolean) : [],
        }))
      }
      if ((u as Usuario[]).length) setForm((f) => ({ ...f, tecnicoId: String((u as Usuario[])[0].id) }))
    })
  }, [])

  const handlePredioChange = (predioId: string) => {
    const predio = predios.find((p) => String(p.id) === predioId)
    setForm((f) => ({
      ...f,
      predioId,
      especie: predio?.cultivo || f.especie,
      variedades: predio?.variedades ? predio.variedades.split(',').map((v) => v.trim()).filter(Boolean) : [],
    }))
  }

  const toggleVariedad = (v: string) => {
    setForm((f) => ({
      ...f,
      variedades: f.variedades.includes(v) ? f.variedades.filter((x) => x !== v) : [...f.variedades, v],
    }))
  }

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      setCheckinError('Tu dispositivo/navegador no soporta geolocalización.')
      return
    }
    setObteniendoUbicacion(true)
    setCheckinError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCheckin({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setObteniendoUbicacion(false)
      },
      (err) => {
        setCheckinError('No se pudo obtener la ubicación: ' + err.message)
        setObteniendoUbicacion(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const variedadesDisponibles = VARIEDADES_POR_CULTIVO[form.especie] || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/visitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          variedades: form.variedades.join(', '),
          checkinLat: checkin?.lat ?? null,
          checkinLng: checkin?.lng ?? null,
        }),
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
      <div className="max-w-xl card space-y-6">
        {/* Check-in GPS */}
        <div>
          <label className="label">Check-in GPS (llegada al predio)</label>
          {checkin ? (
            <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
              ✅ Ubicación capturada — Lat {checkin.lat.toFixed(6)}, Lng {checkin.lng.toFixed(6)}{' '}
              <a
                className="underline"
                href={`https://www.google.com/maps?q=${checkin.lat},${checkin.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Ver en Maps ↗
              </a>
              <button type="button" onClick={obtenerUbicacion} className="ml-2 text-green-700 underline text-xs">
                Actualizar
              </button>
            </div>
          ) : (
            <button type="button" onClick={obtenerUbicacion} className="btn-secondary" disabled={obteniendoUbicacion}>
              {obteniendoUbicacion ? 'Obteniendo ubicación…' : '📍 Obtener ubicación GPS'}
            </button>
          )}
          {checkinError && <p className="text-xs text-red-600 mt-1">{checkinError}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Predio</label>
            <select
              className="input"
              required
              value={form.predioId}
              onChange={(e) => handlePredioChange(e.target.value)}
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
              <label className="label">Fecha y hora de visita</label>
              <input
                className="input"
                type="datetime-local"
                required
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Especie</label>
              <select
                className="input"
                value={form.especie}
                onChange={(e) => setForm((f) => ({ ...f, especie: e.target.value, variedades: [] }))}
              >
                <option value="">Seleccionar especie…</option>
                {CULTIVOS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Variedad(es)</label>
              {variedadesDisponibles.length === 0 ? (
                <p className="text-xs text-gray-400 pt-2">Selecciona una especie primero.</p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {variedadesDisponibles.map((v) => (
                    <label key={v} className={`text-xs px-2 py-1 rounded-md border cursor-pointer ${form.variedades.includes(v) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={form.variedades.includes(v)}
                        onChange={() => toggleVariedad(v)}
                      />
                      {v}
                    </label>
                  ))}
                </div>
              )}
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
