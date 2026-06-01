'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import { PRODUCTORES, PROGRAMACION_SEMANAL, VARIEDADES, fmtKg, TEMPORADA } from '@/lib/cosecha-data'
import {
  saveRecepciones,
  loadRecepciones,
  type Recepcion,
} from '@/lib/cosecha-store'

// ── Constants ──────────────────────────────────────────────────────────────────

const CURRENT_SEMANA = 'sem47'
const ACTIVE_SEMANAS = ['sem44', 'sem45', 'sem46', 'sem47', 'sem48']

function dateToSemana(dateStr: string): string {
  // Simple week mapping based on date ranges
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  if (month === 10 && day >= 26) return 'sem44'
  if (month === 11 && day <= 8) return day <= 1 ? 'sem44' : 'sem45'
  if (month === 11 && day <= 15) return 'sem46'
  if (month === 11 && day <= 22) return 'sem47'
  if (month === 11 && day <= 29) return 'sem48'
  if (month === 12 && day <= 6) return 'sem49'
  if (month === 12 && day <= 13) return 'sem50'
  if (month === 12 && day <= 20) return 'sem51'
  if (month === 12 && day <= 27) return 'sem52'
  return 'sem1'
}

function semanaLabel(key: string): string {
  const map: Record<string, string> = {
    sem44: 'Sem 44', sem45: 'Sem 45', sem46: 'Sem 46', sem47: 'Sem 47', sem48: 'Sem 48',
    sem49: 'Sem 49', sem50: 'Sem 50', sem51: 'Sem 51', sem52: 'Sem 52', sem1: 'Sem 1', sem2: 'Sem 2',
  }
  return map[key] ?? key
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// ── Computed helpers ───────────────────────────────────────────────────────────

interface AvanceRow {
  productor: string
  variedad: string
  kgPlan: number
  kgReal: number
  pctAvance: number
  semanaPico: string
  estado: 'sin_inicio' | 'en_curso' | 'completado' | 'atrasado'
}

interface AlertaRow {
  tipo: '80pct' | 'menos50'
  productor: string
  variedad: string
  kgRecibido: number
  kgPlan: number
  pctCumplimiento: number
}

function computeAvance(recepciones: Recepcion[]): AvanceRow[] {
  const rows: AvanceRow[] = []

  PROGRAMACION_SEMANAL.forEach((prog) => {
    if (prog.totalKg === 0) return
    const kgReal = recepciones
      .filter((r) => r.productor === prog.productor && r.variedad === prog.variedad)
      .reduce((s, r) => s + r.kgRecepcionado, 0)

    const pctAvance = prog.totalKg > 0 ? kgReal / prog.totalKg : 0

    // Find semana pico
    let picaKey = ''
    let picaVal = 0
    ;['sem44', 'sem45', 'sem46', 'sem47', 'sem48', 'sem49', 'sem50', 'sem51', 'sem52', 'sem1', 'sem2'].forEach((k) => {
      const v = prog[k] as number
      if (v > picaVal) { picaVal = v; picaKey = k }
    })

    // Determine state
    const hasActivePlan = ACTIVE_SEMANAS.some((k) => (prog[k] as number) > 0)
    let estado: AvanceRow['estado'] = 'sin_inicio'
    if (kgReal >= prog.totalKg) {
      estado = 'completado'
    } else if (kgReal > 0 && hasActivePlan && pctAvance < 0.5) {
      estado = 'atrasado'
    } else if (kgReal > 0) {
      estado = 'en_curso'
    }

    rows.push({
      productor: prog.productor,
      variedad: prog.variedad,
      kgPlan: prog.totalKg,
      kgReal,
      pctAvance,
      semanaPico: semanaLabel(picaKey),
      estado,
    })
  })

  return rows
}

function computeAlertas(avance: AvanceRow[]): AlertaRow[] {
  const alertas: AlertaRow[] = []
  avance.forEach((row) => {
    if (row.kgPlan === 0) return

    // Check if producer has planned KG for active semanas
    const progRow = PROGRAMACION_SEMANAL.find(
      (p) => p.productor === row.productor && p.variedad === row.variedad
    )
    if (!progRow) return
    const hasActivePlan = ACTIVE_SEMANAS.some((k) => (progRow[k] as number) > 0)

    const pct = row.pctAvance

    if (pct >= 0.8 && pct < 1.0) {
      alertas.push({
        tipo: '80pct',
        productor: row.productor,
        variedad: row.variedad,
        kgRecibido: row.kgReal,
        kgPlan: row.kgPlan,
        pctCumplimiento: pct,
      })
    } else if (hasActivePlan && pct < 0.5 && row.kgReal > 0) {
      alertas.push({
        tipo: 'menos50',
        productor: row.productor,
        variedad: row.variedad,
        kgRecibido: row.kgReal,
        kgPlan: row.kgPlan,
        pctCumplimiento: pct,
      })
    }
  })
  return alertas
}

// ── Excel parser for recepciones ───────────────────────────────────────────────

interface ImportResult {
  rows: Recepcion[]
  warnings: string[]
}

function parseRecepcionesExcel(buffer: ArrayBuffer): ImportResult {
  const warnings: string[] = []
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][]

  if (raw.length < 2) {
    warnings.push('El archivo no tiene filas de datos.')
    return { rows: [], warnings }
  }

  const headers = raw[0].map((h) => String(h).trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
  )

  const idx = {
    fecha: headers.findIndex((h) => h.includes('fecha')),
    productor: headers.findIndex((h) => h.includes('productor')),
    variedad: headers.findIndex((h) => h.includes('variedad')),
    semana: headers.findIndex((h) => h.includes('semana')),
    kg: headers.findIndex((h) => h.includes('kg') || h.includes('kilo') || h.includes('recepcion')),
    obs: headers.findIndex((h) => h.includes('observ')),
  }

  if (idx.fecha === -1) warnings.push('No se encontró columna "Fecha".')
  if (idx.productor === -1) warnings.push('No se encontró columna "Productor".')
  if (idx.kg === -1) warnings.push('No se encontró columna de KG.')

  const rows: Recepcion[] = []

  for (let i = 1; i < raw.length; i++) {
    const row = raw[i]
    if (!row || row.every((c) => !c)) continue

    const fechaRaw = idx.fecha >= 0 ? String(row[idx.fecha] ?? '').trim() : ''
    const productor = idx.productor >= 0 ? String(row[idx.productor] ?? '').trim().toUpperCase() : ''
    const variedad = idx.variedad >= 0 ? String(row[idx.variedad] ?? '').trim().toUpperCase() : ''
    const semanaRaw = idx.semana >= 0 ? String(row[idx.semana] ?? '').trim().toLowerCase() : ''
    const kgStr = idx.kg >= 0 ? String(row[idx.kg] ?? '0') : '0'
    const obs = idx.obs >= 0 ? String(row[idx.obs] ?? '').trim() : ''

    if (!productor) continue

    // Parse fecha
    let fecha = fechaRaw
    if (typeof row[idx.fecha] === 'number') {
      // Excel serial date
      const serial = row[idx.fecha] as unknown as number
      const d = XLSX.SSF.parse_date_code(serial)
      fecha = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
    }

    const kg = parseFloat(kgStr.replace(/[^0-9.-]/g, '')) || 0

    // Semana: use provided or derive from date
    const semana = semanaRaw.startsWith('sem')
      ? semanaRaw
      : semanaRaw.match(/\d+/)
        ? `sem${semanaRaw.match(/\d+/)![0]}`
        : fecha ? dateToSemana(fecha) : CURRENT_SEMANA

    rows.push({
      id: makeId(),
      fecha,
      productor,
      variedad,
      semana,
      kgRecepcionado: kg,
      observacion: obs || undefined,
    })
  }

  return { rows, warnings }
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CosechaRealPage() {
  const [recepciones, setRecepciones] = useState<Recepcion[]>([])
  const [avance, setAvance] = useState<AvanceRow[]>([])
  const [alertas, setAlertas] = useState<AlertaRow[]>([])
  const [importStatus, setImportStatus] = useState<{ msg: string; type: 'success' | 'error' | 'warning' } | null>(null)
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Manual form state
  const [formFecha, setFormFecha] = useState(new Date().toISOString().slice(0, 10))
  const [formProductor, setFormProductor] = useState('')
  const [formVariedad, setFormVariedad] = useState('')
  const [formSemana, setFormSemana] = useState(CURRENT_SEMANA)
  const [formKg, setFormKg] = useState('')
  const [formObs, setFormObs] = useState('')
  const [formMsg, setFormMsg] = useState<string | null>(null)

  // Update semana when fecha changes
  useEffect(() => {
    if (formFecha) setFormSemana(dateToSemana(formFecha))
  }, [formFecha])

  useEffect(() => {
    const stored = loadRecepciones()
    setRecepciones(stored)
  }, [])

  useEffect(() => {
    const av = computeAvance(recepciones)
    setAvance(av)
    setAlertas(computeAlertas(av))
  }, [recepciones])

  const totalKgPlanificado = PROGRAMACION_SEMANAL.reduce((s, r) => s + r.totalKg, 0)
  const totalKgRecepcionado = recepciones.reduce((s, r) => s + r.kgRecepcionado, 0)
  const pctDelPlan = totalKgPlanificado > 0 ? (totalKgRecepcionado / totalKgPlanificado) * 100 : 0
  const productoresActivos = new Set(recepciones.map((r) => r.productor)).size

  // ── Import Handler ──────────────────────────────────────────────────────────

  const handleFileImport = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setImportStatus({ msg: 'Formato no válido. Solo .xlsx o .xls.', type: 'error' })
      return
    }
    try {
      const buffer = await file.arrayBuffer()
      const { rows, warnings } = parseRecepcionesExcel(buffer)
      setRecepciones((prev) => {
        const next = [...prev, ...rows]
        saveRecepciones(next)
        return next
      })
      setImportStatus({
        msg: `${rows.length} recepciones importadas.${warnings.length > 0 ? ' Avisos: ' + warnings.join(' | ') : ''}`,
        type: warnings.length > 0 ? 'warning' : 'success',
      })
    } catch (e) {
      setImportStatus({ msg: `Error: ${e instanceof Error ? e.message : String(e)}`, type: 'error' })
    }
    if (fileRef.current) fileRef.current.value = ''
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileImport(file)
  }, [handleFileImport])

  // ── Manual Add ──────────────────────────────────────────────────────────────

  const handleAddManual = useCallback(() => {
    if (!formProductor || !formVariedad || !formKg) {
      setFormMsg('Completa Productor, Variedad y KG.')
      return
    }
    const kg = parseFloat(formKg)
    if (isNaN(kg) || kg <= 0) {
      setFormMsg('KG debe ser un número mayor a 0.')
      return
    }
    const recepcion: Recepcion = {
      id: makeId(),
      fecha: formFecha,
      productor: formProductor.toUpperCase(),
      variedad: formVariedad.toUpperCase(),
      semana: formSemana,
      kgRecepcionado: kg,
      observacion: formObs || undefined,
    }
    setRecepciones((prev) => {
      const next = [...prev, recepcion]
      saveRecepciones(next)
      return next
    })
    setFormKg('')
    setFormObs('')
    setFormMsg(`Recepción agregada: ${fmtKg(kg)} kg de ${formVariedad} (${formProductor})`)
    setTimeout(() => setFormMsg(null), 3000)
  }, [formFecha, formProductor, formVariedad, formSemana, formKg, formObs])

  const handleClearAll = useCallback(() => {
    if (!confirm('¿Eliminar todas las recepciones registradas?')) return
    setRecepciones([])
    saveRecepciones([])
  }, [])

  const descargarPDF = useCallback(async (productor: string) => {
    setPdfLoading(productor)
    try {
      const { generarPDFProductor } = await import('@/lib/pdf-generator')
      generarPDFProductor(productor, PROGRAMACION_SEMANAL, recepciones)
    } finally {
      setPdfLoading(null)
    }
  }, [recepciones])

  const descargarTodosPDF = useCallback(async () => {
    const productores = Array.from(new Set(PROGRAMACION_SEMANAL.map((r) => r.productor)))
    setPdfLoading('__all__')
    try {
      const { generarPDFProductor } = await import('@/lib/pdf-generator')
      for (const p of productores) {
        generarPDFProductor(p, PROGRAMACION_SEMANAL, recepciones)
        // small delay to avoid browser blocking multiple downloads
        await new Promise((res) => setTimeout(res, 300))
      }
    } finally {
      setPdfLoading(null)
    }
  }, [recepciones])

  const estadoBadge = (estado: AvanceRow['estado']) => {
    switch (estado) {
      case 'completado': return 'bg-green-100 text-green-800'
      case 'en_curso': return 'bg-blue-100 text-blue-700'
      case 'atrasado': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-500'
    }
  }

  const estadoLabel = (estado: AvanceRow['estado']) => {
    switch (estado) {
      case 'completado': return 'Completado'
      case 'en_curso': return 'En curso'
      case 'atrasado': return 'Atrasado'
      default: return 'Sin inicio'
    }
  }

  const productoresOptions = PRODUCTORES.map((p) => p.nombreHuerto)
  const variedadesOptions = VARIEDADES.map((v) => v.nombre.toUpperCase())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <a href="/cosecha" className="text-gray-400 hover:text-gray-600 text-sm">← Inicio</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600 font-medium">Cosecha Real</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚛</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cosecha Real y Seguimiento</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Temporada {TEMPORADA} · KG recepcionados vs plan · Semana actual: <strong>{semanaLabel(CURRENT_SEMANA)}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={descargarTodosPDF}
              disabled={pdfLoading !== null}
              className="btn-secondary text-xs py-1.5 disabled:opacity-50"
            >
              {pdfLoading === '__all__' ? (
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              )}
              Exportar todos los PDF
            </button>
            {recepciones.length > 0 && (
              <button onClick={handleClearAll} className="btn-danger text-xs py-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Limpiar recepciones
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section 1: KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{fmtKg(totalKgRecepcionado)}</p>
          <p className="text-sm text-gray-500 mt-1">Total KG recepcionados</p>
        </div>
        <div className="card text-center">
          <p className={`text-3xl font-bold ${pctDelPlan >= 80 ? 'text-green-700' : pctDelPlan >= 50 ? 'text-blue-700' : 'text-gray-500'}`}>
            {pctDelPlan.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500 mt-1">Del plan total</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-700">{productoresActivos}</p>
          <p className="text-sm text-gray-500 mt-1">Productores activos</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-red-600">{alertas.length}</p>
          <p className="text-sm text-gray-500 mt-1">
            Alertas activas
            {alertas.length > 0 && <span className="ml-1 badge bg-red-100 text-red-700">{alertas.length}</span>}
          </p>
        </div>
      </div>

      {/* Section 2: Alertas */}
      {alertas.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Alertas Automáticas
            <span className="badge bg-red-100 text-red-700">{alertas.length}</span>
          </h2>
          <div className="space-y-2">
            {alertas.map((alerta, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm ${
                  alerta.tipo === '80pct'
                    ? 'bg-orange-50 border border-orange-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <span className="text-lg flex-shrink-0">{alerta.tipo === '80pct' ? '🟠' : '🔴'}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {alerta.productor} · <span className="text-gray-600">{alerta.variedad}</span>
                  </p>
                  <p className={`text-xs mt-0.5 ${alerta.tipo === '80pct' ? 'text-orange-700' : 'text-red-700'}`}>
                    {alerta.tipo === '80pct'
                      ? `Aproximándose al límite: ${(alerta.pctCumplimiento * 100).toFixed(0)}% del plan comprometido`
                      : `Por debajo del 50% en semanas activas: ${(alerta.pctCumplimiento * 100).toFixed(0)}% del plan`
                    }
                  </p>
                </div>
                <div className="text-right text-xs text-gray-600 flex-shrink-0">
                  <p><span className="font-medium">{fmtKg(alerta.kgRecibido)}</span> recibido</p>
                  <p className="text-gray-400">de {fmtKg(alerta.kgPlan)} planificado</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Tabla avance */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Avance por Productor / Variedad</h2>
            <p className="text-xs text-gray-400 mt-0.5">Comparativo plan vs real</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-th">Productor</th>
                <th className="table-th">Variedad</th>
                <th className="table-th text-right">KG Plan</th>
                <th className="table-th text-right">KG Real</th>
                <th className="table-th text-right">% Avance</th>
                <th className="table-th text-center">Semana Pico</th>
                <th className="table-th text-center">Estado</th>
                <th className="table-th text-center">PDF</th>
              </tr>
            </thead>
            <tbody>
              {avance.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-td text-center text-gray-400 py-8">
                    Sin datos de recepciones. Importa un archivo Excel o usa el registro manual.
                  </td>
                </tr>
              ) : (
                avance.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="table-td font-medium">{row.productor}</td>
                    <td className="table-td">
                      <span className="badge bg-green-100 text-green-800">{row.variedad}</span>
                    </td>
                    <td className="table-td text-right text-gray-500">{fmtKg(row.kgPlan)}</td>
                    <td className="table-td text-right font-semibold text-blue-700">
                      {row.kgReal > 0 ? fmtKg(row.kgReal) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="table-td text-right">
                      {row.kgReal > 0 ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${row.pctAvance >= 1 ? 'bg-green-500' : row.pctAvance >= 0.5 ? 'bg-blue-500' : 'bg-red-400'}`}
                              style={{ width: `${Math.min(100, row.pctAvance * 100).toFixed(0)}%` }}
                            />
                          </div>
                          <span className={`font-bold ${row.pctAvance >= 1 ? 'text-green-700' : row.pctAvance >= 0.5 ? 'text-blue-700' : 'text-red-600'}`}>
                            {(row.pctAvance * 100).toFixed(0)}%
                          </span>
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="table-td text-center text-gray-500">{row.semanaPico}</td>
                    <td className="table-td text-center">
                      <span className={`badge text-[10px] ${estadoBadge(row.estado)}`}>
                        {estadoLabel(row.estado)}
                      </span>
                    </td>
                    <td className="table-td text-center">
                      <button
                        onClick={() => descargarPDF(row.productor)}
                        disabled={pdfLoading !== null}
                        title={`Descargar PDF de ${row.productor}`}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-40 transition-colors"
                      >
                        {pdfLoading === row.productor ? (
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        )}
                        PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {avance.length > 0 && (
              <tfoot>
                <tr className="bg-gray-900 text-white">
                  <td colSpan={2} className="table-td font-bold text-white">TOTAL</td>
                  <td className="table-td text-right font-bold text-gray-300">{fmtKg(avance.reduce((s, r) => s + r.kgPlan, 0))}</td>
                  <td className="table-td text-right font-bold text-green-400">{fmtKg(totalKgRecepcionado)}</td>
                  <td colSpan={4} className="table-td text-gray-400">{pctDelPlan.toFixed(1)}% del plan</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Section 4: Importar Excel */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          Importar Recepciones desde Excel
        </h2>

        {importStatus && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm flex items-start gap-2 ${
            importStatus.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            importStatus.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
            'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <span>{importStatus.type === 'success' ? '✅' : importStatus.type === 'warning' ? '⚠️' : '❌'}</span>
            <span>{importStatus.msg}</span>
          </div>
        )}

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition-all"
        >
          <svg className="mx-auto w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-gray-600 font-medium">Arrastra tu archivo Excel o haz clic para seleccionar</p>
          <p className="text-xs text-gray-400 mt-1">.xlsx / .xls · Se AGREGA a las recepciones existentes (no reemplaza)</p>
          <p className="text-xs text-gray-400 mt-2">
            Columnas esperadas: <span className="font-mono bg-gray-100 px-1 rounded">Fecha</span> ·{' '}
            <span className="font-mono bg-gray-100 px-1 rounded">Productor</span> ·{' '}
            <span className="font-mono bg-gray-100 px-1 rounded">Variedad</span> ·{' '}
            <span className="font-mono bg-gray-100 px-1 rounded">Semana</span> ·{' '}
            <span className="font-mono bg-gray-100 px-1 rounded">KG Recepcionados</span> ·{' '}
            <span className="font-mono bg-gray-100 px-1 rounded">Observación</span> (opcional)
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileImport(file)
          }}
        />
      </div>

      {/* Section 5: Registro manual */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Registro Manual de Recepción
        </h2>

        {formMsg && (
          <div className="mb-4 rounded-lg px-4 py-3 text-sm bg-green-50 border border-green-200 text-green-800 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {formMsg}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Fecha</label>
            <input
              type="date"
              className="input"
              value={formFecha}
              onChange={(e) => setFormFecha(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Productor</label>
            <select
              className="input"
              value={formProductor}
              onChange={(e) => setFormProductor(e.target.value)}
            >
              <option value="">Seleccionar productor…</option>
              {productoresOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Variedad</label>
            <select
              className="input"
              value={formVariedad}
              onChange={(e) => setFormVariedad(e.target.value)}
            >
              <option value="">Seleccionar variedad…</option>
              {variedadesOptions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Semana</label>
            <select
              className="input"
              value={formSemana}
              onChange={(e) => setFormSemana(e.target.value)}
            >
              {['sem44','sem45','sem46','sem47','sem48','sem49','sem50','sem51','sem52','sem1','sem2'].map((k) => (
                <option key={k} value={k}>{semanaLabel(k)}</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">Detectada automáticamente desde la fecha</p>
          </div>
          <div>
            <label className="label">KG Recepcionados</label>
            <input
              type="number"
              className="input"
              value={formKg}
              min={0}
              step={100}
              placeholder="ej: 5000"
              onChange={(e) => setFormKg(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Observación (opcional)</label>
            <input
              type="text"
              className="input"
              value={formObs}
              placeholder="Notas, calidad, etc."
              onChange={(e) => setFormObs(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <button onClick={handleAddManual} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Agregar Recepción
          </button>
        </div>

        {/* Recent receptions */}
        {recepciones.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Últimas recepciones registradas ({recepciones.length} total)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-th">Fecha</th>
                    <th className="table-th">Productor</th>
                    <th className="table-th">Variedad</th>
                    <th className="table-th text-center">Semana</th>
                    <th className="table-th text-right">KG</th>
                    <th className="table-th">Observación</th>
                    <th className="table-th text-center">Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {[...recepciones].reverse().slice(0, 10).map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="table-td text-gray-500">{r.fecha}</td>
                      <td className="table-td font-medium">{r.productor}</td>
                      <td className="table-td">
                        <span className="badge bg-green-100 text-green-800">{r.variedad}</span>
                      </td>
                      <td className="table-td text-center text-gray-500">{semanaLabel(r.semana)}</td>
                      <td className="table-td text-right font-semibold text-blue-700">{fmtKg(r.kgRecepcionado)}</td>
                      <td className="table-td text-gray-400">{r.observacion ?? '—'}</td>
                      <td className="table-td text-center">
                        <button
                          onClick={() => {
                            setRecepciones((prev) => {
                              const next = prev.filter((x) => x.id !== r.id)
                              saveRecepciones(next)
                              return next
                            })
                          }}
                          className="text-red-400 hover:text-red-600"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recepciones.length > 10 && (
                <p className="text-xs text-gray-400 px-4 py-2">… y {recepciones.length - 10} más</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
