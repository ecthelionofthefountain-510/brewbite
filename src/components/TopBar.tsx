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
          src="/brewbite-header.png"
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
