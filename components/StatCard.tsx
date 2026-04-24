interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: 'green' | 'blue' | 'yellow' | 'purple' | 'orange'
}

const colorMap = {
  green: { bg: 'bg-green-50', icon: 'bg-green-100 text-green-700', value: 'text-green-700' },
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-700', value: 'text-blue-700' },
  yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-700', value: 'text-yellow-700' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-700', value: 'text-purple-700' },
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-700', value: 'text-orange-700' },
}

export default function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={`${c.bg} rounded-xl p-5 border border-${color}-100`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className={`${c.icon} w-10 h-10 rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className={`text-3xl font-bold ${c.value}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}
