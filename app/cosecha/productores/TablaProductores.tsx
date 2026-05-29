'use client'

import { useState } from 'react'
import { Productor, ProgramacionRow } from '@/lib/cosecha-data'

const VARIEDAD_COLORS: Record<string, string> = {
  Santina:      'bg-pink-100 text-pink-700',
  Lapins:       'bg-green-100 text-green-700',
  Regina:       'bg-purple-100 text-purple-700',
  Bing:         'bg-red-100 text-red-700',
  'Sweet Heart':'bg-rose-100 text-rose-700',
  Brooks:       'bg-orange-100 text-orange-700',
  Van:          'bg-yellow-100 text-yellow-700',
  Kordia:       'bg-teal-100 text-teal-700',
  'Royal Dawn': 'bg-amber-100 text-amber-700',
  Skeena:       'bg-cyan-100 text-cyan-700',
  Frisco:       'bg-indigo-100 text-indigo-700',
}

function fmtKg(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + ' M kg'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + ' t'
  return n.toLocaleString('es-CL') + ' kg'
}

export default function TablaProductores({
  productores,
  programacion,
}: {
  productores: Productor[]
  programacion: ProgramacionRow[]
}) {
  const [filtro, setFiltro] = useState('')

  const filtrados = filtro.trim()
    ? productores.filter((p) =>
        p.razonSocial.toLowerCase().includes(filtro.toLowerCase()) ||
        p.nombreHuerto.toLowerCase().includes(filtro.toLowerCase()) ||
        p.comuna.toLowerCase().includes(filtro.toLowerCase())
      )
    : productores

  function getKgProductor(p: Productor): number {
    return programacion
      .filter((r) => r.productor === p.nombreHuerto || r.productor === p.razonSocial.split(' ')[0])
      .reduce((s, r) => s + r.totalKg, 0)
  }

  return (
    <>
      {/* Buscador */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por razón social, huerto o comuna..."
          className="input max-w-md"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">#</th>
                <th className="table-th">Razón Social</th>
                <th className="table-th">Nombre Huerto</th>
                <th className="table-th">Comuna</th>
                <th className="table-th">Región</th>
                <th className="table-th">CSG</th>
                <th className="table-th">Especie</th>
                <th className="table-th">Variedades</th>
                <th className="table-th text-right">KG Programados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((p) => {
                const kg = getKgProductor(p)
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td text-gray-400 font-mono text-xs">{p.id}</td>
                    <td className="table-td font-medium text-gray-900 max-w-[200px] truncate" title={p.razonSocial}>
                      {p.razonSocial}
                    </td>
                    <td className="table-td font-semibold text-primary-700">{p.nombreHuerto}</td>
                    <td className="table-td">{p.comuna}</td>
                    <td className="table-td text-xs text-gray-500">{p.region}</td>
                    <td className="table-td font-mono text-xs text-gray-500">{p.csg}</td>
                    <td className="table-td">
                      <span className="badge bg-red-50 text-red-700">{p.especie}</span>
                    </td>
                    <td className="table-td">
                      <div className="flex flex-wrap gap-1">
                        {p.variedades.length === 0 ? (
                          <span className="text-gray-400 text-xs italic">—</span>
                        ) : (
                          p.variedades.map((v) => (
                            <span
                              key={v}
                              className={`badge ${VARIEDAD_COLORS[v] ?? 'bg-gray-100 text-gray-600'}`}
                            >
                              {v}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="table-td text-right font-semibold text-green-700">
                      {kg > 0 ? fmtKg(kg) : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          Mostrando {filtrados.length} de {productores.length} productores
        </div>
      </div>
    </>
  )
}
