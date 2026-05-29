import { PRODUCTORES, PROGRAMACION_SEMANAL, fmtKg, TEMPORADA } from '@/lib/cosecha-data'

export const dynamic = 'force-static'

const REND_EST_KG_HA = 18000

function getKgPorProductor(nombreHuerto: string): number {
  return PROGRAMACION_SEMANAL
    .filter((r) => r.productor === nombreHuerto)
    .reduce((s, r) => s + r.totalKg, 0)
}

function getVariedadesPorProductor(nombreHuerto: string): string[] {
  return Array.from(new Set(
    PROGRAMACION_SEMANAL
      .filter((r) => r.productor === nombreHuerto)
      .map((r) => r.variedad)
  ))
}

function estadoCapacidad(pct: number | null): { label: string; color: string } {
  if (pct === null) return { label: 'Sin dato Ha.', color: 'bg-gray-100 text-gray-500' }
  if (pct > 1.2)  return { label: 'Sobredimensionado', color: 'bg-red-100 text-red-700' }
  if (pct > 1.0)  return { label: 'Al límite', color: 'bg-orange-100 text-orange-700' }
  if (pct >= 0.7) return { label: 'Uso normal', color: 'bg-green-100 text-green-700' }
  return { label: 'Subutilizado', color: 'bg-yellow-100 text-yellow-700' }
}

export default function HectareasPage() {
  const totalKgProg = PROGRAMACION_SEMANAL.reduce((s, r) => s + r.totalKg, 0)
  const totalProductores = PRODUCTORES.length

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

      {/* Aviso ingreso */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-6 text-sm text-amber-800 flex items-start gap-2">
        <span className="text-lg mt-0.5">✏️</span>
        <div>
          <p className="font-medium mb-1">Datos de hectáreas pendientes de ingreso</p>
          <p>Las columnas marcadas con <strong>—</strong> deben completarse con las hectáreas y año de plantación de cada huerto. El sistema calculará automáticamente el rendimiento esperado y validará los KG programados.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{totalProductores}</p>
          <p className="text-sm text-gray-500 mt-1">Productores registrados</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-700">{fmtKg(totalKgProg)}</p>
          <p className="text-sm text-gray-500 mt-1">KG totales programados</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-700">18.000</p>
          <p className="text-sm text-gray-500 mt-1">kg/ha rendimiento estimado</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Detalle por Productor</h2>
          <span className="text-xs text-gray-400">Rendimiento est.: {REND_EST_KG_HA.toLocaleString('es-CL')} kg/ha (ref. Asoex)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="table-th w-8">#</th>
                <th className="table-th">Razón Social / Huerto</th>
                <th className="table-th">Variedades</th>
                <th className="table-th text-right">Ha. Cerezo</th>
                <th className="table-th text-right">Año Plant.</th>
                <th className="table-th text-right">Edad</th>
                <th className="table-th text-right">Rend. Est. kg/ha</th>
                <th className="table-th text-right">KG Esp. Total</th>
                <th className="table-th text-right">KG Program.</th>
                <th className="table-th text-right">Diferencia</th>
                <th className="table-th text-right">% Uso</th>
                <th className="table-th text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTORES.map((p) => {
                const kgProg = getKgPorProductor(p.nombreHuerto)
                const variedades = getVariedadesPorProductor(p.nombreHuerto)
                // Ha. y año son pendientes — se mostrarán cuando el usuario los ingrese
                const haCerezo: number | null = null
                const anioPlant: number | null = null
                const edad = anioPlant ? (2027 - anioPlant) : null
                const kgEsperado = haCerezo ? Math.round(haCerezo * REND_EST_KG_HA) : null
                const diferencia = kgEsperado !== null ? kgProg - kgEsperado : null
                const pctUso = kgEsperado !== null && kgEsperado > 0 ? kgProg / kgEsperado : null
                const estado = estadoCapacidad(pctUso)

                return (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="table-td text-gray-400">{p.id}</td>
                    <td className="table-td">
                      <p className="font-semibold text-gray-900 text-xs">{p.nombreHuerto}</p>
                      <p className="text-gray-400 text-[10px] truncate max-w-[200px]">{p.razonSocial}</p>
                    </td>
                    <td className="table-td">
                      <div className="flex flex-wrap gap-1">
                        {variedades.length > 0
                          ? variedades.slice(0,3).map((v) => (
                              <span key={v} className="badge bg-green-100 text-green-800 text-[10px]">{v}</span>
                            ))
                          : <span className="text-gray-300">—</span>
                        }
                        {variedades.length > 3 && <span className="text-gray-400 text-[10px]">+{variedades.length-3}</span>}
                      </div>
                    </td>
                    <td className="table-td text-right">
                      {haCerezo !== null ? <span className="font-medium">{haCerezo} ha</span> : <span className="text-amber-500 font-medium">✏️</span>}
                    </td>
                    <td className="table-td text-right text-gray-500">
                      {anioPlant ?? <span className="text-amber-500">✏️</span>}
                    </td>
                    <td className="table-td text-right text-gray-500">
                      {edad !== null ? `${edad} años` : '—'}
                    </td>
                    <td className="table-td text-right text-gray-500 font-mono">
                      {REND_EST_KG_HA.toLocaleString('es-CL')}
                    </td>
                    <td className="table-td text-right text-gray-500">
                      {kgEsperado !== null ? fmtKg(kgEsperado) : '—'}
                    </td>
                    <td className={`table-td text-right font-semibold ${kgProg > 0 ? 'text-blue-700' : 'text-gray-300'}`}>
                      {kgProg > 0 ? fmtKg(kgProg) : '—'}
                    </td>
                    <td className="table-td text-right">
                      {diferencia !== null
                        ? <span className={diferencia >= 0 ? 'text-orange-600' : 'text-green-600'}>{diferencia >= 0 ? '+' : ''}{fmtKg(diferencia)}</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="table-td text-right">
                      {pctUso !== null
                        ? <span className={`font-bold ${pctUso > 1 ? 'text-red-600' : 'text-green-700'}`}>{(pctUso*100).toFixed(0)}%</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="table-td text-center">
                      <span className={`badge text-[10px] ${estado.color}`}>{estado.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-900 text-white">
                <td colSpan={8} className="table-td font-bold text-white">TOTAL GENERAL</td>
                <td className="table-td text-right font-bold text-green-400">{fmtKg(totalKgProg)}</td>
                <td colSpan={3} className="table-td text-gray-400 text-xs">Ha. pendientes de ingreso</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
