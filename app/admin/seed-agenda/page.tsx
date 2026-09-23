'use client'

import { useState } from 'react'

function proximoMes() {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function SeedAgendaPage() {
  const [mes, setMes] = useState(proximoMes())
  const [log, setLog] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const run = async (dryRun: boolean) => {
    setLoading(true)
    setLog(dryRun ? 'Simulando...' : 'Creando agenda...')
    try {
      const res = await fetch('/api/admin/seed-agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun, clearExisting: true, mes }),
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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Generar Agenda por Técnico</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Crea automáticamente las visitas agendadas para cada técnico basándose en la planilla de frecuencia de visitas
        (cartera y visitas/mes definidas en el código). Primero haz una simulación para verificar el itinerario, luego confirma.
      </p>

      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-600 mb-1">Mes a generar</label>
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

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
          {loading ? 'Procesando...' : '2. Confirmar y crear agenda'}
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
