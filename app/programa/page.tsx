import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const caracterColor = (c: string) =>
  c === 'FIJA' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'

export default async function ProgramaPage() {
  const programa = await prisma.programaFitosanitario.findMany({
    orderBy: { id: 'asc' },
  })

  const temporadas = Array.from(new Set(programa.map((p) => p.temporada)))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programa Fitosanitario</h1>
          <p className="text-gray-500 text-sm mt-1">Recomendaciones técnicas por temporada y cultivo</p>
        </div>
      </div>

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
