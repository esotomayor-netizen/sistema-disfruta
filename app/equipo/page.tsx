import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import Link from 'next/link'
import { labelFromValue, ROLES_USUARIO, ROLES_ENCARGADO } from '@/lib/constants'
import SetPasswordButton from '@/components/SetPasswordButton'
import DeleteUsuarioButton from '@/components/DeleteUsuarioButton'

export const dynamic = 'force-dynamic'

const rolColor: Record<string, string> = {
  SUPERVISOR: 'bg-purple-100 text-purple-800',
  TECNICO: 'bg-blue-100 text-blue-800',
  APLICADOR: 'bg-orange-100 text-orange-800',
  ENCARGADO: 'bg-green-100 text-green-800',
}

const rolInitial: Record<string, string> = {
  SUPERVISOR: 'S',
  TECNICO: 'T',
  APLICADOR: 'A',
  ENCARGADO: 'E',
}

const rolBgAvatar: Record<string, string> = {
  SUPERVISOR: 'bg-purple-600',
  TECNICO: 'bg-blue-600',
  APLICADOR: 'bg-orange-500',
  ENCARGADO: 'bg-green-600',
}

const TODOS_LOS_ROLES = [...ROLES_USUARIO, ...ROLES_ENCARGADO]

export default async function EquipoPage() {
  const usuarios = await prisma.usuario.findMany({
    orderBy: { apellido: 'asc' },
    include: {
      _count: { select: { labores: true, aplicaciones: true } },
    },
  })

  const activos = usuarios.filter((u) => u.activo)
  const inactivos = usuarios.filter((u) => !u.activo)

  return (
    <div>
      <Header
        title="Equipo Técnico"
        subtitle="Gestión de supervisores, técnicos y aplicadores"
        action={
          <Link href="/equipo/nuevo" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Miembro
          </Link>
        }
      />

      {activos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Activos ({activos.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activos.map((u) => (
              <div key={u.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-11 h-11 rounded-full ${rolBgAvatar[u.rol] ?? 'bg-gray-500'} flex items-center justify-center text-white font-bold text-lg`}>
                    {rolInitial[u.rol] ?? u.nombre[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{u.nombre} {u.apellido}</p>
                    <span className={`badge ${rolColor[u.rol] ?? 'bg-gray-100 text-gray-800'}`}>
                      {labelFromValue(TODOS_LOS_ROLES, u.rol)}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600 border-t border-gray-100 pt-3">
                  <p className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {u.email}
                  </p>
                  {u.telefono && (
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {u.telefono}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  <span>{u._count.labores} labores · {u._count.aplicaciones} aplicaciones</span>
                  <div className="flex items-center gap-3">
                    <SetPasswordButton userId={u.id} userName={u.nombre} />
                    <Link href={`/equipo/${u.id}/editar`} className="text-primary-600 hover:text-primary-700 font-medium">
                      Editar →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inactivos.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Inactivos ({inactivos.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-60">
            {inactivos.map((u) => (
              <div key={u.id} className="card border-dashed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                    {u.nombre[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">{u.nombre} {u.apellido}</p>
                    <p className="text-xs text-gray-400">{labelFromValue(TODOS_LOS_ROLES, u.rol)}</p>
                  </div>
                  <Link href={`/equipo/${u.id}/editar`} className="text-xs text-primary-600 hover:text-primary-700">Editar</Link>
                  <DeleteUsuarioButton userId={u.id} userName={`${u.nombre} ${u.apellido}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {usuarios.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-400">No hay miembros del equipo registrados.</p>
          <Link href="/equipo/nuevo" className="btn-primary mt-4 inline-flex">Agregar primer miembro</Link>
        </div>
      )}
    </div>
  )
}
