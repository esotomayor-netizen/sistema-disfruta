'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  group: string
}

const nav: NavItem[] = [
  // ── Vista General ─────────────────────────────────────────
  {
    href: '/cosecha',
    label: 'Dashboard General',
    group: 'Vista General',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  // ── Planificación ─────────────────────────────────────────
  {
    href: '/cosecha/planificacion',
    label: 'Planificación Semanal',
    group: 'Planificación',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/cosecha/real-vs-plan',
    label: 'Real vs Planificado',
    group: 'Planificación',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  // ── Compromisos Comerciales ────────────────────────────────
  {
    href: '/cosecha/clientes',
    label: 'Compromisos Clientes',
    group: 'Compromisos Comerciales',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  // ── Finanzas ──────────────────────────────────────────────
  {
    href: '/cosecha/retorno',
    label: 'Retorno Económico',
    group: 'Finanzas',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-primary-900 flex flex-col">
      {/* Branding */}
      <div className="px-6 py-5 border-b border-primary-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center text-lg">
            🍒
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">DISFRUTA</p>
            <p className="text-primary-400 text-xs leading-tight">× Lecaros Cox</p>
          </div>
        </div>
        <div className="mt-3">
          <span className="inline-block bg-primary-700 text-primary-200 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Temporada 2026–2027
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {Array.from(new Set(nav.map((i) => i.group))).map((group) => (
          <div key={group} className="mb-5">
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-500">
              {group}
            </p>
            <div className="space-y-0.5">
              {nav.filter((i) => i.group === group).map((item) => {
                const active =
                  item.href === '/cosecha'
                    ? pathname === '/cosecha'
                    : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                      active
                        ? 'bg-primary-700 text-white'
                        : 'text-primary-300 hover:bg-primary-800 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-primary-800">
        <p className="text-primary-500 text-xs">Región VI O&apos;Higgins · VII Maule</p>
        <p className="text-primary-600 text-xs mt-0.5">© 2026 Disfruta Exportaciones</p>
      </div>
    </aside>
  )
}
