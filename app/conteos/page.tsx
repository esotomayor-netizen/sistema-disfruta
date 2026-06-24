import { prisma } from '@/lib/prisma'
import { getSession, isSupervisor } from '@/lib/session'
import Header from '@/components/Header'
import Link from 'next/link'
import { TIPOS_ESTRUCTURA, tipoEstructuraColor, labelFromValue, formatDate } from '@/lib/constants'
import ConteoPredioFilter from '@/components/ConteoPredioFilter'

export const dynamic = 'force-dynamic'

interface SearchParams { predioId?: string; tipoEstructura?: string }

export default async function ConteosPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession()
  if (!session) return null
  const { predioId, tipoEstructura } = searchParams

  const where = {
    ...(isSupervisor(session) ? {} : { tecnicoId: session.user.id }),
    ...(tipoEstructura ? { tipoEstructura: tipoEstructura as any } : {}),
    ...(predioId ? { rama: { arbol: { predioId: parseInt(predioId) } } } : {}),
  }

  const [conteos, predios, resumen] = await Promise.all([
    prisma.conteo.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: 100,
      include: { rama: { include: { arbol: { include: { predio: true } } } }, tecnico: true },
    }),
    prisma.predio.findMany({ where: { activa: true }, orderBy: { nombre: 'asc' }, select: { id: true, nombre: true } }),
    prisma.conteo.groupBy({
      by: ['tipoEstructura'],
      where: isSupervisor(session) ? {} : { tecnicoId: session.user.id },
      _sum: { cantidad: true },
    }),
  ])

  return (
    <div>
      <Header
        title="Conteos"
        subtitle="Conteo de dardos, carozos y otras estructuras en predios"
        action={
          <Link href="/conteos/nueva" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Conteo
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {TIPOS_ESTRUCTURA.map((t) => {
          const total = resumen.find((r) => r.tipoEstructura === t.value)?._sum.cantidad ?? 0
          return (
            <div key={t.value} className="card">
              <p className="text-xs text-gray-500">{t.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <a href="/conteos" className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${!tipoEstructura ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}>
          Todos
        </a>
        {TIPOS_ESTRUCTURA.map((t) => (
          <a key={t.value} href={`/conteos?tipoEstructura=${t.value}${predioId ? `&predioId=${predioId}` : ''}`} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${tipoEstructura === t.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}>
            {t.label}
          </a>
        ))}
        <ConteoPredioFilter predios={predios} tipoEstructura={tipoEstructura} predioId={predioId} />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Predio</th>
              <th className="table-th">Árbol</th>
              <th className="table-th">Rama</th>
              <th className="table-th">Tipo</th>
              <th className="table-th">Cantidad</th>
              <th className="table-th">Técnico</th>
              <th className="table-th">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {conteos.length === 0 && (
              <tr>
                <td colSpan={7} className="table-td text-center text-gray-400 py-10">
                  No hay conteos registrados con los filtros actuales.
                </td>
              </tr>
            )}
            {conteos.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-td">
                  <p className="font-medium text-gray-900">{c.rama.arbol.predio.nombre}</p>
                </td>
                <td className="table-td">{c.rama.arbol.codigo}</td>
                <td className="table-td">{c.rama.codigo}</td>
                <td className="table-td">
                  <span className={`badge ${tipoEstructuraColor(c.tipoEstructura)}`}>
                    {labelFromValue(TIPOS_ESTRUCTURA, c.tipoEstructura)}
                  </span>
                </td>
                <td className="table-td font-medium">{c.cantidad}</td>
                <td className="table-td">{c.tecnico ? `${c.tecnico.nombre} ${c.tecnico.apellido}` : '—'}</td>
                <td className="table-td whitespace-nowrap">{formatDate(c.fecha)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
