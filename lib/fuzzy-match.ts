// Compara nombres de empresas/predios tolerando errores de tipeo, mayúsculas,
// tildes y sufijos societarios (SPA, LTDA, etc.) al emparejar una planilla
// externa contra los registros ya existentes en la base de datos.

export function normalizeName(s: string) {
  return s
    .toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\b(LTDA|SPA|SA|LIMITADA|SOCIEDAD|AGRICOLA|GANADERA|FORESTAL|SOC|INVERSIONES)\b/g, '')
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a), nb = normalizeName(b)
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.9
  const wa = na.split(' ').filter(w => w.length > 2)
  const wb = new Set(nb.split(' ').filter(w => w.length > 2))
  const common = wa.filter(w => wb.has(w)).length
  return common / Math.max(wa.length, wb.size, 1)
}
