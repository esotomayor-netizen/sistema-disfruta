'use client'

import { useState } from 'react'
import { TEMPORADA, fmtKg } from '@/lib/cosecha-data'

type Estado = 'PENDIENTE' | 'CONFIRMADO' | 'EN_TRANSITO' | 'ENTREGADO'

interface EmbarqueRow {
  id: number
  nContenedor: string
  clienteDestino: string
  paisDestino: string
  naviera: string
  fechaZarpe: string
  puertoOrigen: string
  puertoDestino: string
  semCosecha: string
  variedad: string
  kgEmbarque: number
  calibreEmbarque: string
  estado: Estado
}

const EMBARQUES_INICIALES: EmbarqueRow[] = [
  { id: 1, nContenedor: 'TCKU3456781', clienteDestino: 'Shinemore HK Ltd', paisDestino: 'China',    naviera: 'Cosco Shipping', fechaZarpe: '2026-12-01', puertoOrigen: 'San Antonio', puertoDestino: 'Shanghai',  semCosecha: 'Sem 47-48', variedad: 'LAPINS',  kgEmbarque: 18000, calibreEmbarque: '5J+4J', estado: 'PENDIENTE'   },
  { id: 2, nContenedor: 'MSCU8812340', clienteDestino: 'Fresh Asia KK',    paisDestino: 'Japón',    naviera: 'MSC',            fechaZarpe: '2026-12-08', puertoOrigen: 'Valparaíso',  puertoDestino: 'Osaka',     semCosecha: 'Sem 48-49', variedad: 'SANTINA', kgEmbarque: 13000, calibreEmbarque: '4J+3J', estado: 'PENDIENTE'   },
  { id: 3, nContenedor: 'HLXU2209871', clienteDestino: 'Metro Fruits EU',  paisDestino: 'Alemania', naviera: 'Hapag-Lloyd',    fechaZarpe: '2026-12-15', puertoOrigen: 'San Antonio', puertoDestino: 'Hamburgo',  semCosecha: 'Sem 49-50', variedad: 'KORDIA',  kgEmbarque: 11000, calibreEmbarque: '5J',    estado: 'PENDIENTE'   },
]

const ESTADO_CONFIG: Record<Estado, { label: string; color: string; icon: string }> = {
  PENDIENTE:    { label: 'Pendiente',    color: 'bg-gray-100 text-gray-600',    icon: '⏳' },
  CONFIRMADO:   { label: 'Confirmado',   color: 'bg-blue-100 text-blue-700',    icon: '✅' },
  EN_TRANSITO:  { label: 'En tránsito',  color: 'bg-amber-100 text-amber-700',  icon: '🚢' },
  ENTREGADO:    { label: 'Entregado',    color: 'bg-green-100 text-green-700',  icon: '📬' },
}

const PAIS_FLAG: Record<string, string> = {
  China: '🇨🇳', Japón: '🇯🇵', Alemania: '🇩🇪', EEUU: '🇺🇸', España: '🇪🇸', Italia: '🇮🇹',
}

export default function LogisticaPage() {
  const [embarques, setEmbarques] = useState<EmbarqueRow[]>(EMBARQUES_INICIALES)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<EmbarqueRow>>({
    estado: 'PENDIENTE', puertoOrigen: 'San Antonio', kgEmbarque: 0,
  })

  const totalKg = embarques.reduce((s, e) => s + e.kgEmbarque, 0)
  const porEstado = (e: Estado) => embarques.filter((r) => r.estado === e).length

  function agregarEmbarque() {
    if (!form.nContenedor || !form.clienteDestino) return
    const nuevo: EmbarqueRow = {
      id: embarques.length + 1,
      nContenedor: form.nContenedor ?? '',
      clienteDestino: form.clienteDestino ?? '',
      paisDestino: form.paisDestino ?? '',
      naviera: form.naviera ?? '',
      fechaZarpe: form.fechaZarpe ?? '',
      puertoOrigen: form.puertoOrigen ?? 'San Antonio',
      puertoDestino: form.puertoDestino ?? '',
      semCosecha: form.semCosecha ?? '',
      variedad: form.variedad ?? '',
      kgEmbarque: form.kgEmbarque ?? 0,
      calibreEmbarque: form.calibreEmbarque ?? '',
      estado: (form.estado as Estado) ?? 'PENDIENTE',
    }
    setEmbarques((prev) => [...prev, nuevo])
    setForm({ estado: 'PENDIENTE', puertoOrigen: 'San Antonio', kgEmbarque: 0 })
    setShowForm(false)
  }

  function cambiarEstado(id: number, estado: Estado) {
    setEmbarques((prev) => prev.map((e) => e.id === id ? { ...e, estado } : e))
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <a href="/cosecha" className="text-gray-400 hover:text-gray-600 text-sm">← Inicio</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600 font-medium">Logística y Embarques</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚢</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Logística y Embarques</h1>
              <p className="text-gray-500 text-sm mt-1">Temporada {TEMPORADA} · Contenedores, navieras, zarpes y destinos</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            + Nuevo Embarque
          </button>
        </div>
      </div>

      {/* KPIs estado */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{embarques.length}</p>
          <p className="text-sm text-gray-500 mt-1">Contenedores totales</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-700">{fmtKg(totalKg)}</p>
          <p className="text-sm text-gray-500 mt-1">KG embarcados</p>
        </div>
        <div className="card">
          <div className="flex justify-around">
            {(['PENDIENTE', 'CONFIRMADO', 'EN_TRANSITO', 'ENTREGADO'] as Estado[]).map((e) => (
              <div key={e} className="text-center">
                <p className="text-lg font-bold">{ESTADO_CONFIG[e].icon}</p>
                <p className="text-lg font-bold text-gray-900">{porEstado(e)}</p>
                <p className="text-[10px] text-gray-400">{ESTADO_CONFIG[e].label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-purple-700">
            {Array.from(new Set(embarques.map((e) => e.paisDestino))).length}
          </p>
          <p className="text-sm text-gray-500 mt-1">Países destino</p>
        </div>
      </div>

      {/* Formulario nuevo embarque */}
      {showForm && (
        <div className="card mb-6 border-2 border-primary-200 bg-primary-50/30">
          <h3 className="font-semibold text-gray-900 mb-4">Registrar Nuevo Embarque</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">N° Contenedor</label>
              <input className="input" placeholder="XXXX1234567" value={form.nContenedor ?? ''} onChange={(e) => setForm((p) => ({ ...p, nContenedor: e.target.value }))} />
            </div>
            <div>
              <label className="label">Cliente Destino</label>
              <input className="input" placeholder="Nombre cliente" value={form.clienteDestino ?? ''} onChange={(e) => setForm((p) => ({ ...p, clienteDestino: e.target.value }))} />
            </div>
            <div>
              <label className="label">País Destino</label>
              <input className="input" placeholder="China, Japón..." value={form.paisDestino ?? ''} onChange={(e) => setForm((p) => ({ ...p, paisDestino: e.target.value }))} />
            </div>
            <div>
              <label className="label">Naviera</label>
              <input className="input" placeholder="Cosco, MSC..." value={form.naviera ?? ''} onChange={(e) => setForm((p) => ({ ...p, naviera: e.target.value }))} />
            </div>
            <div>
              <label className="label">Fecha Zarpe</label>
              <input className="input" type="date" value={form.fechaZarpe ?? ''} onChange={(e) => setForm((p) => ({ ...p, fechaZarpe: e.target.value }))} />
            </div>
            <div>
              <label className="label">Puerto Origen</label>
              <select className="input" value={form.puertoOrigen ?? ''} onChange={(e) => setForm((p) => ({ ...p, puertoOrigen: e.target.value }))}>
                <option>San Antonio</option>
                <option>Valparaíso</option>
              </select>
            </div>
            <div>
              <label className="label">Puerto Destino</label>
              <input className="input" placeholder="Shanghai, Osaka..." value={form.puertoDestino ?? ''} onChange={(e) => setForm((p) => ({ ...p, puertoDestino: e.target.value }))} />
            </div>
            <div>
              <label className="label">Semana Cosecha</label>
              <input className="input" placeholder="Sem 47-48" value={form.semCosecha ?? ''} onChange={(e) => setForm((p) => ({ ...p, semCosecha: e.target.value }))} />
            </div>
            <div>
              <label className="label">Variedad</label>
              <select className="input" value={form.variedad ?? ''} onChange={(e) => setForm((p) => ({ ...p, variedad: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {['LAPINS','SANTINA','REGINA','BING','SWEET HEART','BROOKS','VAN','KORDIA','ROYAL DAWN','SKEENA','FRISCO'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">KG Embarque</label>
              <input className="input" type="number" min="0" step="1000" value={form.kgEmbarque ?? ''} onChange={(e) => setForm((p) => ({ ...p, kgEmbarque: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="label">Calibre</label>
              <input className="input" placeholder="5J+4J, 3J..." value={form.calibreEmbarque ?? ''} onChange={(e) => setForm((p) => ({ ...p, calibreEmbarque: e.target.value }))} />
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="input" value={form.estado ?? 'PENDIENTE'} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value as Estado }))}>
                <option value="PENDIENTE">Pendiente</option>
                <option value="CONFIRMADO">Confirmado</option>
                <option value="EN_TRANSITO">En tránsito</option>
                <option value="ENTREGADO">Entregado</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={agregarEmbarque} className="btn-primary">Guardar Embarque</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      {/* Tabla embarques */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="table-th">#</th>
                <th className="table-th">Contenedor</th>
                <th className="table-th">Cliente</th>
                <th className="table-th">País</th>
                <th className="table-th">Naviera</th>
                <th className="table-th">Fecha Zarpe</th>
                <th className="table-th">P. Origen</th>
                <th className="table-th">P. Destino</th>
                <th className="table-th">Sem. Cosecha</th>
                <th className="table-th">Variedad</th>
                <th className="table-th text-right">KG</th>
                <th className="table-th">Calibre</th>
                <th className="table-th text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {embarques.length === 0 && (
                <tr>
                  <td colSpan={13} className="table-td text-center text-gray-400 py-8">
                    Sin embarques registrados. Haz clic en &quot;+ Nuevo Embarque&quot; para agregar.
                  </td>
                </tr>
              )}
              {embarques.map((e) => {
                const cfg = ESTADO_CONFIG[e.estado]
                return (
                  <tr key={e.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="table-td text-gray-400">{e.id}</td>
                    <td className="table-td font-mono font-semibold text-gray-800">{e.nContenedor}</td>
                    <td className="table-td font-medium">{e.clienteDestino}</td>
                    <td className="table-td">
                      <span className="flex items-center gap-1">{PAIS_FLAG[e.paisDestino] ?? '🌍'} {e.paisDestino}</span>
                    </td>
                    <td className="table-td text-gray-600">{e.naviera}</td>
                    <td className="table-td text-gray-600">{e.fechaZarpe ? new Date(e.fechaZarpe + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }) : '—'}</td>
                    <td className="table-td text-gray-600">{e.puertoOrigen}</td>
                    <td className="table-td text-gray-600">{e.puertoDestino}</td>
                    <td className="table-td text-gray-600">{e.semCosecha}</td>
                    <td className="table-td"><span className="badge bg-green-100 text-green-800">{e.variedad}</span></td>
                    <td className="table-td text-right font-semibold text-blue-700">{fmtKg(e.kgEmbarque)}</td>
                    <td className="table-td"><span className="badge bg-gray-100 text-gray-700 font-mono">{e.calibreEmbarque}</span></td>
                    <td className="table-td text-center">
                      <select
                        value={e.estado}
                        onChange={(ev) => cambiarEstado(e.id, ev.target.value as Estado)}
                        className={`badge ${cfg.color} cursor-pointer border-0 text-xs py-0.5`}
                      >
                        {(Object.keys(ESTADO_CONFIG) as Estado[]).map((st) => (
                          <option key={st} value={st}>{ESTADO_CONFIG[st].icon} {ESTADO_CONFIG[st].label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {embarques.length > 0 && (
              <tfoot>
                <tr className="bg-gray-900 text-white">
                  <td colSpan={10} className="table-td font-bold text-white">TOTAL EMBARQUES</td>
                  <td className="table-td text-right font-bold text-green-400">{fmtKg(totalKg)}</td>
                  <td colSpan={2} className="table-td text-gray-400 text-xs">{embarques.length} contenedores</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
