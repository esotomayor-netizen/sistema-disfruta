export const LABOR_TIPOS = [
  { value: 'ESTABLECIMIENTO', label: 'Establecimiento del Huerto' },
  { value: 'FORMACION',       label: 'Formación y Conducción' },
  { value: 'PODA',            label: 'Poda' },
  { value: 'FERTILIZACION',   label: 'Suelo y Nutrición' },
  { value: 'RIEGO',           label: 'Gestión de Riego' },
  { value: 'MONITOREO',       label: 'Monitoreo Sanitario' },
  { value: 'CONTROL_PLAGAS',  label: 'Control de Plagas' },
  { value: 'RALEO',           label: 'Raleo' },
  { value: 'MANEJO_FRUTO',    label: 'Manejo de Fruto' },
  { value: 'COSECHA',         label: 'Cosecha' },
  { value: 'MANTENIMIENTO',   label: 'Mantenimiento' },
  { value: 'OTRO',            label: 'Otro' },
]

export const ESTADOS_LABOR = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_PROGRESO', label: 'En Progreso' },
  { value: 'COMPLETADA', label: 'Completada' },
  { value: 'CANCELADA', label: 'Cancelada' },
]

export const TIPOS_PRODUCTO = [
  { value: 'FUNGICIDA',          label: 'Fungicida' },
  { value: 'INSECTICIDA',        label: 'Insecticida' },
  { value: 'ACARICIDA',          label: 'Acaricida' },
  { value: 'HERBICIDA',          label: 'Herbicida' },
  { value: 'FERTILIZANTE_FOLIAR',label: 'Fertilizante Foliar' },
  { value: 'BIOESTIMULANTE',     label: 'Bioestimulante' },
  { value: 'FERTILIZANTE',       label: 'Fertilizante (suelo)' },
  { value: 'OTRO',               label: 'Otro' },
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

export const ROLES_ENCARGADO = [
  { value: 'ENCARGADO', label: 'Encargado de Predio' },
]

export const UNIDADES = ['gr/100 lts', 'cc/100 lts', 'kg/ha', 'L/ha', 'kg', 'L']

export const ESTADOS_FENOLOGICOS = [
  'Dormición',
  'Yema hinchada',
  'Puntas verdes',
  'Puntas rosadas',
  'Botón blanco',
  'Flor blanca',
  'Plena flor',
  'Caída de pétalos',
  'Cuajado',
  'Fruto raquítico',
  'Fruto en desarrollo (I)',
  'Fruto en desarrollo (II)',
  'Pre-cosecha',
  'Cosecha',
  'Post-cosecha',
]

export const CULTIVOS = ['Cerezo', 'Ciruela', 'Durazno', 'Nectarin', 'Kiwi', 'Uva de mesa']

export const VARIEDADES_POR_CULTIVO: Record<string, string[]> = {
  'Cerezo': ['BING', 'CHELAN', 'CORAL', 'KORDIA', 'LAPINS', 'REGINA', 'ROYAL DAWN', 'SANTINA', 'SWEET HEART', 'TIETON'],
  'Ciruela': ['ANGELENO', 'D AGEN', 'FORTUNE', 'FRIAR', 'LARRY ANN', 'PRESIDENT'],
  'Durazno': ['AUGUST PRIDE', 'ELEGANT LADY', 'O HENRY'],
  'Nectarin': ['FANTASIA', 'MAYFIRE', 'RUBY DIAMOND', 'ZEE FIRE'],
  'Kiwi': ['BRUNO', 'GOLD', 'HAYWARD'],
  'Uva de mesa': ['ARRA 15', 'CRIMSON SEEDLESS', 'FLAME SEEDLESS', 'RED GLOBE', 'SUPERIOR SEEDLESS', 'THOMPSON SEEDLESS'],
}

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
    FUNGICIDA:          'bg-purple-100 text-purple-800',
    INSECTICIDA:        'bg-red-100 text-red-800',
    ACARICIDA:          'bg-orange-100 text-orange-800',
    HERBICIDA:          'bg-yellow-100 text-yellow-800',
    FERTILIZANTE_FOLIAR:'bg-green-100 text-green-800',
    FERTILIZANTE:       'bg-lime-100 text-lime-800',
    BIOESTIMULANTE:     'bg-teal-100 text-teal-800',
    OTRO:               'bg-gray-100 text-gray-800',
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
