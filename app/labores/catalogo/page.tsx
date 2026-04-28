'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import { LABOR_TIPOS } from '@/lib/constants'

interface CatalogoItem {
  id: number
  grupo: string
  especie: string
  categoria: string
  labor: string
  descripcion: string
  prioridad: string
  mesesEjecucion: string
}

interface Predio { id: number; nombre: string; cultivo: string; activa: boolean }
interface Usuario { id: number; nombre: string; apellido: string; activo: boolean }

function categoriaToTipo(cat: string): string {
  const c = cat.toLowerCase()
  if (c.includes('cosecha')) return 'COSECHA'
  if (c.includes('poda')) return 'PODA'
  if (c.includes('riego')) return 'RIEGO'
  if (c.includes('nutri') || c.includes('suelo')) return 'FERTILIZACION'
  if (c.includes('sanidad') || c.includes('plaga')) return 'CONTROL_PLAGAS'
  return 'MANTENIMIENTO'
}

const prioridadColor = (p: string) =>
  p === 'Alta' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'

interface ActivarForm {
  predioId: string
  responsableId: string
  fecha: string
  observaciones: string
}

export default function CatalogoPage() {
  const router = useRouter()
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([])
  const [predios, setPredios] = useState<Predio[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [filtroEspecie, setFiltroEspecie] = useState('')
  const [activando, setActivando] = useState<CatalogoItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [successId, setSuccessId] = useState<number | null>(null)
  const [activarForm, setActivarForm] = useState<ActivarForm>({
    predioId: '',
    responsableId: '',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/catalogo').then((r) => r.json()),
      fetch('/api/predios').then((r) => r.json()),
      fetch('/api/equipo').then((r) => r.json()),
    ]).then(([cat, p, u]) => {
      setCatalogo(cat as CatalogoItem[])
      const pa = (p as Predio[]).filter((x) => x.activa)
      const ua = (u as Usuario[]).filter((x) => x.activo)
      setPredios(pa)
      setUsuarios(ua)
      if (pa.length) setActivarForm((f) => ({ ...f, predioId: String(pa[0].id) }))
      if (ua.length) setActivarForm((f) => ({ ...f, responsableId: String(ua[0].id) }))
    })
  }, [])

  const grupos = Array.from(new Set(catalogo.map((c) => c.grupo)))
  const especies = Array.from(
    new Set(catalogo.filter((c) => !filtroGrupo || c.grupo === filtroGrupo).map((c) => c.especie))
  )

  const filtered = catalogo.filter(
    (c) =>
      (!filtroGrupo || c.grupo === filtroGrupo) &&
      (!filtroEspecie || c.especie === filtroEspecie)
  )

  const porEspecie = filtered.reduce<Record<string, CatalogoItem[]>>((acc, item) => {
    if (!acc[item.especie]) acc[item.especie] = []
    acc[item.especie].push(item)
    return acc
  }, {})

  const handleActivar = (item: CatalogoItem) => {
    setActivando(item)
    setSuccessId(null)
  }

  const handleSubmitActivar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activando) return
    setSaving(true)
    try {
      const res = await fetch('/api/labores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: categoriaToTipo(activando.categoria),
          descripcion: `${activando.labor} — ${activando.especie}`,
          fecha: activarForm.fecha,
          estado: 'PENDIENTE',
          observaciones: activarForm.observaciones || activando.descripcion,
          predioId: activarForm.predioId,
          responsableId: activarForm.responsableId,
        }),
      })
      if (res.ok) {
        setSuccessId(activando.id)
        setActivando(null)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Header
        title="Catálogo de Labores"
        subtitle="Labores recomendadas por especie — selecciona y activa para asignar a un predio"
        action={
          <div className="flex gap-2">
            <Link href="/labores" className="btn-secondary">Ver Labores Activas →</Link>
          </div>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => { setFiltroGrupo(''); setFiltroEspecie('') }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${!filtroGrupo ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}
        >
          Todos ({catalogo.length})
        </button>
        {grupos.map((g) => (
          <button
            key={g}
            onClick={() => { setFiltroGrupo(g); setFiltroEspecie('') }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${filtroGrupo === g ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}
          >
            {g}
          </button>
        ))}
        {filtroGrupo && (
          <select
            className="input py-1.5 text-sm"
            value={filtroEspecie}
            onChange={(e) => setFiltroEspecie(e.target.value)}
          >
            <option value="">Todas las especies</option>
            {especies.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        )}
      </div>

      {/* Tablas por especie */}
      {Object.entries(porEspecie).map(([especie, items]) => (
        <div key={especie} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-gray-800">{especie}</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{items[0].grupo}</span>
          </div>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Categoría</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Labor</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Descripción</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Prioridad</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Meses</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 ${successId === item.id ? 'bg-green-50' : ''}`}>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap">
                        {item.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px]">{item.labor}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[280px]">{item.descripcion}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${prioridadColor(item.prioridad)}`}>{item.prioridad}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{item.mesesEjecucion}</td>
                    <td className="px-4 py-3">
                      {successId === item.id ? (
                        <span className="text-green-600 text-xs font-medium">✓ Activada</span>
                      ) : (
                        <button
                          onClick={() => handleActivar(item)}
                          className="btn-primary text-xs py-1 px-3"
                        >
                          Activar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {catalogo.length === 0 && (
        <div className="card text-center py-12 text-gray-400">
          Cargando catálogo…
        </div>
      )}

      {/* Modal de activación */}
      {activando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Activar labor</h3>
              <p className="text-sm text-gray-500 mt-0.5">{activando.labor} — {activando.especie}</p>
            </div>
            <form onSubmit={handleSubmitActivar} className="p-6 space-y-4">
              <div>
                <label className="label">Predio</label>
                <select
                  className="input"
                  required
                  value={activarForm.predioId}
                  onChange={(e) => setActivarForm({ ...activarForm, predioId: e.target.value })}
                >
                  <option value="">Seleccionar predio…</option>
                  {predios.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.cultivo})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Responsable</label>
                <select
                  className="input"
                  required
                  value={activarForm.responsableId}
                  onChange={(e) => setActivarForm({ ...activarForm, responsableId: e.target.value })}
                >
                  <option value="">Seleccionar responsable…</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Fecha de inicio</label>
                <input
                  className="input"
                  type="date"
                  required
                  value={activarForm.fecha}
                  onChange={(e) => setActivarForm({ ...activarForm, fecha: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Observaciones (opcional)</label>
                <textarea
                  className="input"
                  rows={2}
                  value={activarForm.observaciones}
                  onChange={(e) => setActivarForm({ ...activarForm, observaciones: e.target.value })}
                  placeholder={activando.descripcion}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando…' : 'Confirmar activación'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActivando(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
