'use client'

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LabelList, Cell, BarChart, PieChart, Pie, Legend,
} from 'recharts'

export interface Punto {
  key: string
  label: string
  nombre?: string
  color?: string
  mm?: string
  n: number
  pct: number
}

const pctFmt = (v: unknown) => `${Number(v).toFixed(1)}%`

// Curva de calibres: barras de % por calibre con la curva superpuesta.
export function CurvaCalibre({ data, comparar }: { data: Punto[]; comparar?: { nombre: string; data: Punto[] } }) {
  const rows = data.map((d, i) => ({ ...d, cmp: comparar?.data[i]?.pct }))
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={rows} margin={{ top: 20, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
        <Tooltip
          formatter={(v, name) => [pctFmt(v), name === 'cmp' ? comparar?.nombre : '% muestra']}
          labelFormatter={(l, p) => `${l}${p?.[0]?.payload?.mm ? ` (${p[0].payload.mm} mm)` : ''}`}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="pct" fill="#9b1c22" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          <LabelList dataKey="pct" position="top" formatter={(v: unknown) => (Number(v) ? `${v}%` : '')} style={{ fontSize: 10, fill: '#374151' }} />
        </Bar>
        <Line type="monotone" dataKey="pct" stroke="#3c5430" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
        {comparar && <Line type="monotone" dataKey="cmp" stroke="#2563eb" strokeDasharray="5 4" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />}
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// Distribución de color en % con el color real de la cereza.
export function DistribucionColor({ data }: { data: Punto[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 20, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={56} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
        <Tooltip formatter={(v) => [pctFmt(v), '% muestra']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="pct" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {data.map((d) => <Cell key={d.key} fill={d.color ?? '#9b1c22'} />)}
          <LabelList dataKey="pct" position="top" formatter={(v: unknown) => (Number(v) ? `${v}%` : '')} style={{ fontSize: 10, fill: '#374151' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function TortaColor({ data }: { data: Punto[] }) {
  const rows = data.filter((d) => d.pct > 0)
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart margin={{ top: 16, right: 24, bottom: 0, left: 24 }}>
        <Pie data={rows} dataKey="pct" nameKey="label" innerRadius={40} outerRadius={72} isAnimationActive={false}
          label={({ value }) => `${value}%`} labelLine>
          {rows.map((d) => <Cell key={d.key} fill={d.color ?? '#9b1c22'} />)}
        </Pie>
        <Tooltip formatter={(v) => pctFmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Barras horizontales de defectos (% sobre la muestra).
export function BarrasDefectos({ data, color }: { data: { label: string; pct: number }[]; color: string }) {
  if (!data.length) return <p className="text-sm text-gray-400 py-6 text-center">Sin defectos registrados</p>
  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 34 + 30)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={150} />
        <Tooltip formatter={(v) => [pctFmt(v), '% muestra']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="pct" fill={color} radius={[0, 4, 4, 0]} isAnimationActive={false}>
          <LabelList dataKey="pct" position="right" formatter={(v: unknown) => `${v}%`} style={{ fontSize: 10, fill: '#374151' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// Barra 100% apilada (firmeza o color) compacta.
export function BarraApilada({ data }: { data: Punto[] }) {
  const total = data.reduce((a, d) => a + d.pct, 0)
  if (!total) return <p className="text-sm text-gray-400">Sin datos</p>
  return (
    <div>
      <div className="flex h-7 rounded-lg overflow-hidden border border-gray-200">
        {data.filter((d) => d.pct > 0).map((d) => (
          <div key={d.key} style={{ width: `${(d.pct / total) * 100}%`, background: d.color }}
            className="flex items-center justify-center text-[10px] font-semibold text-white" title={`${d.nombre ?? d.label}: ${d.pct}%`}>
            {d.pct >= 8 ? `${d.pct}%` : ''}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {data.map((d) => (
          <span key={d.key} className="inline-flex items-center gap-1 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
            {d.nombre ?? d.label} <b>{d.pct}%</b>
          </span>
        ))}
      </div>
    </div>
  )
}

const PALETA = ['#9b1c22', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#4b5563']

// Curvas de calibre superpuestas de varios grupos (productor / variedad).
export function ComparativaCurvas({ calibres, series }: { calibres: string[]; series: { nombre: string; pcts: number[] }[] }) {
  const rows = calibres.map((c, i) => {
    const r: Record<string, string | number> = { label: c }
    series.forEach((s, j) => { r[`s${j}`] = s.pcts[i] })
    return r
  })
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={rows} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
        <Tooltip formatter={(v, name) => [pctFmt(v), series[parseInt(String(name).slice(1))]?.nombre]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend formatter={(v) => series[parseInt(String(v).slice(1))]?.nombre} wrapperStyle={{ fontSize: 11 }} />
        {series.map((_, j) => (
          <Line key={j} type="monotone" dataKey={`s${j}`} stroke={PALETA[j % PALETA.length]} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
