'use client'

import { useState } from 'react'

export default function SetupEduardoPage() {
  const [log, setLog] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const run = async (dryRun: boolean) => {
    setLoading(true)
    setLog(dryRun ? 'Simulando...' : 'Aplicando cambios...')
    try {
      const res = await fetch('/api/admin/setup-eduardo', {
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
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Configurar cartera de Eduardo Sotomayor</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Paso previo (una sola vez): asigna sus 15 predios como técnico, carga la comuna de referencia y las
        visitas/mes de cada uno, y fija su punto de partida diario (Rancagua). Después de correr esto,
        el botón &quot;Generar Agenda&quot; de la página Agenda arma su ruta real con horario y tiempos de viaje.
      </p>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => run(true)}
          disabled={loading}
          className="bg-gray-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Procesando...' : '1. Simular (sin guardar)'}
        </button>
        <button
          onClick={() => run(false)}
          disabled={loading}
          className="bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-green-800 disabled:opacity-50"
        >
          {loading ? 'Procesando...' : '2. Confirmar y aplicar'}
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
