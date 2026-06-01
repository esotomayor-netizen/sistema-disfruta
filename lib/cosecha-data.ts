// Datos de temporada 2026-2027 importados desde el plan Disfruta × Lecaros Cox

export const TEMPORADA = '2026-2027'

export const SEMANAS = [
  { key: 'sem44', label: 'Sem 44', fecha: '26 Oct – 01 Nov' },
  { key: 'sem45', label: 'Sem 45', fecha: '02 – 08 Nov' },
  { key: 'sem46', label: 'Sem 46', fecha: '09 – 15 Nov' },
  { key: 'sem47', label: 'Sem 47', fecha: '16 – 22 Nov' },
  { key: 'sem48', label: 'Sem 48', fecha: '23 – 29 Nov' },
  { key: 'sem49', label: 'Sem 49', fecha: '30 Nov – 06 Dic' },
  { key: 'sem50', label: 'Sem 50', fecha: '07 – 13 Dic' },
  { key: 'sem51', label: 'Sem 51', fecha: '14 – 20 Dic' },
  { key: 'sem52', label: 'Sem 52', fecha: '21 – 27 Dic' },
  { key: 'sem1',  label: 'Sem 1',  fecha: '28 Dic – 03 Ene' },
  { key: 'sem2',  label: 'Sem 2',  fecha: '04 – 10 Ene' },
] as const

export type SemanaKey = typeof SEMANAS[number]['key']

export interface Variedad {
  codigo: string
  nombre: string
  semanaInicio: string
  semanaFin: string
  pct5J: number
  pct4J: number
  pct3J: number
  pct2J: number
  pctJ: number
  pctXL: number
  pctExportacion: number
}

export const VARIEDADES: Variedad[] = [
  { codigo: 'LAPINS',     nombre: 'Lapins',     semanaInicio: 'Sem 49', semanaFin: 'Sem 51', pct5J: 0, pct4J: 25, pct3J: 30, pct2J: 25, pctJ: 15, pctXL: 5,  pctExportacion: 0.85 },
  { codigo: 'SANTINA',    nombre: 'Santina',    semanaInicio: 'Sem 47', semanaFin: 'Sem 49', pct5J: 0, pct4J: 10, pct3J: 25, pct2J: 35, pctJ: 20, pctXL: 10, pctExportacion: 0.87 },
  { codigo: 'REGINA',     nombre: 'Regina',     semanaInicio: 'Sem 51', semanaFin: 'Sem 52', pct5J: 0, pct4J: 1,  pct3J: 25, pct2J: 20, pctJ: 35, pctXL: 19, pctExportacion: 0.82 },
  { codigo: 'BING',       nombre: 'Bing',       semanaInicio: 'Sem 45', semanaFin: 'Sem 46', pct5J: 0, pct4J: 2,  pct3J: 20, pct2J: 30, pctJ: 40, pctXL: 8,  pctExportacion: 0.80 },
  { codigo: 'SWEET_HEART',nombre: 'Sweet Heart',semanaInicio: 'Sem 50', semanaFin: 'Sem 51', pct5J: 0, pct4J: 1,  pct3J: 11, pct2J: 45, pctJ: 30, pctXL: 13, pctExportacion: 0.83 },
  { codigo: 'BROOKS',     nombre: 'Brooks',     semanaInicio: 'Sem 44', semanaFin: 'Sem 46', pct5J: 0, pct4J: 0,  pct3J: 12, pct2J: 20, pctJ: 40, pctXL: 28, pctExportacion: 0.75 },
  { codigo: 'VAN',        nombre: 'Van',        semanaInicio: 'Sem 45', semanaFin: 'Sem 46', pct5J: 0, pct4J: 0,  pct3J: 15, pct2J: 15, pctJ: 32, pctXL: 38, pctExportacion: 0.73 },
  { codigo: 'KORDIA',     nombre: 'Kordia',     semanaInicio: 'Sem 50', semanaFin: 'Sem 51', pct5J: 0, pct4J: 1,  pct3J: 16, pct2J: 35, pctJ: 40, pctXL: 8,  pctExportacion: 0.86 },
  { codigo: 'ROYAL_DAWN', nombre: 'Royal Dawn', semanaInicio: 'Sem 46', semanaFin: 'Sem 47', pct5J: 0, pct4J: 5,  pct3J: 25, pct2J: 40, pctJ: 25, pctXL: 5,  pctExportacion: 0.80 },
  { codigo: 'SKEENA',     nombre: 'Skeena',     semanaInicio: 'Sem 49', semanaFin: 'Sem 50', pct5J: 0, pct4J: 7,  pct3J: 42, pct2J: 32, pctJ: 15, pctXL: 4,  pctExportacion: 0.85 },
  { codigo: 'FRISCO',     nombre: 'Frisco',     semanaInicio: 'Sem 44', semanaFin: 'Sem 46', pct5J: 0, pct4J: 0,  pct3J: 15, pct2J: 25, pctJ: 38, pctXL: 22, pctExportacion: 0.78 },
]

export interface PrecioCalibres {
  calibre: string
  rango: string
  precioUSD: number
  precioBajo: number
  precioAlto: number
  descripcion: string
}

export const PRECIOS_CALIBRES: PrecioCalibres[] = [
  { calibre: '5J', rango: '>36mm',    precioUSD: 14.5, precioBajo: 11,  precioAlto: 18,  descripcion: 'Premium máximo, escaso volumen' },
  { calibre: '4J', rango: '34-36mm',  precioUSD: 10.0, precioBajo: 7.5, precioAlto: 13,  descripcion: 'Alta demanda China' },
  { calibre: '3J', rango: '32-34mm',  precioUSD: 6.0,  precioBajo: 4.5, precioAlto: 8,   descripcion: 'Volumen principal exportación' },
  { calibre: '2J', rango: '30-32mm',  precioUSD: 4.2,  precioBajo: 3.0, precioAlto: 5.5, descripcion: 'Buen volumen, precio medio' },
  { calibre: 'J',  rango: '28-30mm',  precioUSD: 3.8,  precioBajo: 2.5, precioAlto: 4.8, descripcion: 'Precio base exportación' },
  { calibre: 'XL', rango: '26-28mm',  precioUSD: 2.9,  precioBajo: 1.8, precioAlto: 3.5, descripcion: 'Menor retorno, evaluar' },
]

export interface ProgramacionRow {
  variedad: string
  productor: string
  sem44: number; sem45: number; sem46: number; sem47: number; sem48: number
  sem49: number; sem50: number; sem51: number; sem52: number; sem1: number; sem2: number
  totalKg: number
  kg2JMasGrandes: number
  [key: string]: string | number
}

export const PROGRAMACION_SEMANAL: ProgramacionRow[] = [
  { variedad: 'SANTINA',    productor: 'AGROELITE',                       sem44:0, sem45:0,     sem46:0,     sem47:240000, sem48:190000, sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:430000,  kg2JMasGrandes:301000 },
  { variedad: 'LAPINS',     productor: 'AGROELITE',                       sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:50000,  sem50:300000, sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:350000,  kg2JMasGrandes:280000 },
  { variedad: 'REGINA',     productor: 'AGROELITE',                       sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:0,      sem50:0,      sem51:120000, sem52:0, sem1:0, sem2:0, totalKg:120000,  kg2JMasGrandes:55200  },
  { variedad: 'SANTINA',    productor: 'AGROLIQUID',                      sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:1000,   sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:1000,    kg2JMasGrandes:700    },
  { variedad: 'LAPINS',     productor: 'ALIRO CORNEJO',                   sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:7000,   sem49:3000,   sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:10000,   kg2JMasGrandes:8000   },
  { variedad: 'SANTINA',    productor: 'ALIRO CORNEJO',                   sem44:0, sem45:0,     sem46:0,     sem47:2000,   sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:2000,    kg2JMasGrandes:1400   },
  { variedad: 'LAPINS',     productor: 'ANDREA DEL PILAR FARIAS LORCA',  sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:0,      sem50:10000,  sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:10000,   kg2JMasGrandes:8000   },
  { variedad: 'LAPINS',     productor: 'ANDRES RISOPATRON',               sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:2000,   sem50:3000,   sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:5000,    kg2JMasGrandes:4000   },
  { variedad: 'SANTINA',    productor: 'ANDRES RISOPATRON',               sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:1000,   sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:1000,    kg2JMasGrandes:700    },
  { variedad: 'LAPINS',     productor: 'ANGEL MARTINEZ',                  sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:5000,   sem49:12000,  sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:17000,   kg2JMasGrandes:13600  },
  { variedad: 'SANTINA',    productor: 'ANGEL MARTINEZ',                  sem44:0, sem45:0,     sem46:0,     sem47:7000,   sem48:3000,   sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:10000,   kg2JMasGrandes:7000   },
  { variedad: 'LAPINS',     productor: 'CASAS VIEJAS',                    sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:13000,  sem49:32000,  sem50:3000,   sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:48000,   kg2JMasGrandes:38400  },
  { variedad: 'SANTINA',    productor: 'CASAS VIEJAS',                    sem44:0, sem45:0,     sem46:0,     sem47:2000,   sem48:4000,   sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:6000,    kg2JMasGrandes:4200   },
  { variedad: 'ROYAL DAWN', productor: 'CASAS VIEJAS',                    sem44:0, sem45:0,     sem46:1000,  sem47:2000,   sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:3000,    kg2JMasGrandes:2100   },
  { variedad: 'SKEENA',     productor: 'COPA DE AGUA',                    sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:13000,  sem50:4000,   sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:17000,   kg2JMasGrandes:13770  },
  { variedad: 'REGINA',     productor: 'COPA DE AGUA',                    sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:0,      sem50:10000,  sem51:6000,   sem52:0, sem1:0, sem2:0, totalKg:16000,   kg2JMasGrandes:7360   },
  { variedad: 'SANTINA',    productor: 'CORCOLEN',                        sem44:0, sem45:0,     sem46:6000,  sem47:8000,   sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:14000,   kg2JMasGrandes:9800   },
  { variedad: 'LAPINS',     productor: 'CREMASCHI',                       sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:20000,  sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:20000,   kg2JMasGrandes:16000  },
  { variedad: 'SANTINA',    productor: 'CREMASCHI',                       sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:20000,  sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:20000,   kg2JMasGrandes:14000  },
  { variedad: 'SANTINA',    productor: 'DONA ISABEL',                     sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:22000,  sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:22000,   kg2JMasGrandes:15400  },
  { variedad: 'LAPINS',     productor: 'FUSION',                          sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:4000,   sem50:4000,   sem51:4000,   sem52:0, sem1:0, sem2:0, totalKg:12000,   kg2JMasGrandes:9600   },
  { variedad: 'SANTINA',    productor: 'FUSION',                          sem44:0, sem45:0,     sem46:0,     sem47:5000,   sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:5000,    kg2JMasGrandes:3500   },
  { variedad: 'LAPINS',     productor: 'INV MAULE',                       sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:7000,   sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:7000,    kg2JMasGrandes:5600   },
  { variedad: 'LAPINS',     productor: 'J LECAROS',                       sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:56000,  sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:56000,   kg2JMasGrandes:44800  },
  { variedad: 'SANTINA',    productor: 'J LECAROS',                       sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:24000,  sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:24000,   kg2JMasGrandes:16800  },
  { variedad: 'LAPINS',     productor: 'JOSE ANTONIO DE LA JARA',         sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:32000,  sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:32000,   kg2JMasGrandes:25600  },
  { variedad: 'SANTINA',    productor: 'JOSE ANTONIO DE LA JARA',         sem44:0, sem45:0,     sem46:0,     sem47:6000,   sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:6000,    kg2JMasGrandes:4200   },
  { variedad: 'LAPINS',     productor: 'LAS RAICES',                      sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:10000,  sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:10000,   kg2JMasGrandes:8000   },
  { variedad: 'SANTINA',    productor: 'LAS RAICES',                      sem44:0, sem45:0,     sem46:0,     sem47:4000,   sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:4000,    kg2JMasGrandes:2800   },
  { variedad: 'SANTINA',    productor: 'LEFENDA',                         sem44:0, sem45:0,     sem46:1000,  sem47:1000,   sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:2000,    kg2JMasGrandes:1400   },
  { variedad: 'LAPINS',     productor: 'LEFENDA',                         sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:1000,   sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:1000,    kg2JMasGrandes:800    },
  { variedad: 'LAPINS',     productor: 'LUIS DE LA JARA',                 sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:12000,  sem49:3000,   sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:15000,   kg2JMasGrandes:12000  },
  { variedad: 'LAPINS',     productor: 'MARIA RITA GONZALEZ',             sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:24000,  sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:24000,   kg2JMasGrandes:19200  },
  { variedad: 'SANTINA',    productor: 'MARIA RITA GONZALEZ',             sem44:0, sem45:0,     sem46:0,     sem47:2000,   sem48:6000,   sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:8000,    kg2JMasGrandes:5600   },
  { variedad: 'LAPINS',     productor: 'MAURICIO PINO',                   sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:40000,  sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:40000,   kg2JMasGrandes:32000  },
  { variedad: 'SANTINA',    productor: 'MAURICIO PINO',                   sem44:0, sem45:0,     sem46:0,     sem47:30000,  sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:30000,   kg2JMasGrandes:21000  },
  { variedad: 'LAPINS',     productor: 'PARIENTE',                        sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:0,      sem50:25000,  sem51:15000,  sem52:0, sem1:0, sem2:0, totalKg:40000,   kg2JMasGrandes:32000  },
  { variedad: 'SANTINA',    productor: 'PARIENTE',                        sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:30000,  sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:30000,   kg2JMasGrandes:21000  },
  { variedad: 'LAPINS',     productor: 'RICARDO BRINKMANN',               sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:13000,  sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:13000,   kg2JMasGrandes:10400  },
  { variedad: 'SANTINA',    productor: 'SAN ALBERTO',                     sem44:0, sem45:0,     sem46:20000, sem47:27000,  sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:47000,   kg2JMasGrandes:32900  },
  { variedad: 'SANTINA',    productor: 'SAN RAMON',                       sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:37000,  sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:37000,   kg2JMasGrandes:25900  },
  { variedad: 'LAPINS',     productor: 'SAN RAMON',                       sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:0,      sem50:0,      sem51:30000,  sem52:0, sem1:0, sem2:0, totalKg:30000,   kg2JMasGrandes:24000  },
  { variedad: 'SANTINA',    productor: 'SANTA ADELAIDA',                  sem44:0, sem45:0,     sem46:9000,  sem47:39000,  sem48:29000,  sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:77000,   kg2JMasGrandes:53900  },
  { variedad: 'LAPINS',     productor: 'SANTA ADELAIDA',                  sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:25000,  sem49:30000,  sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:55000,   kg2JMasGrandes:44000  },
  { variedad: 'ROYAL DAWN', productor: 'SANTA ADELAIDA',                  sem44:0, sem45:0,     sem46:6000,  sem47:0,      sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:6000,    kg2JMasGrandes:4200   },
  { variedad: 'BROOKS',     productor: 'SANTA ADELAIDA',                  sem44:0, sem45:0,     sem46:3000,  sem47:3000,   sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:6000,    kg2JMasGrandes:1920   },
  { variedad: 'SANTINA',    productor: 'SANTA JULIA',                     sem44:0, sem45:12000, sem46:40000, sem47:76000,  sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:128000,  kg2JMasGrandes:89600  },
  { variedad: 'LAPINS',     productor: 'SANTA JULIA',                     sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:28000,  sem49:30000,  sem50:30000,  sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:88000,   kg2JMasGrandes:70400  },
  { variedad: 'FRISCO',     productor: 'SANTA JULIA',                     sem44:0, sem45:5000,  sem46:15000, sem47:0,      sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:20000,   kg2JMasGrandes:8000   },
  { variedad: 'ROYAL DAWN', productor: 'SANTA JULIA',                     sem44:2000, sem45:4000, sem46:0,   sem47:6000,   sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:12000,   kg2JMasGrandes:8400   },
  { variedad: 'BROOKS',     productor: 'SANTA JULIA',                     sem44:2000, sem45:9000, sem46:0,   sem47:0,      sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:11000,   kg2JMasGrandes:3520   },
  { variedad: 'VAN',        productor: 'SANTA JULIA',                     sem44:0, sem45:1000,  sem46:2000,  sem47:0,      sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:3000,    kg2JMasGrandes:900    },
  { variedad: 'LAPINS',     productor: 'SANTA MARIA ODESSA',              sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:2000,   sem50:37000,  sem51:11000,  sem52:0, sem1:0, sem2:0, totalKg:50000,   kg2JMasGrandes:40000  },
  { variedad: 'SWEET HEART',productor: 'SANTA MARIA ODESSA',              sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:0,      sem50:0,      sem51:18000,  sem52:0, sem1:0, sem2:0, totalKg:18000,   kg2JMasGrandes:10260  },
  { variedad: 'REGINA',     productor: 'SANTA MARIA ODESSA',              sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:0,      sem50:1000,   sem51:16000,  sem52:0, sem1:0, sem2:0, totalKg:17000,   kg2JMasGrandes:7820   },
  { variedad: 'SANTINA',    productor: 'SANTA MARIA ODESSA',              sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:6000,   sem49:2000,   sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:8000,    kg2JMasGrandes:5600   },
  { variedad: 'BING',       productor: 'SANTA MARIA ODESSA',              sem44:0, sem45:3000,  sem46:0,     sem47:0,      sem48:0,      sem49:1000,   sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:4000,    kg2JMasGrandes:2080   },
  { variedad: 'LAPINS',     productor: 'SANTA ROSARIO',                   sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:62000,  sem50:77000,  sem51:14000,  sem52:0, sem1:0, sem2:0, totalKg:153000,  kg2JMasGrandes:122400 },
  { variedad: 'SANTINA',    productor: 'SANTA ROSARIO',                   sem44:0, sem45:0,     sem46:0,     sem47:61000,  sem48:89000,  sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:150000,  kg2JMasGrandes:105000 },
  { variedad: 'SANTINA',    productor: 'SIRZO',                           sem44:0, sem45:0,     sem46:0,     sem47:25000,  sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:25000,   kg2JMasGrandes:17500  },
  { variedad: 'LAPINS',     productor: 'SIRZO',                           sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:25000,  sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:25000,   kg2JMasGrandes:20000  },
  { variedad: 'LAPINS',     productor: 'TORREFRUT',                       sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:0,      sem50:4000,   sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:4000,    kg2JMasGrandes:3200   },
  { variedad: 'SANTINA',    productor: 'TORREFRUT',                       sem44:0, sem45:0,     sem46:0,     sem47:2000,   sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:2000,    kg2JMasGrandes:1400   },
  { variedad: 'KORDIA',     productor: 'TORREFRUT',                       sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:0,      sem50:1000,   sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:1000,    kg2JMasGrandes:520    },
  { variedad: 'REGINA',     productor: 'TORREFRUT',                       sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:0,      sem50:1000,   sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:1000,    kg2JMasGrandes:460    },
  { variedad: 'LAPINS',     productor: 'TOTIHUE',                         sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:0,      sem50:6000,   sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:6000,    kg2JMasGrandes:4800   },
  { variedad: 'SANTINA',    productor: 'TOTIHUE',                         sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:4000,   sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:4000,    kg2JMasGrandes:2800   },
  { variedad: 'LAPINS',     productor: 'VILLA',                           sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:0,      sem50:15000,  sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:15000,   kg2JMasGrandes:12000  },
  { variedad: 'SANTINA',    productor: 'VILLA',                           sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:3000,   sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:3000,    kg2JMasGrandes:2100   },
  { variedad: 'LAPINS',     productor: 'VISTA AL VALLE',                  sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:33000,  sem50:20000,  sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:53000,   kg2JMasGrandes:42400  },
  { variedad: 'BING',       productor: 'VISTA AL VALLE',                  sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:0,      sem50:14000,  sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:14000,   kg2JMasGrandes:7280   },
  { variedad: 'REGINA',     productor: 'VISTA AL VALLE',                  sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:0,      sem50:0,      sem51:9000,   sem52:0, sem1:0, sem2:0, totalKg:9000,    kg2JMasGrandes:4140   },
  { variedad: 'SANTINA',    productor: 'VISTA AL VALLE',                  sem44:0, sem45:0,     sem46:0,     sem47:8000,   sem48:0,      sem49:0,      sem50:0,      sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:8000,    kg2JMasGrandes:5600   },
  { variedad: 'SKEENA',     productor: 'VISTA AL VALLE',                  sem44:0, sem45:0,     sem46:0,     sem47:0,      sem48:0,      sem49:0,      sem50:5000,   sem51:0,      sem52:0, sem1:0, sem2:0, totalKg:5000,    kg2JMasGrandes:4050   },
]

export interface CompromisoCliente {
  cliente: string
  pais: string
  variedad: string
  calibreSolicitado: string
  sem47: number; sem48: number; sem49: number; sem50: number; sem51: number
  totalKgComprometido: number
  [key: string]: string | number
}

export const COMPROMISOS_CLIENTES: CompromisoCliente[] = [
  { cliente: 'Shinemore HK Ltd', pais: 'China',    variedad: 'LAPINS',  calibreSolicitado: '5J+4J',   sem47: 5000,  sem48: 8000,  sem49: 10000, sem50: 8000,  sem51: 5000,  totalKgComprometido: 36000 },
  { cliente: 'Fresh Asia KK',    pais: 'Japón',    variedad: 'SANTINA', calibreSolicitado: '4J+3J',   sem47: 3000,  sem48: 5000,  sem49: 8000,  sem50: 6000,  sem51: 3000,  totalKgComprometido: 25000 },
  { cliente: 'Metro Fruits EU',  pais: 'Alemania', variedad: 'KORDIA',  calibreSolicitado: '5J',      sem47: 2000,  sem48: 4000,  sem49: 6000,  sem50: 5000,  sem51: 2000,  totalKgComprometido: 19000 },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

export function getResumenPorVariedad() {
  const map: Record<string, { variedad: string; totalKg: number; kg2JMasGrandes: number; porSemana: Record<string, number> }> = {}

  for (const row of PROGRAMACION_SEMANAL) {
    if (!map[row.variedad]) {
      map[row.variedad] = { variedad: row.variedad, totalKg: 0, kg2JMasGrandes: 0, porSemana: {} }
    }
    map[row.variedad].totalKg += row.totalKg
    map[row.variedad].kg2JMasGrandes += row.kg2JMasGrandes
    for (const sem of SEMANAS) {
      const val = row[sem.key] as number
      map[row.variedad].porSemana[sem.key] = (map[row.variedad].porSemana[sem.key] ?? 0) + val
    }
  }

  const total = Object.values(map).reduce((s, v) => s + v.totalKg, 0)
  return Object.values(map)
    .map((v) => ({ ...v, pctTotal: total > 0 ? v.totalKg / total : 0 }))
    .sort((a, b) => b.totalKg - a.totalKg)
}

export function getTotalPorSemana() {
  const result: Record<string, number> = {}
  for (const sem of SEMANAS) result[sem.key] = 0
  for (const row of PROGRAMACION_SEMANAL) {
    for (const sem of SEMANAS) {
      result[sem.key] += row[sem.key] as number
    }
  }
  return result
}

export function getDisponibleVsComprometido() {
  const resumen = getResumenPorVariedad()
  const comprometidoPorVariedad: Record<string, number> = {}

  for (const c of COMPROMISOS_CLIENTES) {
    comprometidoPorVariedad[c.variedad] = (comprometidoPorVariedad[c.variedad] ?? 0) + c.totalKgComprometido
  }

  return resumen.map((v) => {
    const comprometido = comprometidoPorVariedad[v.variedad] ?? 0
    const pct = v.totalKg > 0 ? comprometido / v.totalKg : 0
    const alerta = pct > 1 ? 'ROJO' : pct > 0.8 ? 'AMARILLO' : 'VERDE'
    return { ...v, comprometido, saldoLibre: v.totalKg - comprometido, pctComprometido: pct, alerta }
  })
}

export function getRetornoEconomicoEstimado() {
  const resumen = getResumenPorVariedad()
  return resumen.map((v) => {
    const variedad = VARIEDADES.find((vd) => vd.codigo === v.variedad || vd.nombre.toUpperCase() === v.variedad)
    const pctExp = variedad?.pctExportacion ?? 0.85

    // Precio ponderado basado en distribución de calibres
    const pct4j = (variedad?.pct4J ?? 0) / 100
    const pct3j = (variedad?.pct3J ?? 0) / 100
    const pct2j = (variedad?.pct2J ?? 0) / 100
    const pctj  = (variedad?.pctJ  ?? 0) / 100
    const pctXL = (variedad?.pctXL ?? 0) / 100
    const pct5j = (variedad?.pct5J ?? 0) / 100

    const precioBase = PRECIOS_CALIBRES.find((p) => p.calibre === '3J')?.precioUSD ?? 6
    const precioPonderado =
      pct5j * (PRECIOS_CALIBRES.find((p) => p.calibre === '5J')?.precioUSD ?? 14.5) +
      pct4j * (PRECIOS_CALIBRES.find((p) => p.calibre === '4J')?.precioUSD ?? 10.0) +
      pct3j * (PRECIOS_CALIBRES.find((p) => p.calibre === '3J')?.precioUSD ?? 6.0) +
      pct2j * (PRECIOS_CALIBRES.find((p) => p.calibre === '2J')?.precioUSD ?? 4.2) +
      pctj  * (PRECIOS_CALIBRES.find((p) => p.calibre === 'J' )?.precioUSD ?? 3.8) +
      pctXL * (PRECIOS_CALIBRES.find((p) => p.calibre === 'XL')?.precioUSD ?? 2.9) || precioBase

    const kgExport = Math.round(v.totalKg * pctExp)
    const retornoUSD = Math.round(kgExport * precioPonderado)

    return { variedad: v.variedad, totalKg: v.totalKg, kgExport, pctExportacion: pctExp, precioPonderado, retornoUSD }
  })
}

export function fmtKg(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + ' M kg'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + ' t'
  return n.toLocaleString('es-CL') + ' kg'
}

export function fmtUSD(n: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export interface Productor {
  id: number
  razonSocial: string
  nombreHuerto: string
  comuna: string
  region: string
  csg: string
  direccion: string
  especie: string
  variedades: string[]
}

export const PRODUCTORES: Productor[] = [
  { id: 1,  razonSocial: 'AGROELITE',                                    nombreHuerto: 'AGROELITE',           comuna: 'OLIVAR',       region: "VI - O'Higgins", csg: '154148',   direccion: 'Sector El Olivar, Rancagua',        especie: 'CEREZAS', variedades: ['Santina', 'Lapins', 'Regina'] },
  { id: 2,  razonSocial: 'AGROLIQUID',                                   nombreHuerto: 'AGROLIQUID',           comuna: 'RENGO',        region: "VI - O'Higgins", csg: '3141487',  direccion: 'Sector Rengo Sur',                  especie: 'CEREZAS', variedades: ['Santina'] },
  { id: 3,  razonSocial: 'ALIRO CORNEJO',                                nombreHuerto: 'ALIRO CORNEJO',        comuna: 'CHIMBARONGO',  region: "VI - O'Higgins", csg: '119368',   direccion: 'Camino Chimbarongo',                especie: 'CEREZAS', variedades: ['Lapins', 'Santina'] },
  { id: 4,  razonSocial: 'ANDREA DEL PILAR FARIAS LORCA',               nombreHuerto: 'ANDREA DEL PILAR',    comuna: 'REQUINOA',     region: "VI - O'Higgins", csg: '3129656',  direccion: 'Sector Requínoa',                   especie: 'CEREZAS', variedades: ['Lapins'] },
  { id: 5,  razonSocial: 'ANDRES RISOPATRON',                            nombreHuerto: 'ANDRES RISOPATRON',   comuna: 'RENGO',        region: "VI - O'Higgins", csg: '161057',   direccion: 'Av. Camino Las Nieves, Rengo',      especie: 'CEREZAS', variedades: ['Lapins', 'Santina'] },
  { id: 6,  razonSocial: 'ANGEL MARTINEZ',                               nombreHuerto: 'ANGEL MARTINEZ',      comuna: 'MALLOA',       region: "VI - O'Higgins", csg: '116120',   direccion: 'Sector Los Cristales, Malloa',      especie: 'CEREZAS', variedades: ['Lapins', 'Santina'] },
  { id: 7,  razonSocial: 'CASAS VIEJAS',                                 nombreHuerto: 'CASAS VIEJAS',        comuna: 'SAN FERNANDO', region: "VI - O'Higgins", csg: '99315',    direccion: 'Camino Las Casas, San Fernando',    especie: 'CEREZAS', variedades: ['Lapins', 'Santina', 'Royal Dawn'] },
  { id: 8,  razonSocial: 'COPA DE AGUA',                                 nombreHuerto: 'COPA DE AGUA',        comuna: 'NANCAGUA',     region: "VI - O'Higgins", csg: '3176698',  direccion: 'Sector Copa de Agua, Nancagua',     especie: 'CEREZAS', variedades: ['Skeena', 'Regina'] },
  { id: 9,  razonSocial: 'CORCOLEN',                                     nombreHuerto: 'CORCOLEN',            comuna: 'COLTAUCO',     region: "VI - O'Higgins", csg: '153813',   direccion: 'Fundo Corcolén, Coltauco',          especie: 'CEREZAS', variedades: ['Santina'] },
  { id: 10, razonSocial: 'CREMASCHI',                                    nombreHuerto: 'CREMASCHI',           comuna: 'CHIMBARONGO',  region: "VI - O'Higgins", csg: '169553',   direccion: 'Camino Chimbarongo Interior',       especie: 'CEREZAS', variedades: ['Lapins', 'Santina'] },
  { id: 11, razonSocial: 'DONA ISABEL',                                  nombreHuerto: 'DONA ISABEL',         comuna: 'RENGO',        region: "VI - O'Higgins", csg: '105440',   direccion: 'Fundo Doña Isabel, Rengo',          especie: 'CEREZAS', variedades: ['Santina'] },
  { id: 12, razonSocial: 'FUSION',                                       nombreHuerto: 'FUSION',              comuna: 'REQUINOA',     region: "VI - O'Higgins", csg: '174461',   direccion: 'Sector El Arrayán, Requínoa',       especie: 'CEREZAS', variedades: ['Lapins', 'Santina'] },
  { id: 13, razonSocial: 'INV MAULE',                                    nombreHuerto: 'INV MAULE',           comuna: 'CURICO',       region: 'VII - Maule',    csg: '97574',    direccion: 'Sector Longitudinal, Curicó',       especie: 'CEREZAS', variedades: ['Lapins'] },
  { id: 14, razonSocial: 'J LECAROS',                                    nombreHuerto: 'J LECAROS',           comuna: 'RENGO',        region: "VI - O'Higgins", csg: '118224',   direccion: 'Fundo Las Higueras, Rengo',         especie: 'CEREZAS', variedades: ['Lapins', 'Santina'] },
  { id: 15, razonSocial: 'JOSE ANTONIO DE LA JARA',                     nombreHuerto: 'JOSE ANTONIO DE LA JARA', comuna: 'REQUINOA', region: "VI - O'Higgins", csg: '171784',   direccion: 'Camino San Vicente, Requínoa',      especie: 'CEREZAS', variedades: ['Lapins', 'Santina'] },
  { id: 16, razonSocial: 'LAS RAICES',                                   nombreHuerto: 'LAS RAICES',          comuna: 'CHIMBARONGO',  region: "VI - O'Higgins", csg: '96274',    direccion: 'Fundo Las Raíces, Chimbarongo',     especie: 'CEREZAS', variedades: ['Lapins', 'Santina'] },
  { id: 17, razonSocial: 'LEFENDA',                                      nombreHuerto: 'LEFENDA',             comuna: 'NANCAGUA',     region: "VI - O'Higgins", csg: '3176868',  direccion: 'Sector La Fenda, Nancagua',         especie: 'CEREZAS', variedades: ['Santina', 'Lapins'] },
  { id: 18, razonSocial: 'LUIS DE LA JARA',                             nombreHuerto: 'LUIS DE LA JARA',     comuna: 'REQUINOA',     region: "VI - O'Higgins", csg: '177929',   direccion: 'Camino El Olivar, Requínoa',        especie: 'CEREZAS', variedades: ['Lapins'] },
  { id: 19, razonSocial: 'MARIA RITA GONZALEZ',                         nombreHuerto: 'MARIA RITA GONZALEZ', comuna: 'MALLOA',       region: "VI - O'Higgins", csg: '3126282',  direccion: 'Sector El Carmen, Malloa',          especie: 'CEREZAS', variedades: ['Lapins', 'Santina'] },
  { id: 20, razonSocial: 'SOCIEDAD AGRICOLA Y FORESTAL PINO SPA',       nombreHuerto: 'MAURICIO PINO',       comuna: 'MALLOA',       region: "VI - O'Higgins", csg: '3130897',  direccion: 'Camino Longitudinal Malloa s/n',    especie: 'CEREZAS', variedades: ['Lapins', 'Santina'] },
  { id: 21, razonSocial: 'JUAN DOMINGO RIVERA ARENAS',                  nombreHuerto: 'JUAN DOMINGO RIVERA', comuna: 'CHIMBARONGO',  region: "VI - O'Higgins", csg: '163821',   direccion: 'Calle Las Arenas, Chimbarongo',     especie: 'CEREZAS', variedades: ['Lapins'] },
  { id: 22, razonSocial: 'RICARDO BRINKMANN',                           nombreHuerto: 'RICARDO BRINKMANN',   comuna: 'SAN FERNANDO', region: "VI - O'Higgins", csg: '3103510',  direccion: 'Fundo El Parral, San Fernando',     especie: 'CEREZAS', variedades: ['Lapins'] },
  { id: 23, razonSocial: 'SAN ALBERTO',                                 nombreHuerto: 'SAN ALBERTO',         comuna: 'RENGO',        region: "VI - O'Higgins", csg: '90732',    direccion: 'Fundo San Alberto, Rengo',          especie: 'CEREZAS', variedades: ['Santina'] },
  { id: 24, razonSocial: 'SOC AGRICOLA GANADERA Y FORESTAL SAN RAMON LTDA', nombreHuerto: 'SAN RAMON',  comuna: 'REQUINOA',     region: "VI - O'Higgins", csg: '172170',   direccion: 'Camino Longitudinal, Requínoa',     especie: 'CEREZAS', variedades: ['Santina', 'Lapins'] },
  { id: 25, razonSocial: 'SANTA ADELAIDA',                              nombreHuerto: 'SANTA ADELAIDA',      comuna: 'CHIMBARONGO',  region: "VI - O'Higgins", csg: '3125863',  direccion: 'Fundo Santa Adelaida, Chimbarongo', especie: 'CEREZAS', variedades: ['Santina', 'Lapins', 'Royal Dawn', 'Brooks'] },
  { id: 26, razonSocial: 'SANTA JULIA',                                 nombreHuerto: 'SANTA JULIA',         comuna: 'RENGO',        region: "VI - O'Higgins", csg: '98957',    direccion: 'Fundo Santa Julia, Rengo',          especie: 'CEREZAS', variedades: ['Santina', 'Lapins', 'Frisco', 'Royal Dawn', 'Brooks', 'Van'] },
  { id: 27, razonSocial: 'SANTA MARIA ODESSA',                         nombreHuerto: 'SANTA MARIA ODESSA',  comuna: 'SAN FERNANDO', region: "VI - O'Higgins", csg: '95779',    direccion: 'Fundo Santa María Odessa, San Fernando', especie: 'CEREZAS', variedades: ['Lapins', 'Sweet Heart', 'Regina', 'Santina', 'Bing'] },
  { id: 28, razonSocial: 'SANTA ROSARIO',                              nombreHuerto: 'SANTA ROSARIO',       comuna: 'MALLOA',       region: "VI - O'Higgins", csg: '95400',    direccion: 'Camino El Rosario, Malloa',         especie: 'CEREZAS', variedades: ['Lapins', 'Santina'] },
  { id: 29, razonSocial: 'SIRZO BALTAZAR CARO LIZANA',                 nombreHuerto: 'SIRZO',               comuna: 'CHIMBARONGO',  region: "VI - O'Higgins", csg: '3129422',  direccion: 'Sector Los Nogales, Chimbarongo',   especie: 'CEREZAS', variedades: ['Santina', 'Lapins'] },
  { id: 30, razonSocial: 'TORREFUT',                                    nombreHuerto: 'TORREFUT',            comuna: 'REQUINOA',     region: "VI - O'Higgins", csg: '3176834',  direccion: 'Sector La Torre, Requínoa',         especie: 'CEREZAS', variedades: ['Lapins', 'Santina', 'Kordia', 'Regina'] },
  { id: 31, razonSocial: 'TOTIHE',                                      nombreHuerto: 'TOTIHE',              comuna: 'COLTAUCO',     region: "VI - O'Higgins", csg: '3153979',  direccion: 'Fundo Totihuén, Coltauco',          especie: 'CEREZAS', variedades: ['Lapins', 'Santina'] },
  { id: 32, razonSocial: 'VILLA',                                       nombreHuerto: 'VILLA',               comuna: 'CHIMBARONGO',  region: "VI - O'Higgins", csg: '—',        direccion: 'Sector La Villa, Chimbarongo',      especie: 'CEREZAS', variedades: ['Lapins', 'Santina'] },
  { id: 33, razonSocial: 'VISTA AL VALLE',                             nombreHuerto: 'VISTA AL VALLE',      comuna: 'RENGO',        region: "VI - O'Higgins", csg: '90655',    direccion: 'Fundo Vista al Valle, Rengo',       especie: 'CEREZAS', variedades: ['Lapins', 'Bing', 'Regina', 'Santina', 'Skeena'] },
  { id: 34, razonSocial: 'SOCIEDAD AGRICOLA EL RINCON B LIMITADA',     nombreHuerto: 'EL RINCON',           comuna: 'SAN FERNANDO', region: "VI - O'Higgins", csg: '—',        direccion: 'Sector El Rincón, San Fernando',    especie: 'CEREZAS', variedades: [] },
]

export interface HectareaRow {
  id: number
  razonSocial: string
  huerto: string
  haCerezo: number | null
  anioPlantacion: number | null
  edadAnios: number | null
  rendEstKgHa: number
  kgEsperadoTotal: number | null
  kgProgramado: number
  diferenciKg: number | null
  pctUsoCapacidad: number | null
  observacion: string
}

export function getHectareas(): HectareaRow[] {
  const rendEstKgHa = 18000
  return PRODUCTORES.map((p) => {
    const kgProg = PROGRAMACION_SEMANAL.filter((r) => r.productor === p.nombreHuerto || r.productor === p.razonSocial.split(' ')[0]).reduce((s, r) => s + r.totalKg, 0)
    return {
      id: p.id,
      razonSocial: p.razonSocial,
      huerto: p.nombreHuerto,
      haCerezo: null,
      anioPlantacion: null,
      edadAnios: null,
      rendEstKgHa,
      kgEsperadoTotal: null,
      kgProgramado: kgProg,
      diferenciKg: null,
      pctUsoCapacidad: null,
      observacion: '✏️ Ingresar Ha.',
    }
  })
}

// ── Hectáreas Data from Excel ─────────────────────────────────────────────────

export interface HectareaBlock {
  haCerezo: number
  anioPlantacion: number | null
  rendEstKgHa: number
}

export interface HectareaData {
  nombreHuerto: string       // matches PRODUCTORES nombreHuerto
  blocks: HectareaBlock[]    // one per plantation block in the Excel
  haCerezoTotal: number | null
  anioPlantacionPrincipal: number | null  // earliest planting year
  rendEstKgHa: number        // weighted-average or dominant value
  kgEsperadoTotal: number | null
}

// Aggregated from Excel "🌿 Hectáreas y Rendimiento" sheet.
// Producers with no Ha data (✏️ Ingresar Ha.) have null values.
export const HECTAREAS_DATA: HectareaData[] = [
  {
    nombreHuerto: 'AGROELITE',
    blocks: [],
    haCerezoTotal: null,
    anioPlantacionPrincipal: null,
    rendEstKgHa: 18000,
    kgEsperadoTotal: null,
  },
  {
    nombreHuerto: 'AGROLIQUID',
    blocks: [{ haCerezo: 13, anioPlantacion: 2022, rendEstKgHa: 8000 }],
    haCerezoTotal: 13,
    anioPlantacionPrincipal: 2022,
    rendEstKgHa: 8000,
    kgEsperadoTotal: 104000,
  },
  {
    nombreHuerto: 'ALIRO CORNEJO',
    blocks: [{ haCerezo: 2.5, anioPlantacion: 2018, rendEstKgHa: 14000 }],
    haCerezoTotal: 2.5,
    anioPlantacionPrincipal: 2018,
    rendEstKgHa: 14000,
    kgEsperadoTotal: 35000,
  },
  {
    nombreHuerto: 'ANDREA DEL PILAR',
    blocks: [{ haCerezo: 0.6, anioPlantacion: 2021, rendEstKgHa: 8000 }],
    haCerezoTotal: 0.6,
    anioPlantacionPrincipal: 2021,
    rendEstKgHa: 8000,
    kgEsperadoTotal: 4800,
  },
  {
    nombreHuerto: 'ANDRES RISOPATRON',
    blocks: [
      { haCerezo: 14, anioPlantacion: 2020, rendEstKgHa: 14000 },
      { haCerezo: 10, anioPlantacion: 2023, rendEstKgHa: 8000 },
    ],
    haCerezoTotal: 24,
    anioPlantacionPrincipal: 2020,
    rendEstKgHa: 11417,
    kgEsperadoTotal: 276000,
  },
  {
    nombreHuerto: 'ANGEL MARTINEZ',
    blocks: [
      { haCerezo: 2, anioPlantacion: 2010, rendEstKgHa: 18000 },
      { haCerezo: 1.5, anioPlantacion: 2022, rendEstKgHa: 8000 },
    ],
    haCerezoTotal: 3.5,
    anioPlantacionPrincipal: 2010,
    rendEstKgHa: 13714,
    kgEsperadoTotal: 48000,
  },
  {
    nombreHuerto: 'CASAS VIEJAS',
    blocks: [
      { haCerezo: 3, anioPlantacion: 2014, rendEstKgHa: 18000 },
      { haCerezo: 4, anioPlantacion: 2021, rendEstKgHa: 8000 },
      { haCerezo: 8, anioPlantacion: 2022, rendEstKgHa: 8000 },
      { haCerezo: 4, anioPlantacion: 2023, rendEstKgHa: 8000 },
      { haCerezo: 1, anioPlantacion: 2024, rendEstKgHa: 3000 },
    ],
    haCerezoTotal: 20,
    anioPlantacionPrincipal: 2014,
    rendEstKgHa: 9250,
    kgEsperadoTotal: 185000,
  },
  {
    nombreHuerto: 'COPA DE AGUA',
    blocks: [{ haCerezo: 8, anioPlantacion: 2021, rendEstKgHa: 8000 }],
    haCerezoTotal: 8,
    anioPlantacionPrincipal: 2021,
    rendEstKgHa: 8000,
    kgEsperadoTotal: 64000,
  },
  {
    nombreHuerto: 'CORCOLEN',
    blocks: [{ haCerezo: 90, anioPlantacion: null, rendEstKgHa: 18000 }],
    haCerezoTotal: 90,
    anioPlantacionPrincipal: null,
    rendEstKgHa: 18000,
    kgEsperadoTotal: 1620000,
  },
  {
    nombreHuerto: 'CREMASCHI',
    blocks: [{ haCerezo: 4, anioPlantacion: 2022, rendEstKgHa: 8000 }],
    haCerezoTotal: 4,
    anioPlantacionPrincipal: 2022,
    rendEstKgHa: 8000,
    kgEsperadoTotal: 32000,
  },
  {
    nombreHuerto: 'DONA ISABEL',
    blocks: [
      { haCerezo: 7.45, anioPlantacion: 2018, rendEstKgHa: 14000 },
      { haCerezo: 4, anioPlantacion: 2021, rendEstKgHa: 8000 },
      { haCerezo: 2, anioPlantacion: 2022, rendEstKgHa: 8000 },
    ],
    haCerezoTotal: 13.45,
    anioPlantacionPrincipal: 2018,
    rendEstKgHa: 11404,
    kgEsperadoTotal: 152300,
  },
  {
    nombreHuerto: 'FUSION',
    blocks: [],
    haCerezoTotal: null,
    anioPlantacionPrincipal: null,
    rendEstKgHa: 18000,
    kgEsperadoTotal: null,
  },
  {
    nombreHuerto: 'INV MAULE',
    blocks: [
      { haCerezo: 7, anioPlantacion: 2021, rendEstKgHa: 8000 },
      { haCerezo: 2, anioPlantacion: 2023, rendEstKgHa: 8000 },
      { haCerezo: 7, anioPlantacion: 2025, rendEstKgHa: 3000 },
    ],
    haCerezoTotal: 16,
    anioPlantacionPrincipal: 2021,
    rendEstKgHa: 6563,
    kgEsperadoTotal: 93000,
  },
  {
    nombreHuerto: 'J LECAROS',
    blocks: [{ haCerezo: 8.4, anioPlantacion: 2021, rendEstKgHa: 8000 }],
    haCerezoTotal: 8.4,
    anioPlantacionPrincipal: 2021,
    rendEstKgHa: 8000,
    kgEsperadoTotal: 67200,
  },
  {
    nombreHuerto: 'JOSE ANTONIO DE LA JARA',
    blocks: [
      { haCerezo: 6, anioPlantacion: 2019, rendEstKgHa: 14000 },
      { haCerezo: 5.5, anioPlantacion: 2024, rendEstKgHa: 3000 },
    ],
    haCerezoTotal: 11.5,
    anioPlantacionPrincipal: 2019,
    rendEstKgHa: 8978,
    kgEsperadoTotal: 100500,
  },
  {
    nombreHuerto: 'LAS RAICES',
    blocks: [
      { haCerezo: 3, anioPlantacion: 2019, rendEstKgHa: 14000 },
      { haCerezo: 3, anioPlantacion: 2023, rendEstKgHa: 8000 },
      { haCerezo: 2, anioPlantacion: 2020, rendEstKgHa: 14000 },
    ],
    haCerezoTotal: 8,
    anioPlantacionPrincipal: 2019,
    rendEstKgHa: 12000,
    kgEsperadoTotal: 94000,
  },
  {
    nombreHuerto: 'LEFENDA',
    blocks: [{ haCerezo: 11, anioPlantacion: 2022, rendEstKgHa: 8000 }],
    haCerezoTotal: 11,
    anioPlantacionPrincipal: 2022,
    rendEstKgHa: 8000,
    kgEsperadoTotal: 88000,
  },
  {
    nombreHuerto: 'LUIS DE LA JARA',
    blocks: [
      { haCerezo: 3, anioPlantacion: 2018, rendEstKgHa: 14000 },
      { haCerezo: 7, anioPlantacion: 2022, rendEstKgHa: 8000 },
      { haCerezo: 5, anioPlantacion: 2024, rendEstKgHa: 3000 },
    ],
    haCerezoTotal: 15,
    anioPlantacionPrincipal: 2018,
    rendEstKgHa: 7533,
    kgEsperadoTotal: 113000,
  },
  {
    nombreHuerto: 'MARIA RITA GONZALEZ',
    blocks: [{ haCerezo: 6, anioPlantacion: 2019, rendEstKgHa: 14000 }],
    haCerezoTotal: 6,
    anioPlantacionPrincipal: 2019,
    rendEstKgHa: 14000,
    kgEsperadoTotal: 84000,
  },
  {
    nombreHuerto: 'MAURICIO PINO',
    blocks: [],
    haCerezoTotal: null,
    anioPlantacionPrincipal: null,
    rendEstKgHa: 18000,
    kgEsperadoTotal: null,
  },
  {
    nombreHuerto: 'JUAN DOMINGO RIVERA',
    blocks: [],
    haCerezoTotal: null,
    anioPlantacionPrincipal: null,
    rendEstKgHa: 18000,
    kgEsperadoTotal: null,
  },
  {
    nombreHuerto: 'RICARDO BRINKMANN',
    blocks: [{ haCerezo: 2, anioPlantacion: 2016, rendEstKgHa: 14000 }],
    haCerezoTotal: 2,
    anioPlantacionPrincipal: 2016,
    rendEstKgHa: 14000,
    kgEsperadoTotal: 28000,
  },
  {
    nombreHuerto: 'SAN ALBERTO',
    blocks: [{ haCerezo: 20, anioPlantacion: 2021, rendEstKgHa: 8000 }],
    haCerezoTotal: 20,
    anioPlantacionPrincipal: 2021,
    rendEstKgHa: 8000,
    kgEsperadoTotal: 160000,
  },
  {
    nombreHuerto: 'SAN RAMON',
    blocks: [],
    haCerezoTotal: null,
    anioPlantacionPrincipal: null,
    rendEstKgHa: 18000,
    kgEsperadoTotal: null,
  },
  {
    nombreHuerto: 'SANTA ADELAIDA',
    blocks: [{ haCerezo: 41, anioPlantacion: null, rendEstKgHa: 18000 }],
    haCerezoTotal: 41,
    anioPlantacionPrincipal: null,
    rendEstKgHa: 18000,
    kgEsperadoTotal: 738000,
  },
  {
    nombreHuerto: 'SANTA JULIA',
    blocks: [{ haCerezo: 59.3, anioPlantacion: null, rendEstKgHa: 18000 }],
    haCerezoTotal: 59.3,
    anioPlantacionPrincipal: null,
    rendEstKgHa: 18000,
    kgEsperadoTotal: 1067400,
  },
  {
    nombreHuerto: 'SANTA MARIA ODESSA',
    blocks: [
      { haCerezo: 9, anioPlantacion: 2017, rendEstKgHa: 14000 },
      { haCerezo: 2.5, anioPlantacion: 2010, rendEstKgHa: 18000 },
      { haCerezo: 5.5, anioPlantacion: 2010, rendEstKgHa: 18000 },
      { haCerezo: 1, anioPlantacion: 2009, rendEstKgHa: 18000 },
      { haCerezo: 7.5, anioPlantacion: 2020, rendEstKgHa: 14000 },
    ],
    haCerezoTotal: 25.5,
    anioPlantacionPrincipal: 2009,
    rendEstKgHa: 15412,
    kgEsperadoTotal: 393000,
  },
  {
    nombreHuerto: 'SANTA ROSARIO',
    blocks: [],
    haCerezoTotal: null,
    anioPlantacionPrincipal: null,
    rendEstKgHa: 18000,
    kgEsperadoTotal: null,
  },
  {
    nombreHuerto: 'SIRZO',
    blocks: [],
    haCerezoTotal: null,
    anioPlantacionPrincipal: null,
    rendEstKgHa: 18000,
    kgEsperadoTotal: null,
  },
  {
    nombreHuerto: 'TORREFUT',
    blocks: [],
    haCerezoTotal: null,
    anioPlantacionPrincipal: null,
    rendEstKgHa: 18000,
    kgEsperadoTotal: null,
  },
  {
    nombreHuerto: 'TOTIHE',
    blocks: [
      { haCerezo: 6, anioPlantacion: 2024, rendEstKgHa: 3000 },
      { haCerezo: 6, anioPlantacion: 2021, rendEstKgHa: 8000 },
    ],
    haCerezoTotal: 12,
    anioPlantacionPrincipal: 2021,
    rendEstKgHa: 5500,
    kgEsperadoTotal: 66000,
  },
  {
    nombreHuerto: 'VILLA',
    blocks: [],
    haCerezoTotal: null,
    anioPlantacionPrincipal: null,
    rendEstKgHa: 18000,
    kgEsperadoTotal: null,
  },
  {
    nombreHuerto: 'VISTA AL VALLE',
    blocks: [
      { haCerezo: 5, anioPlantacion: 2006, rendEstKgHa: 18000 },
      { haCerezo: 5, anioPlantacion: 2008, rendEstKgHa: 18000 },
      { haCerezo: 3.3, anioPlantacion: 2015, rendEstKgHa: 18000 },
    ],
    haCerezoTotal: 13.3,
    anioPlantacionPrincipal: 2006,
    rendEstKgHa: 18000,
    kgEsperadoTotal: 239400,
  },
  {
    nombreHuerto: 'EL RINCON',
    blocks: [],
    haCerezoTotal: null,
    anioPlantacionPrincipal: null,
    rendEstKgHa: 18000,
    kgEsperadoTotal: null,
  },
]

export interface ExportacionRow {
  variedad: string
  kgCampo: number
  pctExportacion: number
  pctDescarte: number
  kgExportEstimado: number
  kgDescarteEstimado: number
  kgComprometido: number
  kgLibres: number
}

export function getExportacionDescarte(): ExportacionRow[] {
  const resumen = getResumenPorVariedad()
  const comprometidoPorVariedad: Record<string, number> = {}
  for (const c of COMPROMISOS_CLIENTES) {
    comprometidoPorVariedad[c.variedad] = (comprometidoPorVariedad[c.variedad] ?? 0) + c.totalKgComprometido
  }
  return resumen.map((v) => {
    const varDef = VARIEDADES.find((vd) => vd.codigo === v.variedad || vd.nombre.toUpperCase() === v.variedad)
    const pctExp = varDef?.pctExportacion ?? 0.85
    const kgCampo = v.totalKg
    const kgExp = Math.round(kgCampo * pctExp)
    const kgDesc = kgCampo - kgExp
    const kgComp = comprometidoPorVariedad[v.variedad] ?? 0
    return {
      variedad: v.variedad,
      kgCampo,
      pctExportacion: pctExp,
      pctDescarte: 1 - pctExp,
      kgExportEstimado: kgExp,
      kgDescarteEstimado: kgDesc,
      kgComprometido: kgComp,
      kgLibres: kgExp - kgComp,
    }
  })
}

export interface EmbarqueRow {
  id: number
  nContenedor: string
  clienteDestino: string
  paisDestino: string
  naviera: string
  fechaZarpe: string
  puertoOrigen: string
  puertoDestino: string
  semCosecha: string
  variedad: string
  kgEmbarque: number
  calibreEmbarque: string
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'EN_TRANSITO' | 'ENTREGADO'
}

export const EMBARQUES: EmbarqueRow[] = [
  { id: 1, nContenedor: 'TCKU3456781', clienteDestino: 'Shinemore HK Ltd', paisDestino: 'China',    naviera: 'Cosco Shipping', fechaZarpe: '2026-12-01', puertoOrigen: 'San Antonio', puertoDestino: 'Shanghai',  semCosecha: 'Sem 47-48', variedad: 'LAPINS',  kgEmbarque: 18000, calibreEmbarque: '5J+4J', estado: 'PENDIENTE' },
  { id: 2, nContenedor: 'MSCU8812340', clienteDestino: 'Fresh Asia KK',    paisDestino: 'Japón',    naviera: 'MSC',            fechaZarpe: '2026-12-08', puertoOrigen: 'Valparaíso',  puertoDestino: 'Osaka',     semCosecha: 'Sem 48-49', variedad: 'SANTINA', kgEmbarque: 13000, calibreEmbarque: '4J+3J', estado: 'PENDIENTE' },
  { id: 3, nContenedor: 'HLXU2209871', clienteDestino: 'Metro Fruits EU',  paisDestino: 'Alemania', naviera: 'Hapag-Lloyd',    fechaZarpe: '2026-12-15', puertoOrigen: 'San Antonio', puertoDestino: 'Hamburgo',  semCosecha: 'Sem 49-50', variedad: 'KORDIA',  kgEmbarque: 11000, calibreEmbarque: '5J',    estado: 'PENDIENTE' },
]
