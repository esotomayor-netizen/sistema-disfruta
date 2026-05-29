'use client'

import type { ProgramacionRow, CompromisoCliente } from './cosecha-data'

const KEYS = {
  programacion: 'cosecha_programacion',
  compromisos: 'cosecha_compromisos',
}

export function saveProgramacion(data: ProgramacionRow[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.programacion, JSON.stringify(data))
}

export function loadProgramacion(): ProgramacionRow[] | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEYS.programacion)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function saveCompromisos(data: CompromisoCliente[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.compromisos, JSON.stringify(data))
}

export function loadCompromisos(): CompromisoCliente[] | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEYS.compromisos)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function clearAllData() {
  if (typeof window === 'undefined') return
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
}

export function hasStoredData(): boolean {
  if (typeof window === 'undefined') return false
  return Object.values(KEYS).some((k) => localStorage.getItem(k) !== null)
}

// ── Hectáreas ──────────────────────────────────────────────────────────────────

export interface HuertoEdit {
  id: string
  nombre: string
  haCerezo: number
  anioPlantacion: number
  estado: 'activo' | 'eliminado' | 'nuevo'
  motivoSalida?: string
  variedades: string[]
}

export interface ProductorHectareasEdit {
  productorid: number
  nombreHuerto: string
  huertos: HuertoEdit[]
  pctEntregaExportadora: number
}

const HECTAREAS_KEY = 'cosecha_hectareas_v2'

export function saveHectareas(data: ProductorHectareasEdit[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(HECTAREAS_KEY, JSON.stringify(data))
}

export function loadHectareas(): ProductorHectareasEdit[] | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(HECTAREAS_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

// ── Recepciones ───────────────────────────────────────────────────────────────

export interface Recepcion {
  id: string
  fecha: string
  productor: string
  variedad: string
  semana: string
  kgRecepcionado: number
  observacion?: string
}

const RECEPCIONES_KEY = 'cosecha_recepciones'

export function saveRecepciones(data: Recepcion[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(RECEPCIONES_KEY, JSON.stringify(data))
}

export function loadRecepciones(): Recepcion[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(RECEPCIONES_KEY)
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}
