export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function rutaKm(puntos: { lat: number; lon: number }[]): number {
  let total = 0
  for (let i = 0; i < puntos.length - 1; i++) {
    total += haversineKm(puntos[i].lat, puntos[i].lon, puntos[i + 1].lat, puntos[i + 1].lon)
  }
  return total * 1.35 // factor carretera
}
