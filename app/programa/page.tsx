import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const caracterColor = (c: string) => {
  const map: Record<string, string> = {
    FIJA: 'bg-green-100 text-green-800',
    MOVIL: 'bg-yellow-100 text-yellow-800',
    PREVENTIVO: 'bg-blue-100 text-blue-800',
    CURATIVO: 'bg-orange-100 text-orange-800',
    ERRADICANTE: 'bg-red-100 text-red-800',
  }
  return map[c] ?? 'bg-gray-100 text-gray-700'
}

export default async function ProgramaPage() {
  const programa = await prisma.programaFitosanitario.findMany({
    orderBy: { id: 'asc' },
  })

  const temporadas = Array.from(new Set(programa.map((p) => p.temporada)))

  return (
    <div>
      <Header
        title="Programa Fitosanitario"
        subtitle="Recomendaciones técnicas por temporada y cultivo"
        action={
          <Link href="/programa/nueva" className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo producto
          </Link>
        }
      />

      {temporadas.map((temporada) => (
        <div key={temporada} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Temporada {temporada}</h2>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Estado Fenológico</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Carácter</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tratamiento</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha Est.</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Producto</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Ingrediente Activo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Conc.</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Mojamiento</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Dosis/ha</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {programa
                  .filter((p) => p.temporada === temporada)
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700 max-w-[160px]">{p.estadoFenologico || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${caracterColor(p.caracterAplicacion)}`}>
                          {p.caracterAplicacion}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-[180px]">{p.tratamientoObjetivo || '—'}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{p.fechaEstimada}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{p.producto}</td>
                      <td className="px-4 py-3 text-gray-600">{p.ingredienteActivo || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.concentracion || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.mojamiento || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.dosisHa || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px]">{p.observaciones || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {programa.length === 0 && (
        <div className="card text-center py-12 text-gray-400">
          No hay programa cargado aún.
        </div>
      )}
    </div>
  )
}
