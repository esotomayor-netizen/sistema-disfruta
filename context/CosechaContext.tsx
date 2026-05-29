'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  PROGRAMACION_SEMANAL,
  COMPROMISOS_CLIENTES,
  type ProgramacionRow,
  type CompromisoCliente,
} from '@/lib/cosecha-data'
import { loadProgramacion, loadCompromisos } from '@/lib/cosecha-store'

interface CosechaContextValue {
  programacion: ProgramacionRow[]
  compromisos: CompromisoCliente[]
  isCustomData: boolean
  reload: () => void
}

const CosechaContext = createContext<CosechaContextValue>({
  programacion: PROGRAMACION_SEMANAL,
  compromisos: COMPROMISOS_CLIENTES,
  isCustomData: false,
  reload: () => {},
})

export function CosechaProvider({ children }: { children: ReactNode }) {
  const [programacion, setProgramacion] = useState<ProgramacionRow[]>(PROGRAMACION_SEMANAL)
  const [compromisos, setCompromisos] = useState<CompromisoCliente[]>(COMPROMISOS_CLIENTES)
  const [isCustomData, setIsCustomData] = useState(false)

  function load() {
    const prog = loadProgramacion()
    const comp = loadCompromisos()
    if (prog) { setProgramacion(prog); setIsCustomData(true) }
    if (comp) { setCompromisos(comp); setIsCustomData(true) }
  }

  useEffect(() => { load() }, [])

  return (
    <CosechaContext.Provider value={{ programacion, compromisos, isCustomData, reload: load }}>
      {children}
    </CosechaContext.Provider>
  )
}

export function useCosechaData() {
  return useContext(CosechaContext)
}
