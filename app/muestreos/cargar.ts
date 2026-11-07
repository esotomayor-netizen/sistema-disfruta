import { prisma } from '@/lib/prisma'
import { getSession, isSupervisor } from '@/lib/session'
import { CALIBRES, Conteos, distribucion, suma, toConteos } from '@/lib/muestreo'

export async function cargarMuestreo(idStr: string) {
  const session = await getSession()
  if (!session) return null
  const id = parseInt(idStr)
  if (!Number.isFinite(id)) return null
  const m = await prisma.muestreo.findUnique({
    where: { id },
    include: { predio: { select: { nombre: true, csg: true } }, tecnico: { select: { nombre: true, apellido: true } } },
  })
  if (!m) return null
  if (!isSupervisor(session) && m.tecnicoId !== session.user.id) return null
  return m
}

// Curva promedio de la misma variedad (otros muestreos) para comparar.
export async function curvaReferencia(variedad: string, excluirId: number) {
  const otros = await prisma.muestreo.findMany({
    where: { variedad, id: { not: excluirId } },
    select: { calibres: true },
    orderBy: { fecha: 'desc' },
    take: 200,
  })
  const acc: Conteos = {}
  let n = 0
  for (const o of otros) {
    const c = toConteos(o.calibres)
    const t = suma(c)
    if (!t) continue
    n++
    // Promedio de porcentajes (cada muestreo pesa igual).
    for (const k of CALIBRES) acc[k.key] = (acc[k.key] ?? 0) + ((c[k.key] ?? 0) / t) * 100
  }
  if (!n) return undefined
  for (const k of Object.keys(acc)) acc[k] = acc[k] / n
  return { nombre: `Promedio ${variedad} (${n} muestreos)`, data: distribucion(CALIBRES, acc) }
}
