'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'

interface Empresa { id: number; razonSocial: string }
interface Mensaje {
  id: number
  telefono: string
  nombreContacto: string | null
  texto: string
  leido: boolean
  fecha: string
  empresa: Empresa | null
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function MensajesPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [cargando, setCargando] = useState(true)

  const fetchMensajes = () => {
    fetch('/api/mensajes-whatsapp')
      .then((r) => r.json())
      .then((data) => { setMensajes(data); setCargando(false) })
  }

  useEffect(() => { fetchMensajes() }, [])

  const marcarLeido = async (id: number, leido: boolean) => {
    setMensajes((prev) => prev.map((m) => (m.id === id ? { ...m, leido } : m)))
    await fetch(`/api/mensajes-whatsapp/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leido }),
    })
  }

  const noLeidos = mensajes.filter((m) => !m.leido).length

  return (
    <div>
      <Header
        title="Mensajes de WhatsApp"
        subtitle="Respuestas de los productores al número de la plataforma — no llegan al WhatsApp personal, quedan acá"
      />

      {cargando ? (
        <div className="card text-center py-8 text-gray-400 text-sm">Cargando…</div>
      ) : mensajes.length === 0 ? (
        <div className="card text-center py-8 text-gray-400 text-sm">Aún no hay mensajes recibidos</div>
      ) : (
        <>
          {noLeidos > 0 && (
            <p className="text-sm text-gray-500 mb-3">{noLeidos} mensaje{noLeidos !== 1 ? 's' : ''} sin leer</p>
          )}
          <div className="space-y-2">
            {mensajes.map((m) => (
              <div
                key={m.id}
                className={`card py-3 px-4 ${!m.leido ? 'border-l-4 border-l-primary-500 bg-primary-50/30' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm">
                        {m.nombreContacto || m.empresa?.razonSocial || m.telefono}
                      </p>
                      {m.empresa && m.nombreContacto && (
                        <span className="text-xs text-gray-400">· {m.empresa.razonSocial}</span>
                      )}
                      <span className="text-xs text-gray-400">{m.telefono}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{m.texto}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatFecha(m.fecha)}</p>
                  </div>
                  <button
                    onClick={() => marcarLeido(m.id, !m.leido)}
                    className="btn-secondary text-xs py-1 px-2 whitespace-nowrap flex-shrink-0"
                  >
                    {m.leido ? 'Marcar no leído' : 'Marcar leído'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
