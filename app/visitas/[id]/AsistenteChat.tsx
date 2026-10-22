'use client'

import { useState, useRef, useEffect } from 'react'
import { TIPOS_PRODUCTO, UNIDADES, LABOR_TIPOS } from '@/lib/constants'
import { compressImageFile } from '@/lib/image'

interface Mensaje { role: 'user' | 'assistant'; texto: string; fotos?: string[] }
interface BorradorLabor { tipo: string; descripcion: string; observaciones: string }
interface BorradorAplicacion { producto: string; tipoProducto: string; dosis: string; unidad: string; observaciones: string }
interface Borrador { observaciones: string; labores: BorradorLabor[]; aplicaciones: BorradorAplicacion[] }

const BORRADOR_VACIO: Borrador = { observaciones: '', labores: [], aplicaciones: [] }

interface Props {
  visitaId: number
  especie: string
  predioNombre: string
  predioId: number
  tecnicoId: number
  fechaVisita: string
  onGuardado: () => void
}

export default function AsistenteChat({ visitaId, especie, predioNombre, predioId, tecnicoId, fechaVisita, onGuardado }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [borrador, setBorrador] = useState<Borrador>(BORRADOR_VACIO)
  const [textoInput, setTextoInput] = useState('')
  const [fotosAdjuntas, setFotosAdjuntas] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [mensajes])

  const handleAdjuntarFotos = async (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      const result = await compressImageFile(file)
      if (result) setFotosAdjuntas((prev) => [...prev, result])
    }
  }

  const handleEnviar = async () => {
    if (!textoInput.trim() && fotosAdjuntas.length === 0) return
    const nuevoMensaje: Mensaje = { role: 'user', texto: textoInput.trim(), fotos: fotosAdjuntas }
    const historial = [...mensajes, nuevoMensaje]
    setMensajes(historial)
    setTextoInput('')
    setFotosAdjuntas([])
    setEnviando(true)

    const res = await fetch('/api/ia/chat-visita', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ especie, predioNombre, mensajes: historial, borradorActual: borrador }),
    })
    setEnviando(false)

    if (!res.ok) {
      setMensajes((prev) => [...prev, { role: 'assistant', texto: 'Tuve un problema para procesar eso. ¿Puedes intentarlo de nuevo?' }])
      return
    }
    const data = await res.json()
    setMensajes((prev) => [...prev, { role: 'assistant', texto: data.respuesta }])
    setBorrador(data.borrador)
  }

  const actualizarLabor = (i: number, campo: keyof BorradorLabor, valor: string) => {
    setBorrador((prev) => ({ ...prev, labores: prev.labores.map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l)) }))
  }
  const eliminarLabor = (i: number) => {
    setBorrador((prev) => ({ ...prev, labores: prev.labores.filter((_, idx) => idx !== i) }))
  }
  const actualizarAplicacion = (i: number, campo: keyof BorradorAplicacion, valor: string) => {
    setBorrador((prev) => ({ ...prev, aplicaciones: prev.aplicaciones.map((a, idx) => (idx === i ? { ...a, [campo]: valor } : a)) }))
  }
  const eliminarAplicacion = (i: number) => {
    setBorrador((prev) => ({ ...prev, aplicaciones: prev.aplicaciones.filter((_, idx) => idx !== i) }))
  }

  const hayBorrador = borrador.observaciones.trim() || borrador.labores.length > 0 || borrador.aplicaciones.length > 0

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      const fotosDelChat = mensajes.flatMap((m) => m.fotos ?? [])

      if (borrador.observaciones.trim() || fotosDelChat.length > 0) {
        const visitaRes = await fetch(`/api/visitas/${visitaId}`)
        const visitaActual = await visitaRes.json()
        const observacionesFinal = borrador.observaciones.trim()
          ? (visitaActual.observaciones ? `${visitaActual.observaciones}\n\n${borrador.observaciones.trim()}` : borrador.observaciones.trim())
          : visitaActual.observaciones
        const fotosFinal = Array.from(new Set([...(visitaActual.fotos ?? []), ...fotosDelChat]))
        const res = await fetch(`/api/visitas/${visitaId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: visitaActual.estado, observaciones: observacionesFinal, fotos: fotosFinal }),
        })
        if (!res.ok) throw new Error('observaciones')
      }

      for (const l of borrador.labores) {
        const res = await fetch('/api/labores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: l.tipo,
            descripcion: l.descripcion,
            fecha: fechaVisita,
            estado: 'COMPLETADA',
            observaciones: l.observaciones || null,
            fotos: [],
            predioId,
            responsableId: tecnicoId,
            visitaId,
          }),
        })
        if (!res.ok) throw new Error('labor')
      }

      for (const a of borrador.aplicaciones) {
        const res = await fetch('/api/aplicaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            producto: a.producto,
            tipoProducto: a.tipoProducto,
            dosis: a.dosis || '0',
            unidad: a.unidad,
            fecha: fechaVisita,
            estado: 'COMPLETADA',
            observaciones: a.observaciones || null,
            predioId,
            tecnicoId,
            visitaId,
          }),
        })
        if (!res.ok) throw new Error('aplicacion')
      }

      setGuardando(false)
      setAbierto(false)
      setMensajes([])
      setBorrador(BORRADOR_VACIO)
      onGuardado()
    } catch (e) {
      setGuardando(false)
      alert('No se pudo guardar todo el borrador. Revisa la visita — es posible que parte haya quedado guardada. Vuelve a intentar lo que falte.')
    }
  }

  return (
    <>
      <div className="card mb-6 bg-primary-50/40 border-primary-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Asistente de registro (chat)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Cuéntale la visita por texto y fotos — arma un borrador de labores y aplicaciones para que revises antes de guardar</p>
          </div>
          <button onClick={() => setAbierto(true)} className="btn-primary text-sm whitespace-nowrap">Abrir chat</button>
        </div>
      </div>

      {abierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[85vh] flex flex-col md:flex-row overflow-hidden">
            {/* Panel de chat */}
            <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-gray-100 min-h-0">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <h3 className="font-semibold text-gray-900 text-sm">Asistente de registro</h3>
                <button onClick={() => setAbierto(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {mensajes.length === 0 && (
                  <p className="text-sm text-gray-400 italic">Cuéntame qué hiciste en esta visita: labores, aplicaciones, lo que observaste. Puedes adjuntar fotos.</p>
                )}
                {mensajes.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                      {m.texto && <p className="whitespace-pre-wrap">{m.texto}</p>}
                      {m.fotos && m.fotos.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {m.fotos.map((f, fi) => (
                            <img key={fi} src={f} className="w-14 h-14 object-cover rounded-lg" alt="Foto adjunta" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {enviando && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-400 rounded-xl px-3 py-2 text-sm animate-pulse">Escribiendo…</div>
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
                {fotosAdjuntas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {fotosAdjuntas.map((f, i) => (
                      <div key={i} className="relative">
                        <img src={f} className="w-12 h-12 object-cover rounded-lg border border-gray-200" alt="Foto a enviar" />
                        <button
                          type="button"
                          onClick={() => setFotosAdjuntas((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <label className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-gray-100 cursor-pointer transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleAdjuntarFotos(e.target.files)} />
                  </label>
                  <textarea
                    className="input flex-1 text-sm resize-none"
                    rows={2}
                    placeholder="Escribe aquí…"
                    value={textoInput}
                    onChange={(e) => setTextoInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar() } }}
                  />
                  <button
                    onClick={handleEnviar}
                    disabled={enviando || (!textoInput.trim() && fotosAdjuntas.length === 0)}
                    className="btn-primary text-sm flex-shrink-0"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>

            {/* Panel del borrador */}
            <div className="w-full md:w-[380px] flex flex-col min-h-0 flex-shrink-0">
              <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
                <h3 className="font-semibold text-gray-900 text-sm">Borrador</h3>
                <p className="text-xs text-gray-400 mt-0.5">Revisa y ajusta antes de guardar en la visita</p>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {!hayBorrador && (
                  <p className="text-sm text-gray-400 italic">Todavía no hay nada que guardar — sigue contándole al chat.</p>
                )}

                {borrador.observaciones.trim() && (
                  <div>
                    <label className="label">Observaciones generales</label>
                    <textarea
                      className="input text-sm"
                      rows={3}
                      value={borrador.observaciones}
                      onChange={(e) => setBorrador((prev) => ({ ...prev, observaciones: e.target.value }))}
                    />
                  </div>
                )}

                {borrador.labores.length > 0 && (
                  <div>
                    <label className="label">Labores ({borrador.labores.length})</label>
                    <div className="space-y-2">
                      {borrador.labores.map((l, i) => (
                        <div key={i} className="border border-gray-200 rounded-lg p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <select className="input text-xs flex-1" value={l.tipo} onChange={(e) => actualizarLabor(i, 'tipo', e.target.value)}>
                              {LABOR_TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <button onClick={() => eliminarLabor(i)} className="text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
                          </div>
                          <input
                            className="input text-xs"
                            value={l.descripcion}
                            onChange={(e) => actualizarLabor(i, 'descripcion', e.target.value)}
                            placeholder="Descripción"
                          />
                          <textarea
                            className="input text-xs"
                            rows={2}
                            value={l.observaciones}
                            onChange={(e) => actualizarLabor(i, 'observaciones', e.target.value)}
                            placeholder="Detalle / observaciones"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {borrador.aplicaciones.length > 0 && (
                  <div>
                    <label className="label">Aplicaciones ({borrador.aplicaciones.length})</label>
                    <div className="space-y-2">
                      {borrador.aplicaciones.map((a, i) => (
                        <div key={i} className="border border-gray-200 rounded-lg p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              className="input text-xs flex-1"
                              value={a.producto}
                              onChange={(e) => actualizarAplicacion(i, 'producto', e.target.value)}
                              placeholder="Producto"
                            />
                            <button onClick={() => eliminarAplicacion(i)} className="text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
                          </div>
                          <select className="input text-xs" value={a.tipoProducto} onChange={(e) => actualizarAplicacion(i, 'tipoProducto', e.target.value)}>
                            {TIPOS_PRODUCTO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              className="input text-xs"
                              value={a.dosis}
                              onChange={(e) => actualizarAplicacion(i, 'dosis', e.target.value)}
                              placeholder="Dosis"
                            />
                            <select className="input text-xs" value={a.unidad} onChange={(e) => actualizarAplicacion(i, 'unidad', e.target.value)}>
                              {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={handleGuardar}
                  disabled={!hayBorrador || guardando}
                  className="btn-primary w-full text-sm"
                >
                  {guardando ? 'Guardando…' : 'Guardar en la visita'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
