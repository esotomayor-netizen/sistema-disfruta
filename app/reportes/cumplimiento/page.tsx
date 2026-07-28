import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import DateRangePicker from './DateRangePicker'

export const dynamic = 'force-dynamic'

function pctColor(pct: number) {
  if (pct >= 80) return 'bg-green-100 text-green-800'
  if (pct >= 50) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

export default async function CumplimientoPage({
  searchParams,
}: {
  searchParams: { desde?: string; hasta?: string }
}) {
  const now = new Date()
  const defaultDesde = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
  const defaultHasta = now.toISOString().slice(0, 10)

  const desdeStr = searchParams.desde ?? defaultDesde
  const hastaStr = searchParams.hasta ?? defaultHasta

  const desde = new Date(desdeStr + 'T00:00:00')
  const hasta = new Date(hastaStr + 'T23:59:59')

  const [usuarios, visitasGroup, agendasGroup, informesGroup] = await Promise.all([
    prisma.usuario.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    }),
    prisma.visita.groupBy({
      by: ['tecnicoId'],
      where: { fecha: { gte: desde, lte: hasta } },
      _count: { id: true },
    }),
    prisma.agendaVisita.groupBy({
      by: ['tecnicoId'],
      where: { fecha: { gte: desde, lte: hasta } },
      _count: { id: true },
    }),
    prisma.informeGenerado.groupBy({
      by: ['generadoPorId'],
      where: { createdAt: { gte: desde, lte: hasta } },
      _count: { id: true },
    }),
  ])

  const visitasMap = new Map(visitasGroup.map((v) => [v.tecnicoId, v._count.id]))
  const agendasMap = new Map(agendasGroup.map((a) => [a.tecnicoId, a._count.id]))
  const informesMap = new Map(informesGroup.map((i) => [i.generadoPorId, i._count.id]))

  const rows = usuarios.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    rol: u.rol,
    visitas: visitasMap.get(u.id) ?? 0,
    agendas: agendasMap.get(u.id) ?? 0,
    informes: informesMap.get(u.id) ?? 0,
  }))

  const totalVisitas = rows.reduce((s, r) => s + r.visitas, 0)
  const totalAgendas = rows.reduce((s, r) => s + r.agendas, 0)
  const totalInformes = rows.reduce((s, r) => s + r.informes, 0)
  const totalPct = totalAgendas > 0 ? Math.round((totalVisitas / totalAgendas) * 100) : null

  return (
    <div>
      <Header
        title="Reporte de Cumplimiento"
        subtitle="Visitas realizadas, informes emitidos y agendas programadas por usuario"
      />

      <DateRangePicker desde={desdeStr} hasta={hastaStr} />

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Usuario</th>
              <th className="table-th text-center">Visitas Realizadas</th>
              <th className="table-th text-center">Informes Emitidos</th>
              <th className="table-th text-center">Agendas Programadas</th>
              <th className="table-th text-center">Cumplimiento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="table-td text-center text-gray-400 py-12">
                  No hay usuarios activos registrados.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const pct = r.agendas > 0 ? Math.round((r.visitas / r.agendas) * 100) : null
              return (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td">
                    <p className="font-medium text-gray-900">
                      {r.nombre} {r.apellido}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{r.rol.toLowerCase()}</p>
                  </td>
                  <td className="table-td text-center">
                    <span className="text-sm font-semibold text-gray-900">{r.visitas}</span>
                  </td>
                  <td className="table-td text-center">
                    <span className="text-sm font-semibold text-blue-700">{r.informes}</span>
                  </td>
                  <td className="table-td text-center">
                    <span className="text-sm text-gray-600">{r.agendas}</span>
                  </td>
                  <td className="table-td text-center">
                    {pct === null ? (
                      <span className="text-xs text-gray-400">Sin agenda</span>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pctColor(pct)}`}
                      >
                        {pct}%
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="table-td font-semibold text-gray-700">Total del período</td>
                <td className="table-td text-center font-bold text-gray-900">{totalVisitas}</td>
                <td className="table-td text-center font-bold text-blue-700">{totalInformes}</td>
                <td className="table-td text-center font-semibold text-gray-700">{totalAgendas}</td>
                <td className="table-td text-center">
                  {totalPct !== null ? (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pctColor(totalPct)}`}
                    >
                      {totalPct}%
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
