import { useMemo, useState, type CSSProperties } from 'react'
import { restaurants, YSTAD_CENTER } from './data/restaurants'
import {
  WEEKDAYS,
  WEEKDAY_LABEL,
  TAG_LABEL,
  DISH_TAG_LABEL,
  FILTER_TAGS,
  type Tag,
  type Weekday,
} from './types'
import { distanceKm, formatDistance, weekdayOf } from './lib/distance'
import { useFavorites } from './hooks/useFavorites'
import { useGeolocation } from './hooks/useGeolocation'
import MapView, { type MapPoint } from './components/MapView'

const PRICE_MAX = 250

/** Bästa länken för att se aktuell lunch — egen sida/FB, annars en Google-sökning. */
function menuLink(name: string, website?: string): string {
  if (website) return website
  return `https://www.google.com/search?q=${encodeURIComponent(`${name} Ystad lunch`)}`
}

export default function App() {
  const today = weekdayOf(new Date())
  const [day, setDay] = useState<Weekday>(today)
  const [query, setQuery] = useState('')
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX)
  const [tags, setTags] = useState<Set<Tag>>(new Set())
  const [onlyOpen, setOnlyOpen] = useState(true)
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [sortByDistance, setSortByDistance] = useState(false)
  const [view, setView] = useState<'list' | 'map'>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { isFavorite, toggle } = useFavorites()
  const { coords, status, request } = useGeolocation()

  function toggleTag(t: Tag) {
    setTags((prev) => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })
  }

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    const selectedTags = [...tags]

    let list = restaurants.map((r) => {
      const todaysMenu = r.menu?.[day] ?? []
      const distance = coords ? distanceKm(coords, r) : null
      return { restaurant: r, todaysMenu, distance, openToday: r.lunchDays.includes(day) }
    })

    list = list.filter(({ restaurant: r, todaysMenu, openToday }) => {
      if (onlyOpen && !openToday) return false
      if (onlyFavorites && !isFavorite(r.id)) return false
      if (r.price != null && r.price > maxPrice) return false
      // taggfilter: matcha om stället har NÅGON av de valda taggarna
      if (selectedTags.length > 0 && !selectedTags.some((t) => r.tags.includes(t))) {
        return false
      }
      if (q) {
        const haystack = [
          r.name,
          r.area,
          ...r.tags.map((t) => TAG_LABEL[t]),
          ...todaysMenu.map((d) => d.name),
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    list.sort((a, b) => {
      if (sortByDistance && a.distance != null && b.distance != null) {
        return a.distance - b.distance
      }
      if (a.openToday !== b.openToday) return a.openToday ? -1 : 1
      const af = isFavorite(a.restaurant.id)
      const bf = isFavorite(b.restaurant.id)
      if (af !== bf) return af ? -1 : 1
      return a.restaurant.name.localeCompare(b.restaurant.name, 'sv')
    })

    return list
  }, [day, query, maxPrice, tags, onlyOpen, onlyFavorites, sortByDistance, coords, isFavorite])

  const mapPoints: MapPoint[] = useMemo(
    () =>
      items.map(({ restaurant: r, openToday }) => ({
        id: r.id,
        name: r.name,
        lat: r.lat,
        lng: r.lng,
        openToday,
        favorite: isFavorite(r.id),
      })),
    [items, isFavorite],
  )

  const activeFilters =
    tags.size + (onlyFavorites ? 1 : 0) + (maxPrice < PRICE_MAX ? 1 : 0)

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div className="brand">
            <h1>
              <span className="logo">🍴</span>
              <span className="title">Lunchläget</span>
            </h1>
            <p className="tagline">i Ystad med omnejd</p>
          </div>
          <button
            className={`locate ${status === 'granted' ? 'on' : ''}`}
            onClick={request}
            title="Använd min position"
          >
            {status === 'loading' ? <span className="spinner" /> : '📍'}
          </button>
        </div>

        <div className="days" role="tablist" aria-label="Veckodag">
          {WEEKDAYS.map((d) => (
            <button
              key={d}
              className={`day ${d === day ? 'active' : ''} ${d === today ? 'today' : ''}`}
              onClick={() => setDay(d)}
            >
              {WEEKDAY_LABEL[d].slice(0, 3)}
              {d === today && <span className="dot" />}
            </button>
          ))}
        </div>

        <div className="search">
          <input
            type="search"
            placeholder="Sök rätt, restaurang, kök eller område…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="chips">
          {FILTER_TAGS.map((t) => (
            <button
              key={t}
              className={`chip ${tags.has(t) ? 'active' : ''}`}
              onClick={() => toggleTag(t)}
            >
              {TAG_LABEL[t]}
            </button>
          ))}
          <button
            className={`chip ${onlyFavorites ? 'active' : ''}`}
            onClick={() => setOnlyFavorites((v) => !v)}
          >
            ★ Favoriter
          </button>
        </div>

        <div className="controls">
          <label className="price">
            Max pris: <strong>{maxPrice === PRICE_MAX ? 'alla' : `${maxPrice} kr`}</strong>
            <input
              type="range"
              min={100}
              max={PRICE_MAX}
              step={5}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            />
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={(e) => setOnlyOpen(e.target.checked)}
            />
            Endast öppet
          </label>
          <label className={`toggle ${!coords ? 'disabled' : ''}`}>
            <input
              type="checkbox"
              checked={sortByDistance}
              disabled={!coords}
              onChange={(e) => setSortByDistance(e.target.checked)}
            />
            Närmast först
          </label>
        </div>

        <div className="viewtabs">
          <button
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
          >
            Lista
          </button>
          <button
            className={view === 'map' ? 'active' : ''}
            onClick={() => setView('map')}
          >
            Karta
          </button>
          <span className="count">
            {items.length} ställen{activeFilters > 0 ? ` · ${activeFilters} filter` : ''}
          </span>
        </div>
      </header>

      <main className="main">
        {view === 'map' ? (
          <div className="mapwrap">
            <MapView
              points={mapPoints}
              center={coords ?? YSTAD_CENTER}
              userCoords={coords}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            {selectedId && (
              <SelectedCard
                id={selectedId}
                day={day}
                coords={coords}
                isFavorite={isFavorite}
                toggle={toggle}
                onClose={() => setSelectedId(null)}
              />
            )}
          </div>
        ) : (
          <ul className="list">
            {items.length === 0 && (
              <li className="empty">
                Inga luncher matchar. Prova en annan dag eller rensa filter.
              </li>
            )}
            {items.map(({ restaurant: r, todaysMenu, distance, openToday }, i) => (
              <li
                key={`${day}-${r.id}`}
                className={`card ${openToday ? '' : 'closed'}`}
                style={{ '--i': i } as CSSProperties}
              >
                <div className="card-head">
                  <div>
                    <h2>{r.name}</h2>
                    <p className="meta">
                      {r.area}
                      {r.price != null && <> · {r.price} kr</>}
                      {distance != null && <> · {formatDistance(distance)}</>}
                    </p>
                  </div>
                  <button
                    className={`fav ${isFavorite(r.id) ? 'on' : ''}`}
                    onClick={() => toggle(r.id)}
                    aria-label="Spara som favorit"
                  >
                    {isFavorite(r.id) ? '★' : '☆'}
                  </button>
                </div>

                {r.tags.length > 0 && (
                  <div className="rtags">
                    {r.tags.map((t) => (
                      <span key={t} className="rtag">
                        {TAG_LABEL[t]}
                      </span>
                    ))}
                  </div>
                )}

                {openToday ? (
                  <>
                    {todaysMenu.length > 0 && (
                      <>
                        {r.menuIsExample && (
                          <p className="examplenote">Exempelmeny – ej verifierad</p>
                        )}
                        <ul className="dishes">
                          {todaysMenu.map((d, i) => (
                            <li key={i}>
                              <span>{d.name}</span>
                              {d.tags && d.tags.length > 0 && (
                                <span className="tags">
                                  {d.tags.map((t) => (
                                    <span key={t} className={`tag tag-${t}`}>
                                      {DISH_TAG_LABEL[t]}
                                    </span>
                                  ))}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    <a
                      className="menu-cta"
                      href={menuLink(r.name, r.website)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Se aktuell meny →
                    </a>
                  </>
                ) : (
                  <p className="noserve">Ingen lunch {WEEKDAY_LABEL[day].toLowerCase()}.</p>
                )}

                {r.note && <p className="note">{r.note}</p>}
                <p className="hours">{r.hours}</p>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="disclaimer">
        ⚠️ Öppettider och menyer bygger på publik info och kan vara inaktuella —
        dubbelkolla gärna med restaurangen. Menyer märkta "exempel" är inte
        verifierade.
      </footer>
    </div>
  )
}

function SelectedCard({
  id,
  day,
  coords,
  isFavorite,
  toggle,
  onClose,
}: {
  id: string
  day: Weekday
  coords: { lat: number; lng: number } | null
  isFavorite: (id: string) => boolean
  toggle: (id: string) => void
  onClose: () => void
}) {
  const r = restaurants.find((x) => x.id === id)
  if (!r) return null
  const menu = r.menu?.[day] ?? []
  const openToday = r.lunchDays.includes(day)
  const distance = coords ? distanceKm(coords, r) : null
  return (
    <div className="popup">
      <button className="popup-close" onClick={onClose} aria-label="Stäng">
        ✕
      </button>
      <div className="card-head">
        <div>
          <h2>{r.name}</h2>
          <p className="meta">
            {r.area}
            {r.price != null && <> · {r.price} kr</>}
            {distance != null && <> · {formatDistance(distance)}</>}
          </p>
        </div>
        <button
          className={`fav ${isFavorite(r.id) ? 'on' : ''}`}
          onClick={() => toggle(r.id)}
          aria-label="Spara som favorit"
        >
          {isFavorite(r.id) ? '★' : '☆'}
        </button>
      </div>
      {openToday ? (
        <>
          {menu.length > 0 && (
            <ul className="dishes">
              {menu.map((d, i) => (
                <li key={i}>{d.name}</li>
              ))}
            </ul>
          )}
          <a
            className="menu-cta"
            href={menuLink(r.name, r.website)}
            target="_blank"
            rel="noreferrer"
          >
            Se aktuell meny →
          </a>
        </>
      ) : (
        <p className="noserve">Ingen lunch denna dag.</p>
      )}
      <p className="hours">{r.hours}</p>
    </div>
  )
}
