'use client'

import { useState, useEffect, useCallback } from 'react'
import { PRODUCTORES, PROGRAMACION_SEMANAL, VARIEDADES, fmtKg, TEMPORADA } from '@/lib/cosecha-data'
import {
  saveHectareas,
  loadHectareas,
  type HuertoEdit,
  type ProductorHectareasEdit,
} from '@/lib/cosecha-store'

const REND_EST_KG_HA = 18000
const CURRENT_YEAR = 2026

function getKgPorProductor(nombreHuerto: string): number {
  return PROGRAMACION_SEMANAL
    .filter((r) => r.productor === nombreHuerto)
    .reduce((s, r) => s + r.totalKg, 0)
}

function estadoCapacidad(pct: number | null): { label: string; color: string } {
  if (pct === null) return { label: 'Sin dato Ha.', color: 'bg-gray-100 text-gray-500' }
  if (pct > 1.2) return { label: 'Sobredimensionado', color: 'bg-red-100 text-red-700' }
  if (pct > 1.0) return { label: 'Al límite', color: 'bg-orange-100 text-orange-700' }
  if (pct >= 0.7) return { label: 'Uso normal', color: 'bg-green-100 text-green-700' }
  return { label: 'Subutilizado', color: 'bg-yellow-100 text-yellow-700' }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function initFromProductores(): ProductorHectareasEdit[] {
  return PRODUCTORES.map((p) => ({
    productorid: p.id,
    nombreHuerto: p.nombreHuerto,
    huertos: [],
    pctEntregaExportadora: 100,
  }))
}

// ── Inline Editor ──────────────────────────────────────────────────────────────

interface EditorProps {
  data: ProductorHectareasEdit
  onSave: (updated: ProductorHectareasEdit) => void
  onCancel: () => void
}

function HuertosEditor({ data, onSave, onCancel }: EditorProps) {
  const [draft, setDraft] = useState<ProductorHectareasEdit>(JSON.parse(JSON.stringify(data)))
  const variedadesList = VARIEDADES.map((v) => v.nombre)

  const addHuerto = () => {
    const newHuerto: HuertoEdit = {
      id: makeId(),
      nombre: '',
      haCerezo: 0,
      anioPlantacion: CURRENT_YEAR - 5,
      estado: 'nuevo',
      variedades: [],
    }
    setDraft((d) => ({ ...d, huertos: [...d.huertos, newHuerto] }))
  }

  const removeHuerto = (id: string) => {
    setDraft((d) => ({ ...d, huertos: d.huertos.filter((h) => h.id !== id) }))
  }

  const updateHuerto = (id: string, field: keyof HuertoEdit, value: unknown) => {
    setDraft((d) => ({
      ...d,
      huertos: d.huertos.map((h) => h.id === id ? { ...h, [field]: value } : h),
    }))
  }

  const toggleVariedad = (huertoId: string, variedad: string) => {
    setDraft((d) => ({
      ...d,
      huertos: d.huertos.map((h) => {
        if (h.id !== huertoId) return h
        const exists = h.variedades.includes(variedad)
        return {
          ...h,
          variedades: exists
            ? h.variedades.filter((v) => v !== variedad)
            : [...h.variedades, variedad],
        }
      }),
    }))
  }

  return (
    <tr>
      <td colSpan={12} className="p-0">
        <div className="bg-blue-50 border-y border-blue-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-900 text-sm">
              Editando: <span className="font-bold">{data.nombreHuerto}</span>
            </h3>
          </div>

          {/* Sub-table of huertos */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs bg-white rounded-lg overflow-hidden border border-blue-200">
              <thead className="bg-blue-100">
                <tr>
                  <th className="table-th">Nombre Huerto</th>
                  <th className="table-th text-right">Ha Cerezo</th>
                  <th className="table-th text-right">Año Plant.</th>
                  <th className="table-th">Estado</th>
                  <th className="table-th">Motivo Salida</th>
                  <th className="table-th">Variedades</th>
                  <th className="table-th text-center">Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {draft.huertos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="table-td text-center text-gray-400 py-4">
                      Sin huertos registrados. Agrega uno con el botón de abajo.
                    </td>
                  </tr>
                )}
                {draft.huertos.map((huerto) => (
                  <tr key={huerto.id} className="border-b border-gray-100 last:border-0">
                    <td className="table-td">
                      <input
                        className="input text-xs py-1"
                        value={huerto.nombre}
                        onChange={(e) => updateHuerto(huerto.id, 'nombre', e.target.value)}
                        placeholder="Nombre del huerto"
                      />
                    </td>
                    <td className="table-td">
                      <input
                        type="number"
                        className="input text-xs py-1 w-20 text-right"
                        value={huerto.haCerezo}
                        min={0}
                        step={0.5}
                        onChange={(e) => updateHuerto(huerto.id, 'haCerezo', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="table-td">
                      <input
                        type="number"
                        className="input text-xs py-1 w-24"
                        value={huerto.anioPlantacion}
                        min={1990}
                        max={CURRENT_YEAR}
                        onChange={(e) => updateHuerto(huerto.id, 'anioPlantacion', parseInt(e.target.value) || CURRENT_YEAR - 5)}
                      />
                    </td>
                    <td className="table-td">
                      <select
                        className="input text-xs py-1"
                        value={huerto.estado}
                        onChange={(e) => updateHuerto(huerto.id, 'estado', e.target.value)}
                      >
                        <option value="activo">Activo</option>
                        <option value="nuevo">Nuevo</option>
                        <option value="eliminado">Eliminado</option>
                      </select>
                    </td>
                    <td className="table-td">
                      {huerto.estado === 'eliminado' ? (
                        <input
                          className="input text-xs py-1"
                          value={huerto.motivoSalida ?? ''}
                          onChange={(e) => updateHuerto(huerto.id, 'motivoSalida', e.target.value)}
                          placeholder="Motivo de salida"
                        />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="table-td">
                      <div className="flex flex-wrap gap-1">
                        {variedadesList.map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => toggleVariedad(huerto.id, v)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                              huerto.variedades.includes(v)
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="table-td text-center">
                      <button
                        type="button"
                        onClick={() => removeHuerto(huerto.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Eliminar huerto"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              type="button"
              onClick={addHuerto}
              className="btn-secondary text-xs py-1.5"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              + Agregar Huerto
            </button>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                % Entrega a Exportadora:
              </label>
              <input
                type="number"
                className="input text-xs py-1 w-20"
                value={draft.pctEntregaExportadora}
                min={0}
                max={100}
                onChange={(e) => setDraft((d) => ({ ...d, pctEntregaExportadora: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
              />
              <span className="text-xs text-gray-500">%</span>
            </div>

            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={() => onSave(draft)} className="btn-primary text-xs py-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar
              </button>
              <button type="button" onClick={onCancel} className="btn-secondary text-xs py-1.5">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function HectareasPage() {
  const [productoresData, setProductoresData] = useState<ProductorHectareasEdit[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = loadHectareas()
    if (stored && stored.length > 0) {
      setProductoresData(stored)
    } else {
      setProductoresData(initFromProductores())
    }
  }, [])

  const handleSave = useCallback((updated: ProductorHectareasEdit) => {
    setProductoresData((prev) => {
      const next = prev.map((p) => p.productorid === updated.productorid ? updated : p)
      saveHectareas(next)
      return next
    })
    setEditingId(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])

  const handleCancel = useCallback(() => setEditingId(null), [])

  const totalKgProg = PROGRAMACION_SEMANAL.reduce((s, r) => s + r.totalKg, 0)

  const totalHa = productoresData.reduce((s, p) => {
    const activeHa = p.huertos.filter((h) => h.estado !== 'eliminado').reduce((a, h) => a + h.haCerezo, 0)
    return s + activeHa
  }, 0)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <a href="/cosecha" className="text-gray-400 hover:text-gray-600 text-sm">← Inicio</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600 font-medium">Hectáreas y Rendimiento</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌿</span>
          <h1 className="text-2xl font-bold text-gray-900">Hectáreas y Rendimiento por Productor</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Temporada {TEMPORADA} · Superficie plantada, rendimiento esperado y validación de KG programados vs capacidad real del huerto
        </p>
      </div>

      {saved && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Datos guardados correctamente en el navegador.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{PRODUCTORES.length}</p>
          <p className="text-sm text-gray-500 mt-1">Productores registrados</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-700">{fmtKg(totalKgProg)}</p>
          <p className="text-sm text-gray-500 mt-1">KG totales programados</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-700">{totalHa > 0 ? `${totalHa.toFixed(1)} ha` : '—'}</p>
          <p className="text-sm text-gray-500 mt-1">Ha. ingresadas</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-700">18.000</p>
          <p className="text-sm text-gray-500 mt-1">kg/ha rendimiento estimado</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Detalle por Productor</h2>
          <span className="text-xs text-gray-400">Haz clic en <strong>Editar</strong> para ingresar hectáreas de cada productor</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="table-th w-8">#</th>
                <th className="table-th">Razón Social / Huerto</th>
                <th className="table-th text-right">Total Ha</th>
                <th className="table-th text-right">Año Plant.</th>
                <th className="table-th text-right">Rend. Est. Total</th>
                <th className="table-th text-right">KG Esp. Exportadora</th>
                <th className="table-th text-right">KG Program.</th>
                <th className="table-th text-right">% Uso</th>
                <th className="table-th text-right">% Entrega</th>
                <th className="table-th text-center">Estado</th>
                <th className="table-th text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {productoresData.map((p) => {
                const kgProg = getKgPorProductor(p.nombreHuerto)
                const activeHuertos = p.huertos.filter((h) => h.estado !== 'eliminado')
                const totalHaCerezo = activeHuertos.reduce((s, h) => s + h.haCerezo, 0)
                const anios = activeHuertos.map((h) => h.anioPlantacion).filter((a) => a > 0)
                const anioRange = anios.length === 0
                  ? null
                  : anios.length === 1
                    ? String(anios[0])
                    : `${Math.min(...anios)}–${Math.max(...anios)}`
                const rendEstTotal = totalHaCerezo > 0 ? Math.round(totalHaCerezo * REND_EST_KG_HA) : null
                const kgEspExportadora = rendEstTotal !== null
                  ? Math.round(rendEstTotal * p.pctEntregaExportadora / 100)
                  : null
                const pctUso = kgEspExportadora !== null && kgEspExportadora > 0 ? kgProg / kgEspExportadora : null
                const estado = estadoCapacidad(pctUso)
                const isEditing = editingId === p.productorid
                const productor = PRODUCTORES.find((pr) => pr.id === p.productorid)

                return [
                  <tr
                    key={p.productorid}
                    className={`border-b border-gray-50 last:border-0 hover:bg-gray-50 ${isEditing ? 'bg-blue-50' : ''}`}
                  >
                    <td className="table-td text-gray-400">{p.productorid}</td>
                    <td className="table-td">
                      <p className="font-semibold text-gray-900">{p.nombreHuerto}</p>
                      <p className="text-gray-400 text-[10px] truncate max-w-[180px]">{productor?.razonSocial}</p>
                    </td>
                    <td className="table-td text-right">
                      {totalHaCerezo > 0
                        ? <span className="font-medium">{totalHaCerezo.toFixed(1)} ha</span>
                        : <span className="text-amber-500">✏️ pendiente</span>
                      }
                    </td>
                    <td className="table-td text-right text-gray-500">
                      {anioRange ?? <span className="text-amber-500">—</span>}
                    </td>
                    <td className="table-td text-right text-gray-500">
                      {rendEstTotal !== null ? fmtKg(rendEstTotal) : '—'}
                    </td>
                    <td className="table-td text-right text-gray-500">
                      {kgEspExportadora !== null ? fmtKg(kgEspExportadora) : '—'}
                    </td>
                    <td className={`table-td text-right font-semibold ${kgProg > 0 ? 'text-blue-700' : 'text-gray-300'}`}>
                      {kgProg > 0 ? fmtKg(kgProg) : '—'}
                    </td>
                    <td className="table-td text-right">
                      {pctUso !== null
                        ? <span className={`font-bold ${pctUso > 1 ? 'text-red-600' : 'text-green-700'}`}>{(pctUso * 100).toFixed(0)}%</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="table-td text-right">
                      <span className="font-medium text-gray-700">{p.pctEntregaExportadora}%</span>
                    </td>
                    <td className="table-td text-center">
                      <span className={`badge text-[10px] ${estado.color}`}>{estado.label}</span>
                    </td>
                    <td className="table-td text-center">
                      <button
                        onClick={() => setEditingId(isEditing ? null : p.productorid)}
                        className={isEditing ? 'btn-secondary text-xs py-1 px-2' : 'btn-primary text-xs py-1 px-2'}
                      >
                        {isEditing ? 'Cerrar' : 'Editar'}
                      </button>
                    </td>
                  </tr>,
                  isEditing && (
                    <HuertosEditor
                      key={`editor-${p.productorid}`}
                      data={p}
                      onSave={handleSave}
                      onCancel={handleCancel}
                    />
                  ),
                ]
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-900 text-white">
                <td colSpan={6} className="table-td font-bold text-white">TOTAL GENERAL</td>
                <td className="table-td text-right font-bold text-green-400">{fmtKg(totalKgProg)}</td>
                <td colSpan={4} className="table-td text-gray-400 text-xs">
                  {totalHa > 0 ? `${totalHa.toFixed(1)} ha ingresadas` : 'Ha. pendientes de ingreso'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
