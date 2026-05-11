import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const DEFECT_FIELDS = [
  { key: 'condMachuconM1', label: 'Machucón', tipo: 'condicion' },
  { key: 'condSobremadurezM1', label: 'Sobremadurez', tipo: 'condicion' },
  { key: 'condHerIdaAbiertaM1', label: 'Herida Abierta', tipo: 'condicion' },
  { key: 'condDanioPajaroM1', label: 'Daño Pájaro', tipo: 'condicion' },
  { key: 'condPittingM1', label: 'Pitting', tipo: 'condicion' },
  { key: 'condPartiduraSuperficialM1', label: 'Partidura Superficial', tipo: 'condicion' },
  { key: 'condPudricionM1', label: 'Pudrición', tipo: 'condicion' },
  { key: 'condPartiduraEstrellaM1', label: 'Partidura Estrella', tipo: 'condicion' },
  { key: 'condPartiduraMediaLunaM1', label: 'Partidura Media Luna', tipo: 'condicion' },
  { key: 'condDeshidratacionFrutoPediM1', label: 'Deshidratación Fruto/Pedi.', tipo: 'condicion' },
  { key: 'condDesgarroPedicelarM1', label: 'Desgarro Pedicelar', tipo: 'condicion' },
  { key: 'condOtro1M1', label: 'Otro Condición 1', tipo: 'condicion' },
  { key: 'condOtro2M1', label: 'Otro Condición 2', tipo: 'condicion' },
  { key: 'calRoceM1', label: 'Roce', tipo: 'calidad' },
  { key: 'calRussetM1', label: 'Russet', tipo: 'calidad' },
  { key: 'calManchaM1', label: 'Mancha', tipo: 'calidad' },
  { key: 'calDeformeM1', label: 'Deforme', tipo: 'calidad' },
  { key: 'calFrutoDobleM1', label: 'Fruto Doble', tipo: 'calidad' },
  { key: 'calHerIdaCicatrizadaM1', label: 'Herida Cicatrizada', tipo: 'calidad' },
  { key: 'calPreCalibreM1', label: 'Pre-calibre', tipo: 'calidad' },
  { key: 'calFaltaColorM1', label: 'Falta Color', tipo: 'calidad' },
  { key: 'calDanioInsectoM1', label: 'Daño Insecto', tipo: 'calidad' },
  { key: 'calVirosisM1', label: 'Virosis', tipo: 'calidad' },
  { key: 'calOtro1M1', label: 'Otro Calidad 1', tipo: 'calidad' },
] as const

type DefectKey = typeof DEFECT_FIELDS[number]['key']

export async function GET() {
  const all = await prisma.recepcionCalidad.findMany()

  // Compute global total per defect
  const globalTotals: Record<string, number> = {}
  let globalSum = 0
  for (const f of DEFECT_FIELDS) {
    const val = all.reduce((acc, r) => acc + (Number((r as Record<string, unknown>)[f.key]) || 0), 0)
    globalTotals[f.key] = val
    globalSum += val
  }

  // Group by producer
  const productorMap: Record<string, typeof all> = {}
  for (const r of all) {
    if (!productorMap[r.productor]) productorMap[r.productor] = []
    productorMap[r.productor].push(r)
  }

  const productores = Object.entries(productorMap).map(([productor, rows]) => {
    const muestras = rows.length
    const defectos: Record<string, { valor: number; pctPropio: number; pctGlobal: number; label: string; tipo: string }> = {}

    let productorSum = 0
    for (const f of DEFECT_FIELDS) {
      const val = rows.reduce((acc, r) => acc + (Number((r as Record<string, unknown>)[f.key as DefectKey]) || 0), 0)
      productorSum += val
    }

    for (const f of DEFECT_FIELDS) {
      const val = rows.reduce((acc, r) => acc + (Number((r as Record<string, unknown>)[f.key as DefectKey]) || 0), 0)
      defectos[f.key] = {
        valor: Math.round(val),
        pctPropio: productorSum > 0 ? Math.round((val / productorSum) * 1000) / 10 : 0,
        pctGlobal: globalSum > 0 ? Math.round((val / globalSum) * 1000) / 10 : 0,
        label: f.label,
        tipo: f.tipo,
      }
    }

    const totalDefectos = productorSum
    const frutaSanaPromedio = rows.reduce((acc, r) => acc + (r.resFrutaSanaM1 || 0), 0) / muestras
    const variedades = [...new Set(rows.map((r) => r.variedad))]
    const decisiones = rows.reduce((acc, r) => {
      const d = r.decisionFinal || 'SIN_INFO'
      acc[d] = (acc[d] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      productor,
      muestras,
      totalDefectos: Math.round(totalDefectos),
      pctDelGlobal: globalSum > 0 ? Math.round((totalDefectos / globalSum) * 1000) / 10 : 0,
      frutaSanaPromedio: Math.round(frutaSanaPromedio * 10) / 10,
      variedades,
      decisiones,
      defectos,
    }
  })

  productores.sort((a, b) => b.totalDefectos - a.totalDefectos)

  return NextResponse.json({
    productores,
    global: {
      totalMuestras: all.length,
      totalDefectos: Math.round(globalSum),
      defectos: Object.fromEntries(
        DEFECT_FIELDS.map((f) => [
          f.key,
          {
            valor: Math.round(globalTotals[f.key]),
            pctGlobal: globalSum > 0 ? Math.round((globalTotals[f.key] / globalSum) * 1000) / 10 : 0,
            label: f.label,
            tipo: f.tipo,
          },
        ])
      ),
    },
    metaDefectos: DEFECT_FIELDS,
  })
}
