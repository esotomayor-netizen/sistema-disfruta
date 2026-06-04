import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import Link from 'next/link'
import { formatDate } from '@/lib/constants'

export const dynamic = 'force-dynamic'

const estadoColor: Record<string, string> = {
  EN_PROGRESO: 'bg-blue-100 text-blue-800',
  COMPLETADA: 'bg-green-100 text-green-800',
}

export default async function VisitasPage() {
  const visitas = await prisma.visita.findMany({
    orderBy: { fecha: 'desc' },
    include: {
      predio: { include: { empresa: true } },
      tecnico: true,
      _count: { select: { labores: true, aplicaciones: true } },
    },
  })

  return (
    <div>
      <Header
        title="Visitas a Predios"
        subtitle="Registro de visitas técnicas y actividades realizadas"
        action={
          <Link href="/visitas/nueva" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Visita
          </Link>
        }
      />

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Fecha</th>
              <th className="table-th">Predio</th>
              <th className="table-th">Empresa</th>
              <th className="table-th">Técnico</th>
              <th className="table-th">Actividad</th>
              <th className="table-th">Estado</th>
              <th className="table-th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visitas.length === 0 && (
              <tr>
                <td colSpan={7} className="table-td text-center text-gray-400 py-12">
                  No hay visitas registradas aún.
                </td>
              </tr>
            )}
            {visitas.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-td whitespace-nowrap font-medium text-gray-900">
                  {formatDate(v.fecha)}
                </td>
                <td className="table-td">
                  <p className="font-medium text-gray-900">{v.predio.nombre}</p>
                  <p className="text-xs text-gray-400">{v.predio.cultivo} · CSG {v.predio.csg}</p>
                </td>
                <td className="table-td text-sm text-gray-700">
                  {v.predio.empresa.razonSocial}
                </td>
                <td className="table-td text-sm text-gray-700">
                  {v.tecnico.nombre} {v.tecnico.apellido}
                </td>
                <td className="table-td text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{v._count.labores}</span> labores ·{' '}
                  <span className="font-medium text-gray-700">{v._count.aplicaciones}</span> aplicaciones
                </td>
                <td className="table-td">
                  <span className={`badge ${estadoColor[v.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                    {v.estado.replace('_', ' ')}
                  </span>
                </td>
                <td className="table-td">
                  <Link href={`/visitas/${v.id}`} className="text-primary-600 hover:text-primary-700 text-xs font-medium">
                    Ver detalle →
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
