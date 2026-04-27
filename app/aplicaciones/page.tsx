import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import Link from 'next/link'
import {
  estadoAplicacionColor,
  tipoProductoColor,
  formatDate,
  labelFromValue,
  TIPOS_PRODUCTO,
  ESTADOS_APLICACION,
} from '@/lib/constants'

export const dynamic = 'force-dynamic'

interface SearchParams { estado?: string; tipoProducto?: string }

export default async function AplicacionesPage({ searchParams }: { searchParams: SearchParams }) {
  const { estado, tipoProducto } = searchParams

  const [aplicaciones, parcelas] = await Promise.all([
    prisma.aplicacion.findMany({
      where: {
        ...(estado ? { estado } : {}),
        ...(tipoProducto ? { tipoProducto } : {}),
      },
      orderBy: { fecha: 'desc' },
      include: { parcela: true, tecnico: true },
    }),
    prisma.parcela.findMany({ where: { activa: true }, orderBy: { nombre: 'asc' } }),
  ])

  return (
    <div>
      <Header
        title="Aplicaciones"
        subtitle="Registro de aplicaciones de productos agrícolas"
        action={
          <Link href="/aplicaciones/nueva" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Aplicación
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <a href="/aplicaciones" className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${!estado && !tipoProducto ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}>
          Todas ({aplicaciones.length})
        </a>
        {ESTADOS_APLICACION.map((e) => (
          <a key={e.value} href={`/aplicaciones?estado=${e.value}`} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${estado === e.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}>
            {e.label}
          </a>
        ))}
        <span className="border-l border-gray-200 mx-1" />
        {TIPOS_PRODUCTO.map((t) => (
          <a key={t.value} href={`/aplicaciones?tipoProducto=${t.value}`} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${tipoProducto === t.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}>
            {t.label}
          </a>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Producto</th>
              <th className="table-th">Tipo</th>
              <th className="table-th">Dosis</th>
              <th className="table-th">Parcela</th>
              <th className="table-th">Técnico</th>
              <th className="table-th">Fecha</th>
              <th className="table-th">Estado</th>
              <th className="table-th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {aplicaciones.length === 0 && (
              <tr>
                <td colSpan={8} className="table-td text-center text-gray-400 py-10">
                  No hay aplicaciones con los filtros actuales.
                </td>
              </tr>
            )}
            {aplicaciones.map((ap) => (
              <tr key={ap.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-td">
                  <p className="font-medium text-gray-900">{ap.producto}</p>
                  {ap.observaciones && <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{ap.observaciones}</p>}
                </td>
                <td className="table-td">
                  <span className={`badge ${tipoProductoColor(ap.tipoProducto)}`}>
                    {labelFromValue(TIPOS_PRODUCTO, ap.tipoProducto)}
                  </span>
                </td>
                <td className="table-td whitespace-nowrap">
                  {ap.dosis} {ap.unidad}
                </td>
                <td className="table-td">
                  <p>{ap.parcela.nombre}</p>
                  <p className="text-xs text-gray-400">{ap.parcela.cultivo}</p>
                </td>
                <td className="table-td">
                  {ap.tecnico.nombre} {ap.tecnico.apellido}
                </td>
                <td className="table-td whitespace-nowrap">{formatDate(ap.fecha)}</td>
                <td className="table-td">
                  <span className={`badge ${estadoAplicacionColor(ap.estado)}`}>{ap.estado}</span>
                </td>
                <td className="table-td">
                  <Link href={`/aplicaciones/${ap.id}/editar`} className="text-primary-600 hover:text-primary-700 text-xs font-medium">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
