'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Páginas con formularios largos que se llenan en terreno: refrescarlas no
// aporta datos y, sin señal, el refresco fallido recarga la página completa
// y se pierde lo ingresado (por ejemplo las fotos de un muestreo).
const SIN_REFRESCO = [/^\/muestreos\/nuevo$/, /^\/muestreos\/\d+\/editar$/]

export default function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname && SIN_REFRESCO.some((r) => r.test(pathname))) return
    const id = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return
      router.refresh()
    }, intervalMs)
    return () => clearInterval(id)
  }, [router, intervalMs, pathname])

  return null
}
