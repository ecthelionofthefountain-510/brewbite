import type { Weekday } from '../types'

/** Minuter sedan midnatt för ett Date (lokal tid). */
export function nowMinutes(d = new Date()): number {
  return d.getHours() * 60 + d.getMinutes()
}

/** "HH:MM" → minuter sedan midnatt. */
export function hmToMin(s: string): number {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + (m || 0)
}

export interface TimeWindow {
  days: Weekday[]
  from: string
  to: string
}

/** Är detta tidsfönster aktivt just nu (given veckodag + minut)? */
export function activeNow(w: TimeWindow, weekday: Weekday, now: number): boolean {
  return w.days.includes(weekday) && now >= hmToMin(w.from) && now < hmToMin(w.to)
}

/** Är något av fönstren aktivt just nu? */
export function anyActiveNow(
  windows: TimeWindow[] | undefined,
  weekday: Weekday,
  now: number,
): boolean {
  return !!windows && windows.some((w) => activeNow(w, weekday, now))
}
