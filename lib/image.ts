// Las fotos de cámara de celular (varios MB, a veces HEIC) superan fácil el
// límite de tamaño de payload de las funciones serverless de Vercel (~4.5MB),
// lo que hace fallar el guardado sin aviso. Se redimensionan y recomprimen a
// JPEG antes de convertirlas a base64 para que el guardado sea confiable.
export function compressImageFile(file: File, maxDim = 1600, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(dataUrl); return }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      // Si el navegador no puede decodificar el formato (ej. algún HEIC), se
      // usa el original tal cual en vez de perder la foto.
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    }
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}
