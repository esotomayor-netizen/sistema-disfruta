import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import Link from 'next/link'
import {
  estadoLaborColor,
  formatDate,
  labelFromValue,
  LABOR_TIPOS,
  ESTADOS_LABOR,
} from '@/lib/constants'

export const dynamic = 'force-dynamic'

interface SearchParams { estado?: string; parcelaId?: string }

export default async function LaborePage({ searchParams }: { searchParams: SearchParams }) {
  const { estado, parcelaId } = searchParams

  const [labores, parcelas] = await Promise.all([
    prisma.labor.findMany({
      where: {
        ...(estado ? { estado } : {}),
        ...(parcelaId ? { parcelaId: parseInt(parcelaId) } : {}),
      },
      orderBy: { fecha: 'desc' },
      include: { parcela: true, responsable: true },
    }),
    prisma.parcela.findMany({ where: { activa: true }, orderBy: { nombre: 'asc' } }),
  ])

  const counts = ESTADOS_LABOR.reduce((acc, e) => {
    acc[e.value] = labores.filter((l) => l.estado === e.value).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      <Header
        title="Labores"
        subtitle="Supervisión de labores agrícolas del fundo"
        action={
          <Link href="/labores/nueva" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Labor
          </Link>
        }
      />

      <div className="flex flex-wrap gap-3 mb-6">
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

        {parcelas.length > 0 && (
          <select
            className="input ml-auto w-auto text-sm"
            value={parcelaId ?? ''}
            onChange={(e) => {
              const v = e.target.value
              window.location.href = v ? `/labores?${estado ? `estado=${estado}&` : ''}parcelaId=${v}` : `/labores${estado ? `?estado=${estado}` : ''}`
            }}
          >
            <option value="">Todas las parcelas</option>
            {parcelas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Descripción</th>
              <th className="table-th">Tipo</th>
              <th className="table-th">Parcela</th>
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
                  <p className="text-sm text-gray-900">{labor.parcela.nombre}</p>
                  <p className="text-xs text-gray-400">{labor.parcela.cultivo}</p>
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
  )
}
