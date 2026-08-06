import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextResponse } from 'next/server'

export async function getSession() {
  return getServerSession(authOptions)
}

export function unauthorized() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}

export function isSupervisor(session: Awaited<ReturnType<typeof getSession>>) {
  return session?.user?.rol === 'SUPERVISOR'
}

export const EMAIL_EDUARDO_SOTOMAYOR = 'e.sotomayor@exportadoradisfruta.cl'

export function puedeEliminarVisitas(session: Awaited<ReturnType<typeof getSession>>) {
  return session?.user?.email === EMAIL_EDUARDO_SOTOMAYOR
}
