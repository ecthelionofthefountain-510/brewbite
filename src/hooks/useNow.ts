import { useEffect, useState } from 'react'
import { weekdayOf } from '../lib/distance'
import { nowMinutes } from '../lib/time'
import type { Weekday } from '../types'

interface Now {
  weekday: Weekday
  minutes: number
}

function read(): Now {
  const d = new Date()
  return { weekday: weekdayOf(d), minutes: nowMinutes(d) }
}

/** Aktuell veckodag + minut, uppdateras varje minut. */
export function useNow(): Now {
  const [now, setNow] = useState<Now>(read)
  useEffect(() => {
    const id = setInterval(() => setNow(read()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}
