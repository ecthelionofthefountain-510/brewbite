import { useMemo, useState, type CSSProperties } from 'react'
import { restaurants, openHours, YSTAD_CENTER } from '../data/restaurants'
import {
  WEEKDAYS,
  WEEKDAY_LABEL,
  TAG_LABEL,
  DISH_TAG_LABEL,
  FILTER_TAGS,
  LUNCH_SORT_LABEL,
  type Weekday,
  type Tag,
  type LunchSort,
} from '../types'
import { distanceKm, formatDistance, weekdayOf } from '../lib/distance'
import { anyActiveNow } from '../lib/time'
import { reportLink } from '../lib/report'
import { useNow } from '../hooks/useNow'
import type { Coords } from '../hooks/useGeolocation'
import MapView, { type MapPoint } from './MapView'
import { Hero, ModeTabs, FavButton, type Mode } from './TopBar'

interface Fav {
  isFavorite: (id: string) => boolean
  toggle: (id: string) => void
}
interface Geo {
  coords: Coords | null
  status: string
  request: () => void
}

const LUNCH_SORTS: LunchSort[] = ['name', 'distance', 'price']

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
  const [sort, setSort] = useState<LunchSort>('name')
  const [tags, setTags] = useState<Set<Tag>>(new Set())
  const [openNow, setOpenNow] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  const activeFilterCount = tags.size + (openNow ? 1 : 0)

  function toggleTag(t: Tag) {
    setTags((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  // "Öppet just nu" gäller bara i dag — snäpp tillbaka till dagens dag när den slås på.
  function setOpenNowSafe(v: boolean) {
    setOpenNow(v)
    if (v) setDay(today)
  }

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
        if (tags.size > 0 && !r.tags.some((t) => tags.has(t))) return false
        if (openNow && !anyActiveNow(openHours[r.id], weekday, minutes)) return false
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
      if (sort === 'distance') {
        if (a.distance == null && b.distance == null) {
          /* faller igenom till namn */
        } else if (a.distance == null) return 1
        else if (b.distance == null) return -1
        else if (a.distance !== b.distance) return a.distance - b.distance
      } else if (sort === 'price') {
        const ap = a.restaurant.price
        const bp = b.restaurant.price
        if (ap == null && bp == null) {
          /* faller igenom till namn */
        } else if (ap == null) return 1
        else if (bp == null) return -1
        else if (ap !== bp) return ap - bp
      }
      return a.restaurant.name.localeCompare(b.restaurant.name, 'sv')
    })

    return list
  }, [day, query, coords, isFavorite, tags, openNow, sort, weekday, minutes])

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
      <Hero status={geo.status} onLocate={geo.request} />

      <header className="toolbar">
        <ModeTabs mode={mode} setMode={setMode} />

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
          <button
            className={`filter-btn ${activeFilterCount > 0 ? 'active' : ''}`}
            onClick={() => setFilterOpen(true)}
          >
            ⚙️ Filter
            {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
            Lista
          </button>
          <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>
            Karta
          </button>
          <span className="count">{items.length} ställen</span>
        </div>
      </header>

      {filterOpen && (
        <LunchFilterSheet
          sort={sort}
          setSort={setSort}
          tags={tags}
          toggleTag={toggleTag}
          openNow={openNow}
          setOpenNow={setOpenNowSafe}
          coords={coords}
          resultCount={items.length}
          onReset={() => {
            setSort('name')
            setTags(new Set())
            setOpenNow(false)
          }}
          onClose={() => setFilterOpen(false)}
        />
      )}

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
              <li className="empty">Inga luncher matchar. Prova en annan dag, sök eller filter.</li>
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
                  <FavButton id={r.id} isFavorite={isFavorite} toggle={toggle} />
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

                <div className="card-actions">
                  <a
                    className="menu-cta"
                    href={menuLink(r.name, r.website)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Se aktuell meny →
                  </a>
                  <a
                    className="report-btn"
                    href={reportLink(r.name, r.price != null ? `${r.price} kr` : undefined)}
                  >
                    Rapportera fel info
                  </a>
                </div>

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
          <h2 className="popup-title">
            {r.name}
            <FavButton id={r.id} isFavorite={isFavorite} toggle={toggle} inline />
          </h2>
          <p className="meta">
            {r.area}
            {r.price != null && <> · {r.price} kr</>}
            {distance != null && <> · {formatDistance(distance)}</>}
          </p>
        </div>
      </div>
      {menu.length > 0 && (
        <ul className="dishes">
          {menu.map((d, i) => (
            <li key={i}>{d.name}</li>
          ))}
        </ul>
      )}
      <div className="card-actions">
        <a className="menu-cta" href={menuLink(r.name, r.website)} target="_blank" rel="noreferrer">
          Se aktuell meny →
        </a>
        <a
          className="report-btn"
          href={reportLink(r.name, r.price != null ? `${r.price} kr` : undefined)}
        >
          Rapportera fel info
        </a>
      </div>
      <p className="hours">{r.hours}</p>
    </div>
  )
}

function LunchFilterSheet({
  sort,
  setSort,
  tags,
  toggleTag,
  openNow,
  setOpenNow,
  coords,
  resultCount,
  onReset,
  onClose,
}: {
  sort: LunchSort
  setSort: (s: LunchSort) => void
  tags: Set<Tag>
  toggleTag: (t: Tag) => void
  openNow: boolean
  setOpenNow: (v: boolean) => void
  coords: Coords | null
  resultCount: number
  onReset: () => void
  onClose: () => void
}) {
  return (
    <div className="filter-backdrop" onClick={onClose}>
      <div className="filter-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose} aria-label="Stäng">
          ✕
        </button>
        <h2 className="filter-title">Filter &amp; sortering</h2>

        <div className="filter-section">
          <h3>Sortera efter</h3>
          <div className="beer-sort">
            {LUNCH_SORTS.map((s) => (
              <button
                key={s}
                className={`chip ${sort === s ? 'active' : ''} ${
                  s === 'distance' && !coords ? 'is-disabled' : ''
                }`}
                disabled={s === 'distance' && !coords}
                onClick={() => setSort(s)}
              >
                {LUNCH_SORT_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h3>Kök &amp; typ</h3>
          <div className="beer-sort">
            {FILTER_TAGS.map((t) => (
              <button
                key={t}
                className={`chip ${tags.has(t) ? 'active' : ''}`}
                onClick={() => toggleTag(t)}
              >
                {TAG_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h3>Övrigt</h3>
          <div className="beer-sort">
            <button
              className={`chip ${openNow ? 'active' : ''}`}
              onClick={() => setOpenNow(!openNow)}
            >
              🟢 Öppet just nu
            </button>
          </div>
        </div>

        <div className="filter-actions">
          <button className="filter-reset" onClick={onReset}>
            Nollställ
          </button>
          <button className="menu-cta filter-apply" onClick={onClose}>
            Visa {resultCount} ställen
          </button>
        </div>
      </div>
    </div>
  )
}
