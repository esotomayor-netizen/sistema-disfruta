// Genera contenido iCalendar (RFC 5545) para que Outlook, Google Calendar o
// Apple Calendar puedan "suscribirse" a la agenda de un técnico vía URL.

export interface IcsEvento {
  uid: string
  inicio: Date
  finMin: number // duración en minutos
  titulo: string
  descripcion?: string
  ubicacion?: string
}

function escaparTexto(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function formatearFechaUTC(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

// Los lectores de calendario esperan líneas de máximo 75 octetos; las que se
// pasan se "pliegan" con un salto de línea seguido de un espacio.
function plegarLinea(linea: string): string {
  if (linea.length <= 75) return linea
  const partes: string[] = []
  let resto = linea
  while (resto.length > 75) {
    partes.push(resto.slice(0, 75))
    resto = ' ' + resto.slice(75)
  }
  partes.push(resto)
  return partes.join('\r\n')
}

export function construirIcs(nombreCalendario: string, eventos: IcsEvento[]): string {
  const lineas: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Exportadora Disfruta//Agenda de Visitas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escaparTexto(nombreCalendario)}`,
    'X-WR-TIMEZONE:America/Santiago',
    // Actualización sugerida al lector de calendario (en horas)
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    'X-PUBLISHED-TTL:PT6H',
  ]

  const ahora = formatearFechaUTC(new Date())

  for (const ev of eventos) {
    const fin = new Date(ev.inicio.getTime() + ev.finMin * 60_000)
    lineas.push('BEGIN:VEVENT')
    lineas.push(`UID:${ev.uid}`)
    lineas.push(`DTSTAMP:${ahora}`)
    lineas.push(`DTSTART:${formatearFechaUTC(ev.inicio)}`)
    lineas.push(`DTEND:${formatearFechaUTC(fin)}`)
    lineas.push(`SUMMARY:${escaparTexto(ev.titulo)}`)
    if (ev.descripcion) lineas.push(`DESCRIPTION:${escaparTexto(ev.descripcion)}`)
    if (ev.ubicacion) lineas.push(`LOCATION:${escaparTexto(ev.ubicacion)}`)
    lineas.push('END:VEVENT')
  }

  lineas.push('END:VCALENDAR')

  return lineas.map(plegarLinea).join('\r\n') + '\r\n'
}
