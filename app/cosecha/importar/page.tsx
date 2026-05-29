'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import type { ProgramacionRow, CompromisoCliente } from '@/lib/cosecha-data'
import {
  saveProgramacion,
  saveCompromisos,
  clearAllData,
  hasStoredData,
} from '@/lib/cosecha-store'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ParseResult {
  programacion: ProgramacionRow[]
  compromisos: CompromisoCliente[]
  warnings: string[]
}

interface PreviewState {
  result: ParseResult
  fileName: string
}

type PageState = 'idle' | 'dragover' | 'parsing' | 'preview' | 'success' | 'error'

// ── Week key helpers ───────────────────────────────────────────────────────────

const ALL_WEEK_KEYS = ['sem44','sem45','sem46','sem47','sem48','sem49','sem50','sem51','sem52','sem1','sem2'] as const
type WeekKey = typeof ALL_WEEK_KEYS[number]

const WEEK_NUMBER_MAP: Record<string, WeekKey> = {
  '44': 'sem44', '45': 'sem45', '46': 'sem46', '47': 'sem47', '48': 'sem48',
  '49': 'sem49', '50': 'sem50', '51': 'sem51', '52': 'sem52', '1': 'sem1', '2': 'sem2',
}

function normalizeWeekHeader(header: string): WeekKey | null {
  if (!header) return null
  const s = String(header).trim().toUpperCase()
  // Match "SEM 44", "SEM44", "SEMANA 44", "44", etc.
  const m = s.match(/(?:SEM(?:ANA)?\s*(\d+))|^(\d+)$/)
  if (!m) return null
  const num = m[1] ?? m[2]
  return WEEK_NUMBER_MAP[num] ?? null
}

// ── Excel parsers ──────────────────────────────────────────────────────────────

function findHeaderRow(rows: string[][], candidates: string[]): number {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i]
    if (!row) continue
    const rowText = row.map((c) => String(c ?? '').toUpperCase().trim())
    if (candidates.some((c) => rowText.some((cell) => cell === c.toUpperCase()))) {
      return i
    }
  }
  return -1
}

function parseProgramacion(sheet: XLSX.WorkSheet, warnings: string[]): ProgramacionRow[] {
  const raw: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][]

  const headerIdx = findHeaderRow(raw, ['VARIEDAD', 'Variedad', 'PRODUCTOR', 'Productor'])
  if (headerIdx === -1) {
    warnings.push('Hoja "Programación": no se encontró fila de encabezados con "Variedad"/"Productor".')
    return []
  }

  const headers = raw[headerIdx].map((h) => String(h ?? '').trim())

  // Find column indices
  let varIdx = -1
  let prodIdx = -1
  const weekCols: { key: WeekKey; colIdx: number }[] = []

  headers.forEach((h, i) => {
    const upper = h.toUpperCase()
    if (upper === 'VARIEDAD') varIdx = i
    else if (upper === 'PRODUCTOR') prodIdx = i
    else {
      const wk = normalizeWeekHeader(h)
      if (wk) weekCols.push({ key: wk, colIdx: i })
    }
  })

  if (varIdx === -1) { warnings.push('Hoja "Programación": columna "VARIEDAD" no encontrada.'); return [] }
  if (prodIdx === -1) { warnings.push('Hoja "Programación": columna "PRODUCTOR" no encontrada.'); return [] }
  if (weekCols.length === 0) { warnings.push('Hoja "Programación": no se encontraron columnas de semanas.') }

  const rows: ProgramacionRow[] = []

  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i]
    if (!row) continue
    const variedad = String(row[varIdx] ?? '').trim()
    const productor = String(row[prodIdx] ?? '').trim()
    if (!variedad || !productor) continue

    const weekValues: Record<WeekKey, number> = {
      sem44: 0, sem45: 0, sem46: 0, sem47: 0, sem48: 0,
      sem49: 0, sem50: 0, sem51: 0, sem52: 0, sem1: 0, sem2: 0,
    }

    for (const { key, colIdx } of weekCols) {
      const raw_val = row[colIdx]
      const val = parseFloat(String(raw_val ?? '0').replace(/[^0-9.-]/g, '')) || 0
      weekValues[key] = val
    }

    const totalKg = ALL_WEEK_KEYS.reduce((s, k) => s + (weekValues[k] ?? 0), 0)
    const kg2JMasGrandes = Math.round(totalKg * 0.70)

    rows.push({
      variedad: variedad.toUpperCase(),
      productor: productor.toUpperCase(),
      ...weekValues,
      totalKg,
      kg2JMasGrandes,
    })
  }

  return rows
}

function parseCompromisos(sheet: XLSX.WorkSheet, warnings: string[]): CompromisoCliente[] {
  const raw: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][]

  const headerIdx = findHeaderRow(raw, ['CLIENTE', 'Cliente', 'DESTINO', 'Destino', 'PAIS', 'País'])
  if (headerIdx === -1) {
    warnings.push('Hoja "Compromisos": no se encontró fila de encabezados con "Cliente"/"Destino".')
    return []
  }

  const headers = raw[headerIdx].map((h) => String(h ?? '').trim())

  let clienteIdx = -1
  let paisIdx = -1
  let variedadIdx = -1
  let calibreIdx = -1
  const weekCols: { key: string; colIdx: number }[] = []

  headers.forEach((h, i) => {
    const upper = h.toUpperCase().replace('Á','A').replace('É','E').replace('Í','I').replace('Ó','O').replace('Ú','U')
    if (upper === 'CLIENTE' || upper === 'DESTINO') clienteIdx = i
    else if (upper === 'PAIS' || upper === 'PAÍS' || upper === 'COUNTRY') paisIdx = i
    else if (upper === 'VARIEDAD') variedadIdx = i
    else if (upper === 'CALIBRE' || upper === 'CALIBRE SOLICITADO') calibreIdx = i
    else {
      const wk = normalizeWeekHeader(h)
      // Only take weeks 47-51 for compromisos
      if (wk && ['sem47','sem48','sem49','sem50','sem51'].includes(wk)) {
        weekCols.push({ key: wk, colIdx: i })
      }
    }
  })

  if (clienteIdx === -1) { warnings.push('Hoja "Compromisos": columna "Cliente" no encontrada.'); return [] }

  const rows: CompromisoCliente[] = []
  const compWeeks = ['sem47','sem48','sem49','sem50','sem51'] as const

  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i]
    if (!row) continue
    const cliente = String(row[clienteIdx] ?? '').trim()
    if (!cliente) continue

    const weekValues: Record<string, number> = { sem47: 0, sem48: 0, sem49: 0, sem50: 0, sem51: 0 }

    for (const { key, colIdx } of weekCols) {
      const val = parseFloat(String(row[colIdx] ?? '0').replace(/[^0-9.-]/g, '')) || 0
      weekValues[key] = val
    }

    const totalKgComprometido = compWeeks.reduce((s, k) => s + (weekValues[k] ?? 0), 0)

    rows.push({
      cliente,
      pais: paisIdx !== -1 ? String(row[paisIdx] ?? '').trim() : '',
      variedad: variedadIdx !== -1 ? String(row[variedadIdx] ?? '').trim().toUpperCase() : '',
      calibreSolicitado: calibreIdx !== -1 ? String(row[calibreIdx] ?? '').trim() : '',
      sem47: weekValues['sem47'],
      sem48: weekValues['sem48'],
      sem49: weekValues['sem49'],
      sem50: weekValues['sem50'],
      sem51: weekValues['sem51'],
      totalKgComprometido,
    })
  }

  return rows
}

function parseExcelFile(buffer: ArrayBuffer): ParseResult {
  const warnings: string[] = []
  const wb = XLSX.read(buffer, { type: 'array' })

  // Find matching sheets (case-insensitive, partial match)
  const sheetNames = wb.SheetNames

  const findSheet = (candidates: string[]): XLSX.WorkSheet | null => {
    for (const candidate of candidates) {
      const found = sheetNames.find((n) => n.toUpperCase().includes(candidate.toUpperCase()))
      if (found) return wb.Sheets[found]
    }
    return null
  }

  const progSheet = findSheet(['PROGRAMAC', 'SEMANAL', 'Programac', 'Semanal', 'Program'])
  const compSheet = findSheet(['COMPROMIS', 'CLIENTE', 'Compromis', 'Cliente'])

  const programacion = progSheet ? parseProgramacion(progSheet, warnings) : []
  const compromisos = compSheet ? parseCompromisos(compSheet, warnings) : []

  if (!progSheet) warnings.push('No se encontró hoja de Programación Semanal. Buscando: "Programac", "Semanal".')
  if (!compSheet) warnings.push('No se encontró hoja de Compromisos. Buscando: "Compromis", "Cliente".')

  // If only one sheet and nothing found, try first sheet as programacion
  if (!progSheet && !compSheet && sheetNames.length > 0) {
    warnings.push(`Se encontraron hojas: ${sheetNames.join(', ')}. Intentando parsear la primera como Programación.`)
    const firstSheet = wb.Sheets[sheetNames[0]]
    const prog = parseProgramacion(firstSheet, warnings)
    return { programacion: prog, compromisos: [], warnings }
  }

  return { programacion, compromisos, warnings }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ImportarPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<PageState>('idle')
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [error, setError] = useState<string>('')
  const [storedData, setStoredData] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return hasStoredData()
    return false
  })

  const processFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Formato no válido. Solo se aceptan archivos .xlsx o .xls.')
      setState('error')
      return
    }

    setState('parsing')
    try {
      const buffer = await file.arrayBuffer()
      const result = parseExcelFile(buffer)
      setPreview({ result, fileName: file.name })
      setState('preview')
    } catch (e) {
      setError(`Error al leer el archivo: ${e instanceof Error ? e.message : String(e)}`)
      setState('error')
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setState('idle')
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const handleApply = useCallback(() => {
    if (!preview) return
    const { programacion, compromisos } = preview.result
    if (programacion.length > 0) saveProgramacion(programacion)
    if (compromisos.length > 0) saveCompromisos(compromisos)
    setStoredData(true)
    setState('success')
  }, [preview])

  const handleClear = useCallback(() => {
    clearAllData()
    setStoredData(false)
    setState('idle')
    setPreview(null)
  }, [])

  const handleReset = useCallback(() => {
    setState('idle')
    setPreview(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Importar Excel</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Carga tu planilla de temporada para actualizar los datos del sistema.
          </p>
        </div>

        {/* Data source badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
          storedData
            ? 'bg-primary-50 border-primary-200 text-primary-800'
            : 'bg-gray-100 border-gray-200 text-gray-600'
        }`}>
          <span className={`w-2 h-2 rounded-full ${storedData ? 'bg-primary-500' : 'bg-gray-400'}`} />
          {storedData ? 'Datos: Excel importado' : 'Datos: originales del sistema'}
        </div>
      </div>

      {/* Success state */}
      {state === 'success' && (
        <div className="card border-primary-200 bg-primary-50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary-900">Datos aplicados correctamente</h3>
              <p className="text-sm text-primary-700 mt-1">
                Los datos importados desde <span className="font-medium">{preview?.fileName}</span> están
                activos en todo el sistema.
              </p>
              <div className="flex gap-3 mt-4">
                <button onClick={() => router.push('/cosecha')} className="btn-primary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Ir al Dashboard
                </button>
                <button onClick={handleReset} className="btn-secondary">Importar otro archivo</button>
                <button onClick={handleClear} className="btn-danger">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Limpiar y volver a datos originales
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current data stored warning */}
      {storedData && state === 'idle' && (
        <div className="card border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">El sistema usa datos importados desde Excel</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Puedes cargar un nuevo archivo para reemplazarlos, o limpiar para volver a los datos originales.
              </p>
              <button onClick={handleClear} className="mt-2 text-xs font-medium text-amber-800 underline hover:text-amber-900">
                Limpiar y volver a datos originales
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload zone */}
      {(state === 'idle' || state === 'dragover' || state === 'parsing') && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Seleccionar archivo
          </h2>

          <div
            onDragOver={(e) => { e.preventDefault(); setState('dragover') }}
            onDragLeave={() => setState('idle')}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-150 ${
              state === 'dragover'
                ? 'border-primary-400 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }`}
          >
            {state === 'parsing' ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                <p className="text-sm font-medium text-gray-600">Procesando archivo…</p>
              </div>
            ) : (
              <>
                <svg
                  className={`mx-auto w-12 h-12 mb-4 ${state === 'dragover' ? 'text-primary-500' : 'text-gray-300'}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-medium text-gray-700">
                  {state === 'dragover' ? 'Suelta el archivo aquí' : 'Arrastra tu archivo Excel aquí'}
                </p>
                <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionar</p>
                <p className="mt-3 text-xs text-gray-400">Formatos aceptados: .xlsx, .xls</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Error state */}
      {state === 'error' && (
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Error al procesar el archivo</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button onClick={handleReset} className="mt-3 btn-secondary text-xs">
                Intentar con otro archivo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {state === 'preview' && preview && (
        <>
          {/* Warnings */}
          {preview.result.warnings.length > 0 && (
            <div className="card border-amber-200 bg-amber-50">
              <p className="text-xs font-semibold text-amber-800 mb-2 uppercase tracking-wide">Avisos del parser</p>
              <ul className="space-y-1">
                {preview.result.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-amber-700 flex items-start gap-2">
                    <span className="flex-shrink-0 mt-0.5">⚠️</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Programación Semanal</p>
              <p className="text-3xl font-bold text-primary-700">{preview.result.programacion.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">filas importadas</p>
              {preview.result.programacion.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {Array.from(new Set(preview.result.programacion.map((r) => r.variedad))).length} variedades ·{' '}
                  {Array.from(new Set(preview.result.programacion.map((r) => r.productor))).length} productores
                </p>
              )}
            </div>
            <div className="card">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Compromisos Clientes</p>
              <p className="text-3xl font-bold text-primary-700">{preview.result.compromisos.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">filas importadas</p>
              {preview.result.compromisos.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {Array.from(new Set(preview.result.compromisos.map((r) => r.cliente))).length} clientes ·{' '}
                  {Array.from(new Set(preview.result.compromisos.map((r) => r.pais))).filter(Boolean).length} países
                </p>
              )}
            </div>
          </div>

          {/* Programacion preview table */}
          {preview.result.programacion.length > 0 && (
            <div className="card overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Vista previa — Programación Semanal</h3>
                <p className="text-xs text-gray-400 mt-0.5">Mostrando primeras 5 filas</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-th">Variedad</th>
                      <th className="table-th">Productor</th>
                      <th className="table-th text-right">Sem47</th>
                      <th className="table-th text-right">Sem48</th>
                      <th className="table-th text-right">Sem49</th>
                      <th className="table-th text-right">Sem50</th>
                      <th className="table-th text-right">Total Kg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.result.programacion.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="table-td font-medium">{row.variedad}</td>
                        <td className="table-td text-gray-500">{row.productor}</td>
                        <td className="table-td text-right">{row.sem47.toLocaleString('es-CL')}</td>
                        <td className="table-td text-right">{row.sem48.toLocaleString('es-CL')}</td>
                        <td className="table-td text-right">{row.sem49.toLocaleString('es-CL')}</td>
                        <td className="table-td text-right">{row.sem50.toLocaleString('es-CL')}</td>
                        <td className="table-td text-right font-semibold text-primary-700">
                          {row.totalKg.toLocaleString('es-CL')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.result.programacion.length > 5 && (
                <p className="px-6 py-2 text-xs text-gray-400 border-t border-gray-100">
                  … y {preview.result.programacion.length - 5} filas más
                </p>
              )}
            </div>
          )}

          {/* Compromisos preview table */}
          {preview.result.compromisos.length > 0 && (
            <div className="card overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Vista previa — Compromisos Clientes</h3>
                <p className="text-xs text-gray-400 mt-0.5">Mostrando primeras 5 filas</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-th">Cliente</th>
                      <th className="table-th">País</th>
                      <th className="table-th">Variedad</th>
                      <th className="table-th">Calibre</th>
                      <th className="table-th text-right">Sem47</th>
                      <th className="table-th text-right">Sem48</th>
                      <th className="table-th text-right">Total Comprometido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.result.compromisos.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="table-td font-medium">{row.cliente}</td>
                        <td className="table-td text-gray-500">{row.pais}</td>
                        <td className="table-td">{row.variedad}</td>
                        <td className="table-td">{row.calibreSolicitado}</td>
                        <td className="table-td text-right">{row.sem47.toLocaleString('es-CL')}</td>
                        <td className="table-td text-right">{row.sem48.toLocaleString('es-CL')}</td>
                        <td className="table-td text-right font-semibold text-primary-700">
                          {row.totalKgComprometido.toLocaleString('es-CL')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.result.compromisos.length > 5 && (
                <p className="px-6 py-2 text-xs text-gray-400 border-t border-gray-100">
                  … y {preview.result.compromisos.length - 5} filas más
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 pb-4">
            <button
              onClick={handleApply}
              disabled={preview.result.programacion.length === 0 && preview.result.compromisos.length === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Aplicar datos
            </button>
            <button onClick={handleReset} className="btn-secondary">
              Cancelar
            </button>
            {storedData && (
              <button onClick={handleClear} className="btn-danger ml-auto">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Limpiar y volver a datos originales
              </button>
            )}
          </div>

          {/* File info */}
          <div className="flex items-center gap-2 text-xs text-gray-400 pb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Archivo: <span className="font-medium text-gray-600">{preview.fileName}</span>
          </div>
        </>
      )}

      {/* Instructions */}
      {(state === 'idle' || state === 'dragover') && (
        <div className="card bg-gray-50 border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Formato esperado del archivo
          </h3>
          <div className="grid grid-cols-2 gap-6 text-xs text-gray-600">
            <div>
              <p className="font-semibold text-gray-700 mb-2">Hoja: Programación Semanal</p>
              <ul className="space-y-1 text-gray-500">
                <li>• Columna <span className="font-mono bg-gray-100 px-1 rounded">VARIEDAD</span> (ej: LAPINS, SANTINA)</li>
                <li>• Columna <span className="font-mono bg-gray-100 px-1 rounded">PRODUCTOR</span></li>
                <li>• Columnas de semanas: <span className="font-mono bg-gray-100 px-1 rounded">Sem 44</span>, <span className="font-mono bg-gray-100 px-1 rounded">SEM 45</span>, etc.</li>
                <li>• Rango: Sem 44 → Sem 2</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-2">Hoja: Compromisos (opcional)</p>
              <ul className="space-y-1 text-gray-500">
                <li>• Columna <span className="font-mono bg-gray-100 px-1 rounded">CLIENTE</span> o <span className="font-mono bg-gray-100 px-1 rounded">DESTINO</span></li>
                <li>• Columna <span className="font-mono bg-gray-100 px-1 rounded">PAIS</span></li>
                <li>• Columna <span className="font-mono bg-gray-100 px-1 rounded">VARIEDAD</span></li>
                <li>• Columnas semanas: <span className="font-mono bg-gray-100 px-1 rounded">Sem 47</span> → <span className="font-mono bg-gray-100 px-1 rounded">Sem 51</span></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
