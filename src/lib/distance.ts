function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Avstånd mellan två koordinater i km (haversine). */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Snygg formattering: "350 m" eller "2,4 km". */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1).replace('.', ',')} km`
}

/** Veckodagskod för ett Date-objekt (mån–sön). */
export function weekdayOf(date: Date): import('../types').Weekday {
  const map = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
  return map[date.getDay()]
}
