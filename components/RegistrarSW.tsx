'use client'

import { useEffect } from 'react'

// Registra el service worker (public/sw.js) que permite abrir el formulario
// de muestreo sin señal. Solo en producción, para no interferir en desarrollo.
export default function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])
  return null
}
