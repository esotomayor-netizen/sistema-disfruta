import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PrediosPage() {
  const predios = await prisma.predio.findMany({
    orderBy: { nombre: 'asc' },
    include: {
      empresa: true,
      encargado: true,
      _count: { select: { labores: true, aplicaciones: true } },
    },
  })

  return (
    <div>
      <Header
        title="Predios"
        subtitle="Gestión de predios y superficies agrícolas"
        action={
          <Link href="/predios/nueva" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Predio
          </Link>
        }
      />

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Nombre</th>
              <th className="table-th">CSG</th>
              <th className="table-th">Empresa</th>
              <th className="table-th">Encargado</th>
              <th className="table-th">Cultivo / Variedades</th>
              <th className="table-th">Superficie</th>
              <th className="table-th">Estado</th>
              <th className="table-th">Actividad</th>
              <th className="table-th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {predios.length === 0 && (
              <tr>
                <td colSpan={9} className="table-td text-center text-gray-400 py-10">
                  No hay predios registrados aún.
                </td>
              </tr>
            )}
            {predios.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-td">
                  <p className="font-medium text-gray-900">{p.nombre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.ubicacion}</p>
                </td>
                <td className="table-td">
                  <span className="text-sm font-mono text-gray-700">{p.csg}</span>
                </td>
                <td className="table-td">
                  <p className="text-sm text-gray-900">{p.empresa.razonSocial}</p>
                </td>
                <td className="table-td">
                  {p.encargado ? (
                    <p className="text-sm text-gray-900">{p.encargado.nombre} {p.encargado.apellido}</p>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>
                <td className="table-td">
                  <p className="text-sm font-medium text-gray-900">{p.cultivo}</p>
                  {p.variedades && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.variedades.split(',').map((v) => (
                        <span key={v} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="table-td whitespace-nowrap">
                  <p className="text-sm text-gray-900">{p.superficie} ha</p>
                </td>
                <td className="table-td">
                  <span className={`badge ${p.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {p.activa ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="table-td">
                  <p className="text-xs text-gray-500">{p._count.labores} labores</p>
                  <p className="text-xs text-gray-500">{p._count.aplicaciones} aplic.</p>
                </td>
                <td className="table-td">
                  <Link href={`/predios/${p.id}/editar`} className="text-primary-600 hover:text-primary-700 text-xs font-medium">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {predios.length === 0 && (
        <div className="mt-6 text-center">
          <Link href="/predios/nueva" className="btn-primary inline-flex">
            Crear primer predio
          </Link>
        </div>
      )}
    </div>
  )
}
