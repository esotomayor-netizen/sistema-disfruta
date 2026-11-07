'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { compressImageFile } from '@/lib/image'
import { VARIEDADES_POR_CULTIVO } from '@/lib/constants'
import {
  CALIBRES, COLORES, FIRMEZAS, DEFECTOS_CALIDAD, DEFECTOS_CONDICION, TIPOS_MUESTREO,
  Conteos, Item, Foto, distribucion, resumenMuestreo, suma, clasifColor, APTITUD_LABEL,
} from '@/lib/muestreo'
import { CurvaCalibre, BarraApilada } from './MuestreoCharts'

interface Predio {
  id: number
  nombre: string
  activa: boolean
  empresa?: { razonSocial: string }
  cultivos?: { cultivo: string; variedades: string | null }[]
}

export interface MuestreoFormData {
  tipo: string
  fecha: string
  predioId: string
  productor: string
  cuartel: string
  variedad: string
  lote: string
  guia: string
  nEnvases: string
  kilos: string
  tamanoMuestra: string
  tempPulpa: string
  tempAmbiente: string
  calibres: Conteos
  colores: Conteos
  firmeza: Conteos
  brix: number[]
  defectosCalidad: Conteos
  defectosCondicion: Conteos
  fotos: Foto[]
  observaciones: string
  latitud: string
  longitud: string
}

const DRAFT_KEY = 'muestreo-borrador'

function ahoraLocal() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function formVacio(): MuestreoFormData {
  return {
    tipo: 'COSECHA', fecha: ahoraLocal(), predioId: '', productor: '', cuartel: '', variedad: '',
    lote: '', guia: '', nEnvases: '', kilos: '', tamanoMuestra: '100', tempPulpa: '', tempAmbiente: '',
    calibres: {}, colores: {}, firmeza: {}, brix: [], defectosCalidad: {}, defectosCondicion: {},
    fotos: [], observaciones: '', latitud: '', longitud: '',
  }
}

type SeccionConteo = 'calibres' | 'colores' | 'firmeza' | 'defectosCalidad' | 'defectosCondicion'

function Contador({ item, value, onChange, swatch }: { item: Item; value: number; onChange: (n: number) => void; swatch?: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {swatch && <span className="w-4 h-4 rounded-full flex-shrink-0 border border-black/10" style={{ background: swatch }} />}
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 leading-tight">{item.label}</p>
          {item.mm && <p className="text-[11px] text-gray-400">{item.mm} mm</p>}
        </div>
      </div>
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))}
        className="w-10 h-10 rounded-lg border border-gray-300 text-lg font-bold text-gray-600 active:bg-gray-100">−</button>
      <input type="number" inputMode="numeric" min={0} value={value || ''} placeholder="0"
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        className="w-14 h-10 text-center border border-gray-300 rounded-lg text-sm font-semibold" />
      <button type="button" onClick={() => onChange(value + 1)}
        className="w-12 h-10 rounded-lg bg-primary-600 text-white text-lg font-bold active:bg-primary-700">+</button>
    </div>
  )
}

function Progreso({ total, muestra, etiqueta }: { total: number; muestra: number; etiqueta: string }) {
  const ok = total === muestra
  const p = muestra ? Math.min(100, (total / muestra) * 100) : 0
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{etiqueta}</span>
        <span className={ok ? 'text-green-700 font-semibold' : total > muestra ? 'text-red-600 font-semibold' : 'text-gray-600'}>
          {total} / {muestra} frutos {ok ? '✓' : total > muestra ? '(excede la muestra)' : ''}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${ok ? 'bg-green-600' : total > muestra ? 'bg-red-500' : 'bg-primary-500'}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  )
}

export default function MuestreoForm({ inicial, muestreoId }: { inicial?: MuestreoFormData; muestreoId?: number }) {
  const router = useRouter()
  const [form, setForm] = useState<MuestreoFormData>(inicial ?? formVacio())
  const [predios, setPredios] = useState<Predio[]>([])
  const [brixInput, setBrixInput] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [gps, setGps] = useState('')
  const [borrador, setBorrador] = useState(false)
  const fotoRef = useRef<HTMLInputElement>(null)
  const esNuevo = !muestreoId

  useEffect(() => {
    fetch('/api/predios').then((r) => r.json()).then((p: Predio[]) => setPredios(p.filter((x) => x.activa))).catch(() => {})
  }, [])

  // Borrador local: si se corta la señal en el huerto no se pierde el conteo.
  useEffect(() => {
    if (!esNuevo) return
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) setBorrador(true)
    } catch {}
  }, [esNuevo])

  useEffect(() => {
    if (!esNuevo) return
    const t = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, fotos: [] })) } catch {}
    }, 600)
    return () => clearTimeout(t)
  }, [form, esNuevo])

  const recuperarBorrador = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) setForm({ ...formVacio(), ...JSON.parse(raw) })
    } catch {}
    setBorrador(false)
  }

  const set = <K extends keyof MuestreoFormData>(k: K, v: MuestreoFormData[K]) => setForm((f) => ({ ...f, [k]: v }))
  const setConteo = (sec: SeccionConteo, key: string, n: number) =>
    setForm((f) => ({ ...f, [sec]: { ...f[sec], [key]: n } }))

  const predio = predios.find((p) => String(p.id) === form.predioId)
  const variedadesPredio = useMemo(() => {
    const desdePredio = (predio?.cultivos ?? [])
      .filter((c) => c.cultivo.toLowerCase().startsWith('cerez'))
      .flatMap((c) => (c.variedades ?? '').split(','))
      .map((v) => v.trim().toUpperCase())
      .filter(Boolean)
    return Array.from(new Set([...desdePredio, ...VARIEDADES_POR_CULTIVO['Cerezo'], 'SKEENA', 'SANTINA', 'PACIFIC RED', 'NIMBA']))
  }, [predio])

  const elegirPredio = (id: string) => {
    const p = predios.find((x) => String(x.id) === id)
    setForm((f) => ({ ...f, predioId: id, productor: f.productor || p?.empresa?.razonSocial || '' }))
  }

  const muestra = Math.max(1, parseInt(form.tamanoMuestra) || 0)
  const resumen = resumenMuestreo({ ...form, tamanoMuestra: muestra })
  const curva = distribucion(CALIBRES, form.calibres)
  const colores = distribucion(COLORES, form.colores)
  const firmezas = distribucion(FIRMEZAS, form.firmeza)

  const agregarBrix = () => {
    const vals = brixInput.split(/[\s;]+/).map((v) => parseFloat(v.replace(',', '.'))).filter((v) => v > 0 && v < 40)
    if (vals.length) set('brix', [...form.brix, ...vals])
    setBrixInput('')
  }

  const capturarGps = () => {
    if (!navigator.geolocation) { setGps('GPS no disponible'); return }
    setGps('Obteniendo ubicación…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, latitud: pos.coords.latitude.toFixed(6), longitud: pos.coords.longitude.toFixed(6) }))
        setGps(`±${Math.round(pos.coords.accuracy)} m`)
      },
      () => setGps('No se pudo obtener la ubicación'),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const agregarFotos = async (files: FileList | null) => {
    if (!files) return
    const nuevas: Foto[] = []
    for (const file of Array.from(files).slice(0, 12 - form.fotos.length)) {
      const src = await compressImageFile(file, 1280, 0.7)
      if (src) nuevas.push({ src, nota: '' })
    }
    setForm((f) => ({ ...f, fotos: [...f.fotos, ...nuevas] }))
    if (fotoRef.current) fotoRef.current.value = ''
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.variedad.trim()) { setError('Indica la variedad.'); return }
    setGuardando(true)
    try {
      const res = await fetch(muestreoId ? `/api/muestreos/${muestreoId}` : '/api/muestreos', {
        method: muestreoId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error || (res.status === 413 ? 'Las fotos pesan demasiado; quita alguna e intenta de nuevo.' : 'No se pudo guardar.'))
        return
      }
      const { id } = await res.json()
      if (esNuevo) { try { localStorage.removeItem(DRAFT_KEY) } catch {} }
      router.push(`/muestreos/${id}`)
      router.refresh()
    } catch {
      setError('Sin conexión. El borrador queda guardado en este equipo; intenta de nuevo con señal.')
    } finally {
      setGuardando(false)
    }
  }

  const seccion = (titulo: string, sub: string, children: React.ReactNode) => (
    <section className="card">
      <h2 className="text-base font-semibold text-gray-900">{titulo}</h2>
      <p className="text-xs text-gray-500 mb-3">{sub}</p>
      {children}
    </section>
  )

  return (
    <form onSubmit={guardar} className="space-y-4 pb-28">
      {borrador && (
        <div className="card bg-amber-50 border-amber-200 flex flex-wrap items-center gap-3">
          <p className="text-sm text-amber-800 flex-1">Hay un muestreo sin guardar en este equipo.</p>
          <button type="button" onClick={recuperarBorrador} className="btn-primary">Recuperar</button>
          <button type="button" onClick={() => { try { localStorage.removeItem(DRAFT_KEY) } catch {}; setBorrador(false) }} className="btn-secondary">Descartar</button>
        </div>
      )}

      {seccion('1. Identificación', 'Datos del lote y de la muestra', (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className="label">Tipo de muestreo</label>
            <select className="input" value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>
              {TIPOS_MUESTREO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Fecha y hora</label>
            <input type="datetime-local" className="input" value={form.fecha} onChange={(e) => set('fecha', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Predio / huerto</label>
            <select className="input" value={form.predioId} onChange={(e) => elegirPredio(e.target.value)}>
              <option value="">— Sin predio registrado —</option>
              {predios.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Productor</label>
            <input className="input" value={form.productor} onChange={(e) => set('productor', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Variedad *</label>
            <input className="input uppercase" list="variedades-cerezo" required value={form.variedad}
              onChange={(e) => set('variedad', e.target.value)} placeholder="Ej. LAPINS" />
            <datalist id="variedades-cerezo">
              {variedadesPredio.map((v) => <option key={v} value={v} />)}
            </datalist>
          </div>
          <div>
            <label className="label">Cuartel</label>
            <input className="input" value={form.cuartel} onChange={(e) => set('cuartel', e.target.value)} />
          </div>
          <div>
            <label className="label">Lote</label>
            <input className="input" value={form.lote} onChange={(e) => set('lote', e.target.value)} />
          </div>
          <div>
            <label className="label">N° guía</label>
            <input className="input" value={form.guia} onChange={(e) => set('guia', e.target.value)} />
          </div>
          <div>
            <label className="label">N° envases</label>
            <input className="input" value={form.nEnvases} onChange={(e) => set('nEnvases', e.target.value)} placeholder="Ej. 46 bins" />
          </div>
          <div>
            <label className="label">Kilos netos</label>
            <input className="input" inputMode="decimal" value={form.kilos} onChange={(e) => set('kilos', e.target.value)} />
          </div>
          <div>
            <label className="label">Tamaño muestra (frutos)</label>
            <input className="input" inputMode="numeric" value={form.tamanoMuestra} onChange={(e) => set('tamanoMuestra', e.target.value)} />
          </div>
          <div>
            <label className="label">T° pulpa (°C)</label>
            <input className="input" inputMode="decimal" value={form.tempPulpa} onChange={(e) => set('tempPulpa', e.target.value)} />
          </div>
          <div>
            <label className="label">T° ambiente (°C)</label>
            <input className="input" inputMode="decimal" value={form.tempAmbiente} onChange={(e) => set('tempAmbiente', e.target.value)} />
          </div>
          <div className="col-span-2 flex items-end gap-2">
            <button type="button" onClick={capturarGps} className="btn-secondary">📍 Registrar GPS</button>
            <span className="text-xs text-gray-500 pb-2">
              {form.latitud ? `${form.latitud}, ${form.longitud} ${gps}` : gps}
            </span>
          </div>
        </div>
      ))}

      {seccion('2. Curva de calibres', 'Cuenta cada fruto en su calibre (anillo calibrador)', (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 [&>*]:min-w-0">
          <div>
            <Progreso total={suma(form.calibres)} muestra={muestra} etiqueta="Frutos calibrados" />
            {CALIBRES.map((c) => (
              <Contador key={c.key} item={c} value={form.calibres[c.key] ?? 0} onChange={(n) => setConteo('calibres', c.key, n)} />
            ))}
          </div>
          <div>
            <CurvaCalibre data={curva} />
            <div className="grid grid-cols-3 gap-2 text-center mt-2">
              <div className="bg-gray-50 rounded-lg p-2"><p className="text-[11px] text-gray-500">Promedio</p><p className="font-bold">{resumen.calibrePromedioMm ?? '–'} mm</p></div>
              <div className="bg-gray-50 rounded-lg p-2"><p className="text-[11px] text-gray-500">J y mayor</p><p className="font-bold">{resumen.pctJMas}%</p></div>
              <div className="bg-gray-50 rounded-lg p-2"><p className="text-[11px] text-gray-500">Pre-calibre</p><p className="font-bold">{resumen.pctPrecalibre}%</p></div>
            </div>
          </div>
        </div>
      ))}

      {seccion('3. Color de cubrimiento', 'Compara con la tabla de color', (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 [&>*]:min-w-0">
          <div>
            <Progreso total={suma(form.colores)} muestra={muestra} etiqueta="Frutos clasificados por color" />
            {COLORES.map((c) => (
              <Contador key={c.key} item={c} swatch={c.color} value={form.colores[c.key] ?? 0} onChange={(n) => setConteo('colores', c.key, n)} />
            ))}
          </div>
          <div className="pt-6">
            <BarraApilada data={colores} />
            <p className="text-xs text-gray-500 mt-3">Caoba o más oscuro: <b>{resumen.pctCaobaMas}%</b></p>
          </div>
        </div>
      ))}

      {seccion('4. Firmeza y sólidos solubles', 'Firmeza al tacto (o Durofel/FirmTech) y lecturas de refractómetro', (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 [&>*]:min-w-0">
          <div>
            {FIRMEZAS.map((c) => (
              <Contador key={c.key} item={c} swatch={c.color} value={form.firmeza[c.key] ?? 0} onChange={(n) => setConteo('firmeza', c.key, n)} />
            ))}
            <div className="mt-3"><BarraApilada data={firmezas} /></div>
          </div>
          <div>
            <label className="label">Lecturas °Brix</label>
            <div className="flex gap-2">
              <input className="input" inputMode="decimal" value={brixInput} placeholder="Ej. 18.2 17.5 19"
                onChange={(e) => setBrixInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarBrix() } }} />
              <button type="button" onClick={agregarBrix} className="btn-primary">Agregar</button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.brix.map((b, i) => (
                <button type="button" key={i} onClick={() => set('brix', form.brix.filter((_, j) => j !== i))}
                  className="badge bg-gray-100 text-gray-700" title="Quitar">{b} ×</button>
              ))}
            </div>
            {resumen.brixPromedio !== null && (
              <p className="text-sm mt-3">Promedio <b>{resumen.brixPromedio} °Brix</b> <span className="text-gray-500">(mín {resumen.brixMin} · máx {resumen.brixMax} · n={form.brix.length})</span></p>
            )}
          </div>
        </div>
      ))}

      {seccion('5. Defectos', 'Registra solo el defecto principal de cada fruto', (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 [&>*]:min-w-0">
          <div>
            <h3 className="text-sm font-semibold text-blue-800 mb-1">Calidad <span className="font-normal text-gray-500">(origen huerto)</span></h3>
            {DEFECTOS_CALIDAD.map((c) => (
              <Contador key={c.key} item={c} value={form.defectosCalidad[c.key] ?? 0} onChange={(n) => setConteo('defectosCalidad', c.key, n)} />
            ))}
            <p className="text-sm mt-2">Total calidad: <b>{resumen.pctCalidad}%</b> <span className={`badge ${clasifColor(resumen.clasifCalidad)}`}>Clasif. {resumen.clasifCalidad}</span></p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-800 mb-1">Condición <span className="font-normal text-gray-500">(evolutivos)</span></h3>
            {DEFECTOS_CONDICION.map((c) => (
              <Contador key={c.key} item={c} value={form.defectosCondicion[c.key] ?? 0} onChange={(n) => setConteo('defectosCondicion', c.key, n)} />
            ))}
            <p className="text-sm mt-2">Total condición: <b>{resumen.pctCondicion}%</b> <span className={`badge ${clasifColor(resumen.clasifCondicion)}`}>Clasif. {resumen.clasifCondicion}</span></p>
          </div>
        </div>
      ))}

      {seccion('6. Fotos y observaciones', 'Hasta 12 fotos; agrega una nota a cada una (ej. "Partidura estilar")', (
        <div>
          <input ref={fotoRef} type="file" accept="image/*" capture="environment" multiple className="hidden"
            onChange={(e) => agregarFotos(e.target.files)} />
          <button type="button" onClick={() => fotoRef.current?.click()} className="btn-secondary" disabled={form.fotos.length >= 12}>
            📷 Tomar / subir foto
          </button>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            {form.fotos.map((f, i) => (
              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.src} alt={f.nota || `Foto ${i + 1}`} className="w-full h-32 object-cover" />
                <div className="p-1.5 flex gap-1">
                  <input className="input py-1 text-xs" placeholder="Nota" value={f.nota ?? ''}
                    onChange={(e) => set('fotos', form.fotos.map((x, j) => (j === i ? { ...x, nota: e.target.value } : x)))} />
                  <button type="button" onClick={() => set('fotos', form.fotos.filter((_, j) => j !== i))} className="text-red-600 text-xs px-1">✕</button>
                </div>
              </div>
            ))}
          </div>
          <label className="label mt-4">Observaciones</label>
          <textarea className="input" rows={3} value={form.observaciones} onChange={(e) => set('observaciones', e.target.value)} />
        </div>
      ))}

      {/* Barra inferior fija con el resultado en vivo */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex-1 grid grid-cols-3 gap-2 text-center">
            <div><p className="text-[10px] text-gray-500 uppercase">Exportable</p><p className="text-lg font-bold text-primary-700">{resumen.pctExportable}%</p></div>
            <div><p className="text-[10px] text-gray-500 uppercase">Daños</p><p className="text-lg font-bold">{resumen.pctDanos}%</p></div>
            <div><p className="text-[10px] text-gray-500 uppercase">Viaje</p><p className="text-sm font-bold mt-1">{APTITUD_LABEL[resumen.aptitudViaje].split(' /')[0]}</p></div>
          </div>
          <button type="submit" disabled={guardando} className="btn-primary px-6 py-3 disabled:opacity-60">
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
        {error && <p className="text-center text-sm text-red-600 pb-2">{error}</p>}
      </div>
    </form>
  )
}
