'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { semana: string; kg: number }[]
}

function fmt(v: number) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'k'
  return String(v)
}

function tooltipFmt(value: unknown) {
  const n = Number(value)
  return [fmt(n) + ' kg', 'KG'] as [string, string]
}

export default function CosechaBarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={42} />
        <Tooltip formatter={tooltipFmt} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="kg" fill="#16a34a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
