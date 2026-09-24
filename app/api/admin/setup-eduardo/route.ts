export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, unauthorized, isSupervisor } from '@/lib/session'
import { nameSimilarity } from '@/lib/fuzzy-match'

// Cartera y frecuencia mensual de Eduardo Sotomayor, tomada de la planilla
// "visitas_mensuales.xlsx". Esto configura los predios (técnico asignado,
// comuna, visitas/mes) para que el botón "Generar Agenda" de /agenda —
// usado por cualquier técnico— arme su ruta real con horario y viajes.
const EMAIL_EDUARDO = 'e.sotomayor@exportadoradisfruta.cl'
const ORIGEN_EDUARDO = { lat: -34.2083454, lng: -70.7760397 } // Punto GPS real de partida diaria (Rancagua)

const CARTERA_EDUARDO: { razon: string; visitasMensuales: number; comuna?: string }[] = [
  { razon: 'AGRICOLA ATALAYA SPA',                      visitasMensuales: 1, comuna: 'San Francisco de Mostazal' },
  { razon: 'AGRICOLA LA PALMA SPA',                     visitasMensuales: 2, comuna: 'Las Cabras' },
  { razon: 'AGRICOLA LOS TALAVERAS LTDA',                visitasMensuales: 2, comuna: 'Teno' },
  { razon: 'AGRÍCOLA COPA DE AGUA LIMITADA',             visitasMensuales: 1, comuna: 'Linares' },
  { razon: 'AGRÍCOLA LAS RAICES SPA',                    visitasMensuales: 1, comuna: 'Curicó' },
  { razon: 'ANDRES RISOPATRÓN IÑIGUEZ',                  visitasMensuales: 1, comuna: 'San Francisco de Mostazal' },
  { razon: 'INVERSIONES MAULE S.A',                      visitasMensuales: 1, comuna: 'Talca' },
  { razon: 'JUAN DOMINGO RIVERA ARENAS',                 visitasMensuales: 2, comuna: 'Peor es Nada' },
  { razon: 'SERVICIOS AGRICOLAS Y LOGISTICOS L&B LTDA',  visitasMensuales: 1, comuna: 'Linares' },
  { razon: 'SIRZO BALTAZAR CARO LIZANA',                 visitasMensuales: 2 },
  { razon: 'SOCIEDAD AGRICOLA EL RINCON B LIMITADA',     visitasMensuales: 1, comuna: 'Peor es Nada' },
  { razon: 'SOCIEDAD AGRICOLA Y FORESTAL PINO SPA',      visitasMensuales: 2, comuna: 'Malloa' },
  { razon: 'TORREFRUT LIMITADA',                         visitasMensuales: 1, comuna: 'Curicó' },
  { razon: 'VILLA ABEJAS SPA',                            visitasMensuales: 1, comuna: 'Placilla' },
  { razon: 'VITIVINICOLA CREMASCHI SA',                  visitasMensuales: 1, comuna: 'Linares' },
]

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!isSupervisor(session)) {
    return NextResponse.json({ error: 'Solo supervisores pueden ejecutar esta acción' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const dryRun: boolean = body.dryRun ?? true

  const eduardo = await prisma.usuario.findUnique({ where: { email: EMAIL_EDUARDO } })
  if (!eduardo) {
    return NextResponse.json({ error: `No existe el usuario ${EMAIL_EDUARDO}` }, { status: 400 })
  }

  const empresas = await prisma.empresa.findMany({ select: { id: true, razonSocial: true } })
  const predios = await prisma.predio.findMany({
    select: { id: true, nombre: true, csg: true, empresaId: true, latitud: true, longitud: true, comuna: true, tecnicoId: true, visitasMensuales: true },
  })

  const reporte: any[] = []

  for (const item of CARTERA_EDUARDO) {
    let empresa: typeof empresas[0] | null = null
    let bestScore = 0
    for (const e of empresas) {
      const score = nameSimilarity(e.razonSocial, item.razon)
      if (score > bestScore) { bestScore = score; empresa = e }
    }
    if (bestScore < 0.9) empresa = null
    const prediosMatch = empresa ? predios.filter(p => p.empresaId === empresa!.id) : []

    if (prediosMatch.length === 0) {
      reporte.push({ razon: item.razon, accion: 'OMITIDO', motivo: 'No se encontró la empresa/predio en el sistema' })
      continue
    }

    for (const p of prediosMatch) {
      reporte.push({
        razon: item.razon,
        predioId: p.id,
        predioNombre: p.nombre,
        csg: p.csg,
        antes: { tecnicoId: p.tecnicoId, comuna: p.comuna, visitasMensuales: p.visitasMensuales, tieneGps: p.latitud != null && p.longitud != null },
        despues: { tecnicoId: eduardo.id, comuna: item.comuna ?? p.comuna, visitasMensuales: item.visitasMensuales },
        accion: dryRun ? 'PREVIEW' : 'ACTUALIZADO',
      })

      if (!dryRun) {
        await prisma.predio.update({
          where: { id: p.id },
          data: {
            tecnicoId: eduardo.id,
            visitasMensuales: item.visitasMensuales,
            ...(item.comuna ? { comuna: item.comuna } : {}),
          },
        })
      }
    }
  }

  if (!dryRun) {
    await prisma.usuario.update({
      where: { id: eduardo.id },
      data: { origenLat: ORIGEN_EDUARDO.lat, origenLng: ORIGEN_EDUARDO.lng },
    })
  }

  return NextResponse.json({
    dryRun,
    origenAsignado: ORIGEN_EDUARDO,
    prediosActualizados: reporte.filter(r => r.accion !== 'OMITIDO').length,
    omitidos: reporte.filter(r => r.accion === 'OMITIDO').length,
    reporte,
    mensaje: dryRun
      ? 'Simulación: revisa el reporte y envía dryRun:false para aplicar los cambios.'
      : 'Cartera de Eduardo Sotomayor configurada. Ya puedes usar "Generar Agenda" en /agenda.',
  })
}
