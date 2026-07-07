export type Mode = 'lunch' | 'beer'

interface HeroProps {
  status: string
  onLocate: () => void
}

/** Sticky hero med BrewBite-loggan. */
export function Hero({ status, onLocate }: HeroProps) {
  return (
    <div className="hero">
      <button
        className={`locate ${status === 'granted' ? 'on' : ''}`}
        onClick={onLocate}
        title="Använd min position"
      >
        {status === 'loading' ? <span className="spinner" /> : '📍'}
      </button>

      <div className="hero-inner">
        <img
          src={`${import.meta.env.BASE_URL}brewbite-header.png`}
          alt="BrewBite — Good food. Cold brews. Better places."
          className="hero-logo"
        />
      </div>

      <svg className="hero-wave" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 13 C 45 1, 85 1, 130 12 S 220 25, 280 12 S 360 2, 400 12" />
      </svg>
    </div>
  )
}

/** Lägesväxel Lunch/Öl. Ligger i den sticky verktygsraden. */
export function ModeTabs({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div className="modes" role="tablist" aria-label="Läge">
      <button className={mode === 'lunch' ? 'active' : ''} onClick={() => setMode('lunch')}>
        🍽️ Lunch
      </button>
      <button className={mode === 'beer' ? 'active' : ''} onClick={() => setMode('beer')}>
        🍺 Öl
      </button>
    </div>
  )
}

/** Favorit-stjärna. `inline` placerar den bredvid en rubrik istället för i card-headens hörn. */
export function FavButton({
  id,
  isFavorite,
  toggle,
  inline,
}: {
  id: string
  isFavorite: (id: string) => boolean
  toggle: (id: string) => void
  inline?: boolean
}) {
  const on = isFavorite(id)
  return (
    <button
      className={`fav ${inline ? 'fav-inline' : ''} ${on ? 'on' : ''}`}
      onClick={() => toggle(id)}
      aria-label="Spara som favorit"
    >
      {on ? '★' : '☆'}
    </button>
  )
}
