'use client'

import { useState } from 'react'

export default function ImportarProductoresPage() {
  const [log, setLog] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const run = async (dryRun: boolean) => {
    if (!dryRun && !confirm('Esto creará/actualizará usuarios Encargado y los asignará a sus predios. ¿Confirmas?')) return
    setLoading(true)
    setLog(dryRun ? 'Generando vista previa...' : 'Importando...')
    try {
      const res = await fetch('/api/admin/importar-productores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      })
      const data = await res.json()
      setLog(JSON.stringify(data, null, 2))
    } catch (e: any) {
      setLog('Error: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Importar Productores / Encargados</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Carga masiva de la planilla de productores: crea un usuario Encargado por cada fila y lo asigna
        al predio correspondiente (buscado por razón social y código CSG). Las filas cuya razón social
        no se encuentra en el sistema se omiten. Primero revisa la vista previa antes de confirmar.
      </p>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => run(true)}
          disabled={loading}
          className="bg-gray-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Procesando...' : '1. Vista previa (sin guardar)'}
        </button>
        <button
          onClick={() => run(false)}
          disabled={loading}
          className="bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-green-800 disabled:opacity-50"
        >
          {loading ? 'Procesando...' : '2. Confirmar e importar'}
        </button>
      </div>

      {log && (
        <pre className="bg-gray-900 text-green-300 text-xs p-4 rounded-xl overflow-auto max-h-[600px] whitespace-pre-wrap">
          {log}
        </pre>
      )}
    </div>
  )
}
