export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { PRODUCTOS_SAG } from '@/lib/sag-catalog'

export async function GET() {
  const items = PRODUCTOS_SAG.map((p, i) => ({
    id: i + 1,
    producto: p.nombreComercial,
    ingredienteActivo: p.ingredienteActivo,
    dosisHa: `${p.dosis} ${p.unidad}`,
    tratamientoObjetivo: p.plaga,
    grupo: p.grupo,
  }))
  return NextResponse.json(items)
}
