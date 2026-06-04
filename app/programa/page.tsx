export const dynamic = 'force-dynamic'

export default function ProgramaPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Programa Fitosanitario</h1>
        <p className="text-gray-500 text-sm mt-1">Recomendaciones técnicas por temporada y cultivo</p>
      </div>
      <div className="card text-center py-12 text-gray-400">
        No hay programa cargado aún.
      </div>
    </div>
  )
}
