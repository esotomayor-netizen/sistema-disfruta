'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDate, LABOR_TIPOS, TIPOS_PRODUCTO, UNIDADES } from '@/lib/constants'
import { compressImageFile } from '@/lib/image'

interface Predio { id: number; nombre: string; csg: string }
interface Usuario { id: number; nombre: string; apellido: string }
interface Visita {
  id: number
  fecha: string
  estado: string
  observaciones: string | null
  especie: string | null
  predio: Predio
  tecnico: Usuario
}

interface Propuesta {
  id: string
  tipo: 'labor' | 'aplicacion' | 'observacion'
  estado: 'pendiente' | 'guardada' | 'descartada'
  datos: Record<string, string>
  referenciaId?: number
}

interface MensajeRow {
  id: number | string
  role: 'user' | 'assistant'
  texto: string
  fotos: string[]
  propuestas: Propuesta[]
  createdAt: string
}

const TIPO_LABEL: Record<Propuesta['tipo'], string> = {
  labor: 'Labor',
  aplicacion: 'Aplicación',
  observacion: 'Nota',
}

export default function ChatVisitaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [visita, setVisita] = useState<Visita | null>(null)
  const [mensajes, setMensajes] = useState<MensajeRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [textoInput, setTextoInput] = useState('')
  const [fotosAdjuntas, setFotosAdjuntas] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)
  const [guardando, setGuardando] = useState<Set<string>>(new Set())
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({})
  const [completando, setCompletando] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function cargar() {
      const [resVisita, resMensajes] = await Promise.all([
        fetch(`/api/visitas/${id}`),
        fetch(`/api/visitas/${id}/mensajes`),
      ])
      if (resVisita.ok) setVisita(await resVisita.json())
      if (resMensajes.ok) setMensajes(await resMensajes.json())
      setCargando(false)
    }
    cargar()
  }, [id])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [mensajes, enviando])

  function datosDe(p: Propuesta): Record<string, string> {
    return edits[p.id] ?? p.datos
  }

  function setCampo(propuestaId: string, campo: string, valor: string, base: Record<string, string>) {
    setEdits((prev) => ({ ...prev, [propuestaId]: { ...base, [campo]: valor } }))
  }

  async function handleAdjuntarFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const comprimidas = await Promise.all(files.map((f) => compressImageFile(f)))
    setFotosAdjuntas((prev) => [...prev, ...comprimidas.filter(Boolean)])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleEnviar() {
    if (!visita || enviando) return
    const texto = textoInput.trim()
    const fotos = fotosAdjuntas
    if (!texto && fotos.length === 0) return

    const tempId = `temp-${Date.now()}`
    setMensajes((prev) => [...prev, { id: tempId, role: 'user', texto, fotos, propuestas: [], createdAt: new Date().toISOString() }])
    setTextoInput('')
    setFotosAdjuntas([])
    setEnviando(true)

    try {
      const res = await fetch(`/api/visitas/${visita.id}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, fotos }),
      })
      if (!res.ok) throw new Error('Error al enviar')
      const { mensajeUsuario, mensajeAsistente } = await res.json()
      setMensajes((prev) => [...prev.filter((m) => m.id !== tempId), mensajeUsuario, mensajeAsistente])
    } catch {
      setMensajes((prev) => prev.filter((m) => m.id !== tempId))
      setTextoInput(texto)
      setFotosAdjuntas(fotos)
      alert('No se pudo enviar el mensaje. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEnviar()
    }
  }

  async function handleGuardarPropuesta(mensajeId: number | string, p: Propuesta) {
    if (!visita) return
    const datos = datosDe(p)
    setGuardando((prev) => new Set(prev).add(p.id))
    try {
      let referenciaId: number | undefined

      if (p.tipo === 'labor') {
        const res = await fetch('/api/labores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: datos.tipo,
            descripcion: datos.descripcion,
            observaciones: datos.observaciones || null,
            fecha: visita.fecha,
            estado: 'COMPLETADA',
            predioId: visita.predio.id,
            responsableId: visita.tecnico.id,
            visitaId: visita.id,
          }),
        })
        if (!res.ok) throw new Error()
        referenciaId = (await res.json()).id
      } else if (p.tipo === 'aplicacion') {
        const res = await fetch('/api/aplicaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            producto: datos.producto,
            tipoProducto: datos.tipoProducto,
            dosis: datos.dosis || '0',
            unidad: datos.unidad,
            observaciones: datos.observaciones || null,
            fecha: visita.fecha,
            estado: 'COMPLETADA',
            predioId: visita.predio.id,
            tecnicoId: visita.tecnico.id,
            visitaId: visita.id,
          }),
        })
        if (!res.ok) throw new Error()
        referenciaId = (await res.json()).id
      } else {
        const nuevo = visita.observaciones ? `${visita.observaciones}\n\n${datos.texto}` : datos.texto
        const res = await fetch(`/api/visitas/${visita.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: visita.estado, observaciones: nuevo }),
        })
        if (!res.ok) throw new Error()
        setVisita((v) => (v ? { ...v, observaciones: nuevo } : v))
      }

      await fetch(`/api/visitas/${visita.id}/mensajes/${mensajeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propuestaId: p.id, estado: 'guardada', referenciaId }),
      })
      setMensajes((prev) =>
        prev.map((m) =>
          m.id === mensajeId
            ? { ...m, propuestas: m.propuestas.map((pp) => (pp.id === p.id ? { ...pp, estado: 'guardada', referenciaId } : pp)) }
            : m
        )
      )
    } catch {
      alert('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setGuardando((prev) => {
        const n = new Set(prev)
        n.delete(p.id)
        return n
      })
    }
  }

  async function handleDescartarPropuesta(mensajeId: number | string, p: Propuesta) {
    setGuardando((prev) => new Set(prev).add(p.id))
    try {
      await fetch(`/api/visitas/${id}/mensajes/${mensajeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propuestaId: p.id, estado: 'descartada' }),
      })
      setMensajes((prev) =>
        prev.map((m) =>
          m.id === mensajeId
            ? { ...m, propuestas: m.propuestas.map((pp) => (pp.id === p.id ? { ...pp, estado: 'descartada' } : pp)) }
            : m
        )
      )
    } finally {
      setGuardando((prev) => {
        const n = new Set(prev)
        n.delete(p.id)
        return n
      })
    }
  }

  async function handleCompletar() {
    if (!visita) return
    setCompletando(true)
    try {
      await fetch(`/api/visitas/${visita.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'COMPLETADA', observaciones: visita.observaciones }),
      })
      router.push(`/visitas/${visita.id}`)
    } finally {
      setCompletando(false)
    }
  }

  if (cargando) {
    return <div className="flex items-center justify-center h-screen text-gray-400 text-sm">Cargando conversación…</div>
  }
  if (!visita) {
    return <div className="flex items-center justify-center h-screen text-gray-400 text-sm">Visita no encontrada.</div>
  }

  const enProgreso = visita.estado === 'EN_PROGRESO'

  return (
    <div className="flex flex-col h-screen bg-stone-50">
      {/* Header estilo chat */}
      <div className="flex items-center gap-3 px-3 py-2.5 bg-primary-900 text-white shrink-0 shadow">
        <Link href={`/visitas/${visita.id}`} className="p-1 text-primary-200 hover:text-white shrink-0" aria-label="Volver">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{visita.predio.nombre}</p>
          <p className="text-xs text-primary-200 truncate">
            {formatDate(visita.fecha)} · {visita.tecnico.nombre} {visita.tecnico.apellido}
            {!enProgreso && ' · Completada'}
          </p>
        </div>
        {enProgreso && (
          <button onClick={handleCompletar} disabled={completando} className="btn-primary !px-3 !py-1.5 !text-xs shrink-0">
            {completando ? 'Cerrando…' : 'Marcar completada'}
          </button>
        )}
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {mensajes.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-10 px-6">
            Cuéntale a la plataforma lo que vas haciendo en la visita — labores, aplicaciones, fotos — y lo va registrando contigo.
          </div>
        )}
        {mensajes.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] sm:max-w-[70%] ${m.role === 'user' ? '' : 'w-full sm:w-auto'}`}>
              {(m.texto || m.fotos.length > 0) && (
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words shadow-sm ${
                    m.role === 'user' ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
                  }`}
                >
                  {m.fotos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {m.fotos.map((f, i) => (
                        <img key={i} src={f} alt="" className="w-24 h-24 object-cover rounded-lg" />
                      ))}
                    </div>
                  )}
                  {m.texto}
                </div>
              )}

              {m.propuestas.length > 0 && (
                <div className="mt-1.5 space-y-1.5">
                  {m.propuestas.map((p) => (
                    <PropuestaCard
                      key={p.id}
                      propuesta={p}
                      datos={datosDe(p)}
                      guardando={guardando.has(p.id)}
                      onCampo={(campo, valor) => setCampo(p.id, campo, valor, datosDe(p))}
                      onGuardar={() => handleGuardarPropuesta(m.id, p)}
                      onDescartar={() => handleDescartarPropuesta(m.id, p)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {enviando && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      {enProgreso ? (
        <div className="shrink-0 bg-white border-t border-gray-200 px-3 py-2.5">
          {fotosAdjuntas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {fotosAdjuntas.map((f, i) => (
                <div key={i} className="relative">
                  <img src={f} alt="" className="w-16 h-16 object-cover rounded-lg" />
                  <button
                    onClick={() => setFotosAdjuntas((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <label className="shrink-0 p-2 text-primary-600 hover:text-primary-800 cursor-pointer">
              <input ref={fileInputRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={handleAdjuntarFotos} />
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </label>
            <textarea
              value={textoInput}
              onChange={(e) => setTextoInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe lo que vas haciendo…"
              rows={1}
              className="flex-1 resize-none border border-gray-300 rounded-2xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 max-h-28"
            />
            <button
              onClick={handleEnviar}
              disabled={enviando || (!textoInput.trim() && fotosAdjuntas.length === 0)}
              className="shrink-0 w-10 h-10 rounded-full bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white flex items-center justify-center"
              aria-label="Enviar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 bg-white border-t border-gray-200 px-3 py-3 text-center text-xs text-gray-400">
          Esta visita ya está completada — el registro queda solo de lectura.{' '}
          <Link href={`/visitas/${visita.id}`} className="text-primary-600 font-medium">Ver ficha completa →</Link>
        </div>
      )}
    </div>
  )
}

function PropuestaCard({
  propuesta,
  datos,
  guardando,
  onCampo,
  onGuardar,
  onDescartar,
}: {
  propuesta: Propuesta
  datos: Record<string, string>
  guardando: boolean
  onCampo: (campo: string, valor: string) => void
  onGuardar: () => void
  onDescartar: () => void
}) {
  if (propuesta.estado === 'guardada') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-800 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {TIPO_LABEL[propuesta.tipo]} guardada{propuesta.tipo !== 'observacion' ? `: ${datos.descripcion || datos.producto}` : ''}
      </div>
    )
  }
  if (propuesta.estado === 'descartada') {
    return (
      <div className="bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-400 line-through">
        {TIPO_LABEL[propuesta.tipo]} descartada
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 w-full sm:w-80">
      <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-1.5">{TIPO_LABEL[propuesta.tipo]} detectada</p>

      {propuesta.tipo === 'labor' && (
        <div className="space-y-1.5">
          <select value={datos.tipo} onChange={(e) => onCampo('tipo', e.target.value)} className="input !py-1.5 !text-xs">
            {LABOR_TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input value={datos.descripcion} onChange={(e) => onCampo('descripcion', e.target.value)} placeholder="Descripción" className="input !py-1.5 !text-xs" />
          <input value={datos.observaciones} onChange={(e) => onCampo('observaciones', e.target.value)} placeholder="Observaciones (opcional)" className="input !py-1.5 !text-xs" />
        </div>
      )}

      {propuesta.tipo === 'aplicacion' && (
        <div className="space-y-1.5">
          <input value={datos.producto} onChange={(e) => onCampo('producto', e.target.value)} placeholder="Producto" className="input !py-1.5 !text-xs" />
          <select value={datos.tipoProducto} onChange={(e) => onCampo('tipoProducto', e.target.value)} className="input !py-1.5 !text-xs">
            {TIPOS_PRODUCTO.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <div className="flex gap-1.5">
            <input value={datos.dosis} onChange={(e) => onCampo('dosis', e.target.value)} placeholder="Dosis" className="input !py-1.5 !text-xs flex-1" />
            <select value={datos.unidad} onChange={(e) => onCampo('unidad', e.target.value)} className="input !py-1.5 !text-xs flex-1">
              {UNIDADES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <input value={datos.observaciones} onChange={(e) => onCampo('observaciones', e.target.value)} placeholder="Observaciones (opcional)" className="input !py-1.5 !text-xs" />
        </div>
      )}

      {propuesta.tipo === 'observacion' && (
        <textarea value={datos.texto} onChange={(e) => onCampo('texto', e.target.value)} rows={2} className="input !py-1.5 !text-xs resize-none w-full" />
      )}

      <div className="flex gap-1.5 mt-2">
        <button onClick={onGuardar} disabled={guardando} className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg py-1.5">
          {guardando ? 'Guardando…' : '✓ Guardar'}
        </button>
        <button onClick={onDescartar} disabled={guardando} className="px-3 text-xs text-gray-500 hover:text-gray-700">
          Descartar
        </button>
      </div>
    </div>
  )
}
