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
