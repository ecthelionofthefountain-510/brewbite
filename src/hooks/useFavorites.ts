import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'lunch-ystad:favorites'

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function useFavorites() {
  const [ids, setIds] = useState<string[]>(read)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      // ignore (privatläge etc.)
    }
  }, [ids])

  const toggle = useCallback((id: string) => {
    setIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids])

  return { favorites: ids, toggle, isFavorite }
}
