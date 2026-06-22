import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EmpresasPage() {
  const empresas = await prisma.empresa.findMany({
    orderBy: { razonSocial: 'asc' },
    include: {
      tecnico: true,
      _count: { select: { predios: true } },
    },
  })

  return (
    <div>
      <Header
        title="Empresas"
        subtitle="Gestión de empresas y sus predios agrícolas"
        action={
          <Link href="/empresas/nueva" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Empresa
          </Link>
        }
      />

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Razón Social</th>
              <th className="table-th">RUT</th>
              <th className="table-th">Contacto</th>
              <th className="table-th">Técnico</th>
              <th className="table-th">Email</th>
              <th className="table-th">Teléfono</th>
              <th className="table-th">Predios</th>
              <th className="table-th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {empresas.length === 0 && (
              <tr>
                <td colSpan={8} className="table-td text-center text-gray-400 py-10">
                  No hay empresas registradas aún.
                </td>
              </tr>
            )}
            {empresas.map((empresa) => (
              <tr key={empresa.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-td">
                  <p className="font-medium text-gray-900">{empresa.razonSocial}</p>
                </td>
                <td className="table-td">
                  <span className="text-sm font-mono text-gray-700">{empresa.rut}</span>
                </td>
                <td className="table-td">
                  <p className="text-sm text-gray-900">{empresa.contactoNombre}</p>
                </td>
                <td className="table-td">
                  <p className="text-sm text-gray-700">
                    {empresa.tecnico ? `${empresa.tecnico.nombre} ${empresa.tecnico.apellido}` : <span className="text-gray-400">—</span>}
                  </p>
                </td>
                <td className="table-td">
                  {empresa.contactoEmail ? (
                    <a href={`mailto:${empresa.contactoEmail}`} className="text-sm text-primary-600 hover:text-primary-700">
                      {empresa.contactoEmail}
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>
                <td className="table-td">
                  <p className="text-sm text-gray-700">{empresa.contactoTelefono ?? '—'}</p>
                </td>
                <td className="table-td">
                  <span className="badge bg-blue-100 text-blue-800">
                    {empresa._count.predios} {empresa._count.predios === 1 ? 'predio' : 'predios'}
                  </span>
                </td>
                <td className="table-td">
                  <Link href={`/empresas/${empresa.id}/editar`} className="text-primary-600 hover:text-primary-700 text-xs font-medium">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {empresas.length === 0 && (
        <div className="mt-6 text-center">
          <Link href="/empresas/nueva" className="btn-primary inline-flex">
            Crear primera empresa
          </Link>
        </div>
      )}
    </div>
  )
}
