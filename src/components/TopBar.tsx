export type Mode = 'lunch' | 'beer'

interface Props {
  mode: Mode
  setMode: (m: Mode) => void
  status: string
  onLocate: () => void
}

const emblemProps = {
  viewBox: '0 0 120 78',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 3.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

// Strålar ovanför emblemet (delas av båda motiven).
const rays = <path d="M60 2v9 M39 8l3.5 8 M81 8l-3.5 8 M24 19l6.5 5.5 M96 19l-6.5 5.5" />

function LunchEmblem() {
  return (
    <svg {...emblemProps}>
      {rays}
      <circle cx="60" cy="49" r="17" />
      <circle cx="60" cy="49" r="8.5" />
      <path d="M33 33v9a5 5 0 0 0 5 5 M30 33v7 M36 33v7 M38 47v20" />
      <path d="M88 33c-5.5 3-7.5 13-4.5 25 M88 33v34" />
    </svg>
  )
}

function BeerEmblem() {
  return (
    <svg {...emblemProps}>
      {rays}
      <path d="M42 41c0-6 6-8 9-5 1-6 11-6 12 1 6-2 10 2 8 8" />
      <path d="M44 41h27v26a4 4 0 0 1-4 4H48a4 4 0 0 1-4-4z" />
      <path d="M71 47h7a7 7 0 0 1 0 15h-7" />
    </svg>
  )
}

export default function TopBar({ mode, setMode, status, onLocate }: Props) {
  return (
    <>
      <div className="hero">
        <button
          className={`locate ${status === 'granted' ? 'on' : ''}`}
          onClick={onLocate}
          title="Använd min position"
        >
          {status === 'loading' ? <span className="spinner" /> : '📍'}
        </button>

        <div className="hero-inner">
          <span className="hero-emblem" key={mode} aria-hidden="true">
            {mode === 'lunch' ? <LunchEmblem /> : <BeerEmblem />}
          </span>
          <h1 className="hero-title">
            <span className="title">Krögläget</span>
          </h1>
        </div>

        <svg className="hero-wave" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 13 C 45 1, 85 1, 130 12 S 220 25, 280 12 S 360 2, 400 12" />
        </svg>
      </div>

      <div className="modes" role="tablist" aria-label="Läge">
        <button
          className={mode === 'lunch' ? 'active' : ''}
          onClick={() => setMode('lunch')}
        >
          🍽️ Lunch
        </button>
        <button
          className={mode === 'beer' ? 'active' : ''}
          onClick={() => setMode('beer')}
        >
          🍺 Öl
        </button>
      </div>
    </>
  )
}
