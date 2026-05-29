import Link from 'next/link'
import { PRODUCTORES, PROGRAMACION_SEMANAL } from '@/lib/cosecha-data'
import TablaProductores from './TablaProductores'

export const dynamic = 'force-static'

export default function ProductoresPage() {
  const comunasUnicas = new Set(PRODUCTORES.map((p) => p.comuna)).size
  const variedadesUnicas = new Set(PRODUCTORES.flatMap((p) => p.variedades)).size

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link href="/cosecha" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          ← Inicio
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🍒</span>
          <h1 className="text-2xl font-bold text-gray-900">Productores — Temporada 2026-2027</h1>
        </div>
        <p className="text-gray-500 text-sm">
          34 productores registrados · Región VI O&apos;Higgins y VII Maule
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-xs font-medium text-gray-500 mb-1">Total Productores</p>
          <p className="text-3xl font-bold text-gray-900">{PRODUCTORES.length}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 mb-1">Regiones</p>
          <p className="text-3xl font-bold text-gray-900">2</p>
          <p className="text-xs text-gray-400 mt-1">VI O&apos;Higgins · VII Maule</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 mb-1">Comunas Únicas</p>
          <p className="text-3xl font-bold text-gray-900">{comunasUnicas}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 mb-1">Variedades Únicas</p>
          <p className="text-3xl font-bold text-gray-900">{variedadesUnicas}</p>
        </div>
      </div>

      {/* Tabla filtrable (cliente) */}
      <TablaProductores productores={PRODUCTORES} programacion={PROGRAMACION_SEMANAL} />
    </div>
  )
}
