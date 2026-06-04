import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PrediosPage() {
  const predios = await prisma.predio.findMany({
    orderBy: { nombre: 'asc' },
    include: { _count: { select: { labores: true, aplicaciones: true } } },
  })

  return (
    <div>
      <Header
        title="Predios"
        subtitle="Gestión de predios y superficies del fundo"
        action={
          <Link href="/predios/nueva" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Predio
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {predios.map((p) => (
          <div key={p.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{p.nombre}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{p.ubicacion}</p>
              </div>
              <span className={`badge ${p.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {p.activa ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-100 mb-3">
              <div>
                <p className="text-xs text-gray-400">Cultivo</p>
                <p className="text-sm font-medium text-gray-900">{p.cultivo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Superficie</p>
                <p className="text-sm font-medium text-gray-900">{p.superficie} ha</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{p._count.labores} labores</span>
              <span>{p._count.aplicaciones} aplicaciones</span>
              <Link href={`/predios/${p.id}/editar`} className="text-primary-600 hover:text-primary-700 font-medium">
                Editar →
              </Link>
            </div>
          </div>
        ))}
        {predios.length === 0 && (
          <div className="col-span-3 card text-center py-12">
            <p className="text-gray-400">No hay predios registrados aún.</p>
            <Link href="/predios/nueva" className="btn-primary mt-4 inline-flex">Crear primer predio</Link>
          </div>
        )}
      </div>
    </div>
  )
}
