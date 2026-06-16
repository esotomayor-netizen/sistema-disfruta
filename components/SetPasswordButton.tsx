'use client'

import { useState } from 'react'

export default function SetPasswordButton({ userId, userName }: { userId: number; userName: string }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (password.length < 6) { setError('Mínimo 6 caracteres'); return }
    setLoading(true)
    setError('')
    const res = await fetch(`/api/equipo/${userId}/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) { setDone(true); setOpen(false); setPassword('') }
    else { const d = await res.json(); setError(d.error || 'Error al guardar') }
  }

  if (done) return <span className="text-xs text-green-600 font-medium">✓ Contraseña asignada</span>

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
        {done ? '✓ Contraseña' : 'Asignar contraseña'}
      </button>
    )
  }

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-xs text-gray-500 mb-2">Nueva contraseña para {userName}</p>
      <div className="flex gap-2">
        <input
          type="password"
          className="input text-sm flex-1"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
        <button onClick={handleSave} disabled={loading} className="btn-primary text-sm px-3">
          {loading ? '…' : 'Guardar'}
        </button>
        <button onClick={() => { setOpen(false); setPassword('') }} className="btn-secondary text-sm px-3">
          ✕
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
