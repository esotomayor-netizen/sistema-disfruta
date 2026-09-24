// Los servidores (Vercel) corren en UTC, pero toda la operación de la
// plataforma (horarios de visita, agenda) se piensa en hora de Chile. Estas
// utilidades convierten fecha/hora "de Chile" al instante UTC correcto,
// calculando el horario de verano automáticamente (sin depender de la zona
// horaria del proceso que ejecuta el código).

const CHILE_TZ = 'America/Santiago'

function chileOffsetHours(approxUtc: Date): number {
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: CHILE_TZ, timeZoneName: 'shortOffset' })
  const part = fmt.formatToParts(approxUtc).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT-4'
  const match = part.match(/GMT([+-]\d+)/)
  return match ? parseInt(match[1], 10) : -4
}

/** Instante UTC que corresponde a una fecha/hora expresada en hora de Chile (year, month: 1-12). */
export function chileDateTime(year: number, month: number, day: number, hh: number, mm: number): Date {
  const approx = new Date(Date.UTC(year, month - 1, day, hh, mm, 0))
  const offset = chileOffsetHours(approx)
  return new Date(Date.UTC(year, month - 1, day, hh - offset, mm, 0))
}

/** La fecha de "hoy" tal como se ve en Chile ahora mismo, sin importar la zona horaria del servidor. */
export function chileToday(): { year: number; month: number; day: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: CHILE_TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
  const parts = fmt.formatToParts(new Date())
  return {
    year: Number(parts.find((p) => p.type === 'year')!.value),
    month: Number(parts.find((p) => p.type === 'month')!.value),
    day: Number(parts.find((p) => p.type === 'day')!.value),
  }
}
