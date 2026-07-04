import { useMemo, useState, type CSSProperties } from 'react'
import { restaurants, openHours, YSTAD_CENTER } from '../data/restaurants'
import {
  WEEKDAYS,
  WEEKDAY_LABEL,
  TAG_LABEL,
  DISH_TAG_LABEL,
  type Weekday,
} from '../types'
import { distanceKm, formatDistance, weekdayOf } from '../lib/distance'
import { anyActiveNow } from '../lib/time'
import { useNow } from '../hooks/useNow'
import type { Coords } from '../hooks/useGeolocation'
import MapView, { type MapPoint } from './MapView'
import TopBar, { type Mode } from './TopBar'

interface Fav {
  isFavorite: (id: string) => boolean
  toggle: (id: string) => void
}
interface Geo {
  coords: Coords | null
  status: string
  request: () => void
}

/** Bästa länken för att se aktuell lunch — egen sida/FB, annars en Google-sökning. */
function menuLink(name: string, website?: string): string {
  if (website) return website
  return `https://www.google.com/search?q=${encodeURIComponent(`${name} Ystad lunch`)}`
}

export default function LunchView({
  mode,
  setMode,
  fav,
  geo,
}: {
  mode: Mode
  setMode: (m: Mode) => void
  fav: Fav
  geo: Geo
}) {
  const { isFavorite, toggle } = fav
  const { coords } = geo
  const { weekday, minutes } = useNow()
  const today = weekdayOf(new Date())
  const [day, setDay] = useState<Weekday>(today)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'list' | 'map'>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()

    let list = restaurants
      .map((r) => {
        const todaysMenu = r.menu?.[day] ?? []
        const distance = coords ? distanceKm(coords, r) : null
        return { restaurant: r, todaysMenu, distance, openToday: r.lunchDays.includes(day) }
      })
      .filter(({ restaurant: r, todaysMenu, openToday }) => {
        if (!openToday) return false
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
      const af = isFavorite(a.restaurant.id)
      const bf = isFavorite(b.restaurant.id)
      if (af !== bf) return af ? -1 : 1
      return a.restaurant.name.localeCompare(b.restaurant.name, 'sv')
    })

    return list
  }, [day, query, coords, isFavorite])

  const mapPoints: MapPoint[] = useMemo(
    () =>
      items.map(({ restaurant: r }) => ({
        id: r.id,
        name: r.name,
        lat: r.lat,
        lng: r.lng,
        openToday: true,
        favorite: isFavorite(r.id),
      })),
    [items, isFavorite],
  )

  return (
    <>
      <header className="header">
        <TopBar mode={mode} setMode={setMode} status={geo.status} onLocate={geo.request} />

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

        <div className="viewtabs">
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
            Lista
          </button>
          <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>
            Karta
          </button>
          <span className="count">{items.length} ställen</span>
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
              <LunchPopup
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
              <li className="empty">Inga luncher matchar. Prova en annan dag eller sök.</li>
            )}
            {items.map(({ restaurant: r, todaysMenu, distance }, i) => (
              <li key={`${day}-${r.id}`} className="card" style={{ '--i': i } as CSSProperties}>
                <div className="card-head">
                  <div>
                    <h2>{r.name}</h2>
                    <p className="meta">
                      {r.area}
                      {r.price != null && <> · {r.price} kr</>}
                      {distance != null && <> · {formatDistance(distance)}</>}
                    </p>
                    {day === today && openHours[r.id] && (
                      <span
                        className={`statuspill ${
                          anyActiveNow(openHours[r.id], weekday, minutes) ? 'open' : 'closed'
                        }`}
                      >
                        <span className="pip" />
                        {anyActiveNow(openHours[r.id], weekday, minutes)
                          ? 'Öppet nu'
                          : 'Stängt just nu'}
                      </span>
                    )}
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

                {todaysMenu.length > 0 && (
                  <>
                    {r.menuIsExample && (
                      <p className="examplenote">Exempelmeny – ej verifierad</p>
                    )}
                    <ul className="dishes">
                      {todaysMenu.map((d, j) => (
                        <li key={j}>
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

                {r.note && <p className="note">{r.note}</p>}
                <p className="hours">{r.hours}</p>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="disclaimer">
        ⚠️ Öppettider och menyer bygger på publik info och kan vara inaktuella —
        dubbelkolla gärna med restaurangen. Menyer märkta "exempel" är inte verifierade.
      </footer>
    </>
  )
}

function LunchPopup({
  id,
  day,
  coords,
  isFavorite,
  toggle,
  onClose,
}: {
  id: string
  day: Weekday
  coords: Coords | null
  isFavorite: (id: string) => boolean
  toggle: (id: string) => void
  onClose: () => void
}) {
  const r = restaurants.find((x) => x.id === id)
  if (!r) return null
  const menu = r.menu?.[day] ?? []
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
      {menu.length > 0 && (
        <ul className="dishes">
          {menu.map((d, i) => (
            <li key={i}>{d.name}</li>
          ))}
        </ul>
      )}
      <a className="menu-cta" href={menuLink(r.name, r.website)} target="_blank" rel="noreferrer">
        Se aktuell meny →
      </a>
      <p className="hours">{r.hours}</p>
    </div>
  )
}
