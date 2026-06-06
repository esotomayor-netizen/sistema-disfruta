'use client'
import { useState } from 'react'
import { ETAPAS, type Caracter, type ProductoPrograma } from '@/lib/programa-data'

const caracterColor: Record<Caracter, string> = {
  FIJA: 'bg-green-100 text-green-800 border-green-200',
  VARIABLE: 'bg-amber-100 text-amber-800 border-amber-200',
}

function ProductoCard({ p }: { p: ProductoPrograma }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${caracterColor[p.caracter]}`}>
          {p.caracter}
        </span>
        <span className="text-sm text-gray-600 font-medium">{p.tratamiento}</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Producto</p>
          <p className="font-semibold text-gray-900">{p.producto}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Ingrediente activo</p>
          <p className="text-gray-700">{p.ingredienteActivo}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Concentración</p>
          <p className="text-gray-700">{p.concentracion}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Mojamiento</p>
            <p className="text-gray-700">{p.mojamiento}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Dosis/ha</p>
            <p className="text-gray-700 font-medium">{p.dosisHa}</p>
          </div>
        </div>
      </div>
      {p.alternativas && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <span className="font-medium text-gray-600">Alternativas: </span>
            {p.alternativas}
          </p>
        </div>
      )}
      {p.observaciones && (
        <div className={`mt-2 ${p.alternativas ? '' : 'mt-3 pt-3 border-t border-gray-100'}`}>
          <p className="text-xs text-orange-700 italic">⚠ {p.observaciones}</p>
        </div>
      )}
    </div>
  )
}

export default function ProgramaPage() {
  const [etapaId, setEtapaId] = useState(ETAPAS[0].id)
  const etapa = ETAPAS.find((e) => e.id === etapaId)!

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Programa Fitosanitario</h1>
        <p className="text-gray-500 text-sm mt-1">Cerezas — Temporada 26-27</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar de etapas — desktop */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-primary-900 text-primary-50">
              <p className="text-xs font-semibold uppercase tracking-wide">Estado Fenológico</p>
            </div>
            <nav className="p-2 space-y-0.5 max-h-[calc(100vh-200px)] overflow-y-auto">
              {ETAPAS.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setEtapaId(e.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    etapaId === e.id
                      ? 'bg-primary-700 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <p className="text-sm font-medium leading-tight">{e.etapa}</p>
                  <p className={`text-xs mt-0.5 ${etapaId === e.id ? 'text-primary-200' : 'text-gray-400'}`}>
                    {e.fecha}
                  </p>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Selector mobile */}
        <div className="lg:hidden">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seleccionar estado fenológico
          </label>
          <select
            value={etapaId}
            onChange={(e) => setEtapaId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {ETAPAS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.etapa} — {e.fecha}
              </option>
            ))}
          </select>
        </div>

        {/* Panel de productos */}
        <div className="flex-1 min-w-0">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">{etapa.etapa}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Fecha estimada: <span className="font-medium text-gray-700">{etapa.fecha}</span>
              <span className="ml-3 text-gray-400">·</span>
              <span className="ml-3">{etapa.productos.length} producto{etapa.productos.length !== 1 ? 's' : ''} recomendado{etapa.productos.length !== 1 ? 's' : ''}</span>
            </p>
          </div>
          <div className="space-y-3">
            {etapa.productos.map((p, i) => (
              <ProductoCard key={i} p={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
