'use client'

import { useEffect, useState } from 'react'

// Botón para enviar o guardar el PDF del muestreo.
//
// En la app instalada en el celular (modo standalone) abrir el PDF con un
// enlace lo muestra a pantalla completa sin opción de compartir ni guardar.
// Por eso, donde el navegador lo permite, se usa la hoja de compartir del
// sistema (WhatsApp, correo, "Guardar en Archivos"...). El PDF se descarga
// apenas carga la página porque iOS exige llamar a navigator.share() de
// inmediato al tocar el botón, sin esperas de red entre medio.
export default function PdfMuestreoBoton({ id, nombreArchivo, className = 'btn-primary' }: {
  id: number
  nombreArchivo: string
  className?: string
}) {
  const url = `/api/muestreos/${id}/pdf`
  const [archivo, setArchivo] = useState<File | null>(null)
  // cargando: preparando el archivo para compartir · compartir · descargar
  const [modo, setModo] = useState<'cargando' | 'compartir' | 'descargar'>('cargando')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelado = false
    if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') { setModo('descargar'); return }
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.blob()
      })
      .then((blob) => {
        if (cancelado) return
        const f = new File([blob], nombreArchivo, { type: 'application/pdf' })
        let ok = false
        try { ok = navigator.canShare({ files: [f] }) } catch {}
        setArchivo(f)
        setModo(ok ? 'compartir' : 'descargar')
      })
      .catch(() => { if (!cancelado) setModo('descargar') })
    return () => { cancelado = true }
  }, [url, nombreArchivo])

  const descargar = (f: File) => {
    const href = URL.createObjectURL(f)
    const a = document.createElement('a')
    a.href = href
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(href), 10000)
  }

  const compartir = async () => {
    if (!archivo) return
    setError('')
    try {
      await navigator.share({ files: [archivo], title: nombreArchivo.replace(/\.pdf$/, '') })
    } catch (e) {
      // El usuario cerró la hoja de compartir: no es un error.
      if ((e as Error)?.name === 'AbortError') return
      try { descargar(archivo) } catch { setError('No se pudo compartir el PDF') }
    }
  }

  if (modo === 'cargando') {
    return <button type="button" disabled className={`${className} opacity-60`}>Preparando PDF…</button>
  }

  if (modo === 'compartir') {
    return (
      <>
        <button type="button" onClick={compartir} className={className}>
          Enviar / guardar PDF
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </>
    )
  }

  // Computador o navegador sin hoja de compartir: descarga directa del archivo.
  return (
    <a href={`${url}?descargar=1`} className={className} download={nombreArchivo}>
      Descargar PDF
    </a>
  )
}
