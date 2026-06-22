import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import Link from 'next/link'
import PredioSelect from '@/components/PredioSelect'
import {
  estadoLaborColor,
  estadoAplicacionColor,
  tipoProductoColor,
  formatDate,
  labelFromValue,
  LABOR_TIPOS,
  TIPOS_PRODUCTO,
  ESTADOS_LABOR,
} from '@/lib/constants'

export const dynamic = 'force-dynamic'

interface SearchParams { estado?: string; predioId?: string }

export default async function LaborePage({ searchParams }: { searchParams: SearchParams }) {
  const { estado, predioId } = searchParams

  const [labores, aplicaciones, predios] = await Promise.all([
    prisma.labor.findMany({
      where: {
        ...(estado ? { estado } : {}),
        ...(predioId ? { predioId: parseInt(predioId) } : {}),
      },
      orderBy: { fecha: 'desc' },
      include: { predio: { include: { cultivos: true } }, responsable: true },
    }),
    prisma.aplicacion.findMany({
      where: {
        estado: 'PENDIENTE',
        ...(predioId ? { predioId: parseInt(predioId) } : {}),
      },
      orderBy: { fecha: 'asc' },
      include: { predio: { include: { cultivos: true } }, tecnico: true },
    }),
    prisma.predio.findMany({ where: { activa: true }, orderBy: { nombre: 'asc' } }),
  ])

  const counts = ESTADOS_LABOR.reduce((acc, e) => {
    acc[e.value] = labores.filter((l) => l.estado === e.value).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      <Header
        title="Labores Activas"
        subtitle="Aplicaciones y labores de campo del fundo, separadas por tipo"
        action={
          <div className="flex gap-2">
            <Link href="/aplicaciones/nueva" className="btn-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Aplicación
            </Link>
            <Link href="/labores/nueva" className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Labor
            </Link>
          </div>
        }
      />

      {/* ── Sección Aplicaciones ─────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Aplicaciones</h2>
            <span className="badge bg-yellow-100 text-yellow-800">{aplicaciones.length} pendiente{aplicaciones.length !== 1 ? 's' : ''}</span>
          </div>
          <Link href="/aplicaciones" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Ver todas las aplicaciones →
          </Link>
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Producto</th>
                <th className="table-th">Tipo</th>
                <th className="table-th">Dosis</th>
                <th className="table-th">Predio</th>
                <th className="table-th">Técnico</th>
                <th className="table-th">Fecha</th>
                <th className="table-th">Estado</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {aplicaciones.length === 0 && (
                <tr>
                  <td colSpan={8} className="table-td text-center text-gray-400 py-8">
                    No hay aplicaciones pendientes{predioId ? ' para el predio seleccionado' : ''}.
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
                    <p className="text-sm text-gray-900">{ap.predio.nombre}</p>
                    <p className="text-xs text-gray-400">{ap.predio.cultivos.map((c) => c.cultivo).join(', ') || '—'}</p>
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

      {/* ── Sección Labores de Campo ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Labores de Campo</h2>
            <span className="badge bg-blue-100 text-blue-800">{labores.length} {estado ? labelFromValue(ESTADOS_LABOR, estado).toLowerCase() : 'en total'}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <a
            href="/labores"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${!estado ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}
          >
            Todas ({labores.length})
          </a>
          {ESTADOS_LABOR.map((e) => (
            <a
              key={e.value}
              href={`/labores?estado=${e.value}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${estado === e.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}
            >
              {e.label} ({counts[e.value] ?? 0})
            </a>
          ))}

          <PredioSelect predios={predios} estado={estado} predioId={predioId} />
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Descripción</th>
                <th className="table-th">Tipo</th>
                <th className="table-th">Predio</th>
                <th className="table-th">Responsable</th>
                <th className="table-th">Fecha</th>
                <th className="table-th">Estado</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {labores.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-td text-center text-gray-400 py-10">
                    No hay labores registradas con los filtros actuales.
                  </td>
                </tr>
              )}
              {labores.map((labor) => (
                <tr key={labor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td">
                    <p className="font-medium text-gray-900 max-w-xs truncate">{labor.descripcion}</p>
                    {labor.observaciones && (
                      <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{labor.observaciones}</p>
                    )}
                  </td>
                  <td className="table-td">
                    <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      {labelFromValue(LABOR_TIPOS, labor.tipo)}
                    </span>
                  </td>
                  <td className="table-td">
                    <p className="text-sm text-gray-900">{labor.predio.nombre}</p>
                    <p className="text-xs text-gray-400">{labor.predio.cultivos.map((c) => c.cultivo).join(', ') || '—'}</p>
                  </td>
                  <td className="table-td">
                    {labor.responsable.nombre} {labor.responsable.apellido}
                  </td>
                  <td className="table-td whitespace-nowrap">
                    <p>{formatDate(labor.fecha)}</p>
                    {labor.fechaFin && <p className="text-xs text-gray-400">fin: {formatDate(labor.fechaFin)}</p>}
                  </td>
                  <td className="table-td">
                    <span className={`badge ${estadoLaborColor(labor.estado)}`}>
                      {labor.estado.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="table-td">
                    <Link href={`/labores/${labor.id}/editar`} className="text-primary-600 hover:text-primary-700 text-xs font-medium">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
