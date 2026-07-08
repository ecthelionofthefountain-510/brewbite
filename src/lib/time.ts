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

const WEEK: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
function prevWeekday(d: Weekday): Weekday {
  return WEEK[(WEEK.indexOf(d) + 6) % 7]
}

/**
 * Är detta tidsfönster aktivt just nu (given veckodag + minut)?
 * Hanterar fönster som sträcker sig över midnatt (from > to), t.ex. 23:00–03:00:
 * då räknas både kvällsdelen på startdagen och morgondelen dagen efter.
 */
export function activeNow(w: TimeWindow, weekday: Weekday, now: number): boolean {
  const from = hmToMin(w.from)
  const to = hmToMin(w.to)
  if (from < to) {
    return w.days.includes(weekday) && now >= from && now < to
  }
  const evening = w.days.includes(weekday) && now >= from
  const morning = w.days.includes(prevWeekday(weekday)) && now < to
  return evening || morning
}

/** Är något av fönstren aktivt just nu? */
export function anyActiveNow(
  windows: TimeWindow[] | undefined,
  weekday: Weekday,
  now: number,
): boolean {
  return !!windows && windows.some((w) => activeNow(w, weekday, now))
}
