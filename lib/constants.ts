export const LABOR_TIPOS = [
  { value: 'SIEMBRA', label: 'Siembra' },
  { value: 'COSECHA', label: 'Cosecha' },
  { value: 'PODA', label: 'Poda' },
  { value: 'FERTILIZACION', label: 'Fertilización' },
  { value: 'RIEGO', label: 'Riego' },
  { value: 'CONTROL_PLAGAS', label: 'Control de Plagas' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'OTRO', label: 'Otro' },
]

export const ESTADOS_LABOR = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_PROGRESO', label: 'En Progreso' },
  { value: 'COMPLETADA', label: 'Completada' },
  { value: 'CANCELADA', label: 'Cancelada' },
]

export const TIPOS_PRODUCTO = [
  { value: 'HERBICIDA', label: 'Herbicida' },
  { value: 'FUNGICIDA', label: 'Fungicida' },
  { value: 'INSECTICIDA', label: 'Insecticida' },
  { value: 'FERTILIZANTE', label: 'Fertilizante' },
  { value: 'BIOESTIMULANTE', label: 'Bioestimulante' },
  { value: 'OTRO', label: 'Otro' },
]

export const ESTADOS_APLICACION = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'COMPLETADA', label: 'Completada' },
  { value: 'CANCELADA', label: 'Cancelada' },
]

export const ROLES_USUARIO = [
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'TECNICO', label: 'Técnico' },
  { value: 'APLICADOR', label: 'Aplicador' },
]

export const UNIDADES = ['kg/ha', 'L/ha', 'g/ha', 'mL/ha', 'kg', 'L', 'unidades']

export function estadoLaborColor(estado: string) {
  const map: Record<string, string> = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800',
    EN_PROGRESO: 'bg-blue-100 text-blue-800',
    COMPLETADA: 'bg-green-100 text-green-800',
    CANCELADA: 'bg-red-100 text-red-800',
  }
  return map[estado] ?? 'bg-gray-100 text-gray-800'
}

export function estadoAplicacionColor(estado: string) {
  const map: Record<string, string> = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800',
    COMPLETADA: 'bg-green-100 text-green-800',
    CANCELADA: 'bg-red-100 text-red-800',
  }
  return map[estado] ?? 'bg-gray-100 text-gray-800'
}

export function tipoProductoColor(tipo: string) {
  const map: Record<string, string> = {
    HERBICIDA: 'bg-orange-100 text-orange-800',
    FUNGICIDA: 'bg-purple-100 text-purple-800',
    INSECTICIDA: 'bg-red-100 text-red-800',
    FERTILIZANTE: 'bg-green-100 text-green-800',
    BIOESTIMULANTE: 'bg-teal-100 text-teal-800',
    OTRO: 'bg-gray-100 text-gray-800',
  }
  return map[tipo] ?? 'bg-gray-100 text-gray-800'
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function labelFromValue(list: { value: string; label: string }[], value: string) {
  return list.find((i) => i.value === value)?.label ?? value
}
