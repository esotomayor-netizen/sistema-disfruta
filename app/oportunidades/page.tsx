import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const estadoColor: Record<string, string> = {
  NUEVO: 'bg-blue-100 text-blue-800',
  EN_CONTACTO: 'bg-yellow-100 text-yellow-800',
  INTERESADO: 'bg-green-100 text-green-800',
  CERRADO: 'bg-gray-100 text-gray-600',
}

const estadoLabel: Record<string, string> = {
  NUEVO: 'Nuevo',
  EN_CONTACTO: 'En Contacto',
  INTERESADO: 'Interesado',
  CERRADO: 'Cerrado',
}

export default async function OportunidadesPage() {
  const oportunidades = await prisma.oportunidad.findMany({
    orderBy: { createdAt: 'desc' },
    include: { tecnico: true },
  })

  return (
    <div>
      <Header
        title="Oportunidades"
        subtitle="Posibles nuevos productores visitados"
        action={
          <Link href="/oportunidades/nueva" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Oportunidad
          </Link>
        }
      />

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Contacto</th>
              <th className="table-th">Teléfono</th>
              <th className="table-th">Ubicación</th>
              <th className="table-th">Técnico</th>
              <th className="table-th">Estado</th>
              <th className="table-th">Fecha</th>
              <th className="table-th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {oportunidades.length === 0 && (
              <tr>
                <td colSpan={7} className="table-td text-center text-gray-400 py-12">
                  No hay oportunidades registradas. Agrega la primera con el botón de arriba.
                </td>
              </tr>
            )}
            {oportunidades.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-td">
                  <p className="font-medium text-gray-900">{o.nombre}</p>
                  {o.notas && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{o.notas}</p>}
                </td>
                <td className="table-td text-sm text-gray-700">
                  {o.telefono ? (
                    <a href={`tel:${o.telefono}`} className="text-primary-600 hover:underline">{o.telefono}</a>
                  ) : '—'}
                </td>
                <td className="table-td text-sm text-gray-700">
                  {o.latitud && o.longitud ? (
                    <a
                      href={`https://maps.google.com/?q=${o.latitud},${o.longitud}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline text-xs"
                    >
                      Ver en mapa ↗
                    </a>
                  ) : o.ubicacion ? (
                    <span className="text-xs">{o.ubicacion}</span>
                  ) : '—'}
                </td>
                <td className="table-td text-sm text-gray-700">
                  {o.tecnico.nombre} {o.tecnico.apellido}
                </td>
                <td className="table-td">
                  <span className={`badge ${estadoColor[o.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                    {estadoLabel[o.estado] ?? o.estado}
                  </span>
                </td>
                <td className="table-td text-sm text-gray-500 whitespace-nowrap">
                  {new Date(o.createdAt).toLocaleDateString('es-CL')}
                </td>
                <td className="table-td">
                  <Link href={`/oportunidades/${o.id}`} className="text-primary-600 hover:text-primary-700 text-xs font-medium">
                    Ver →
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
