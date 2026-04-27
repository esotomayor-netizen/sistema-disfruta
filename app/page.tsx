import { prisma } from '@/lib/prisma'
import StatCard from '@/components/StatCard'
import {
  estadoLaborColor,
  estadoAplicacionColor,
  tipoProductoColor,
  formatDate,
  labelFromValue,
  LABOR_TIPOS,
  TIPOS_PRODUCTO,
} from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [
    prediosActivos,
    totalTecnicos,
    laboresActivas,
    aplicacionesMes,
    ultimasLabores,
    ultimasAplicaciones,
    laborPorEstado,
  ] = await Promise.all([
    prisma.predio.count({ where: { activa: true } }),
    prisma.usuario.count({ where: { activo: true } }),
    prisma.labor.count({ where: { estado: { in: ['PENDIENTE', 'EN_PROGRESO'] } } }),
    prisma.aplicacion.count({
      where: {
        fecha: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.labor.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { predio: true, responsable: true },
    }),
    prisma.aplicacion.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { predio: true, tecnico: true },
    }),
    prisma.labor.groupBy({ by: ['estado'], _count: { estado: true } }),
  ])

  const estadoCount = Object.fromEntries(laborPorEstado.map((r) => [r.estado, r._count.estado]))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen general de operaciones del fundo</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Predios Activos"
          value={prediosActivos}
          subtitle="en producción"
          color="green"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          }
        />
        <StatCard
          title="Labores Activas"
          value={laboresActivas}
          subtitle="pendientes o en progreso"
          color="blue"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          title="Aplicaciones del Mes"
          value={aplicacionesMes}
          subtitle="este mes"
          color="purple"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
        />
        <StatCard
          title="Equipo Técnico"
          value={totalTecnicos}
          subtitle="miembros activos"
          color="orange"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pendientes', estado: 'PENDIENTE', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
          { label: 'En Progreso', estado: 'EN_PROGRESO', color: 'bg-blue-100 text-blue-800 border-blue-200' },
          { label: 'Completadas', estado: 'COMPLETADA', color: 'bg-green-100 text-green-800 border-green-200' },
          { label: 'Canceladas', estado: 'CANCELADA', color: 'bg-red-100 text-red-800 border-red-200' },
        ].map((item) => (
          <div key={item.estado} className={`rounded-xl border p-4 text-center ${item.color}`}>
            <p className="text-2xl font-bold">{estadoCount[item.estado] ?? 0}</p>
            <p className="text-xs font-medium mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Últimas Labores</h2>
            <a href="/labores" className="text-primary-600 hover:text-primary-700 text-xs font-medium">
              Ver todas →
            </a>
          </div>
          <div className="space-y-3">
            {ultimasLabores.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">Sin labores registradas</p>
            )}
            {ultimasLabores.map((labor) => (
              <div key={labor.id} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{labor.descripcion}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {labelFromValue(LABOR_TIPOS, labor.tipo)} · {labor.predio.nombre} · {labor.responsable.nombre} {labor.responsable.apellido}
                  </p>
                </div>
                <div className="ml-3 flex flex-col items-end gap-1">
                  <span className={`badge ${estadoLaborColor(labor.estado)}`}>
                    {labor.estado.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(labor.fecha)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Últimas Aplicaciones</h2>
            <a href="/aplicaciones" className="text-primary-600 hover:text-primary-700 text-xs font-medium">
              Ver todas →
            </a>
          </div>
          <div className="space-y-3">
            {ultimasAplicaciones.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">Sin aplicaciones registradas</p>
            )}
            {ultimasAplicaciones.map((ap) => (
              <div key={ap.id} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{ap.producto}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {ap.dosis} {ap.unidad} · {ap.predio.nombre} · {ap.tecnico.nombre} {ap.tecnico.apellido}
                  </p>
                </div>
                <div className="ml-3 flex flex-col items-end gap-1">
                  <span className={`badge ${tipoProductoColor(ap.tipoProducto)}`}>
                    {labelFromValue(TIPOS_PRODUCTO, ap.tipoProducto)}
                  </span>
                  <span className={`badge ${estadoAplicacionColor(ap.estado)}`}>
                    {ap.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
