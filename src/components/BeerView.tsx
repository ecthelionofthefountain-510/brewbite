import { useMemo, useState, type CSSProperties } from 'react'
import { beerspots, happyHours } from '../data/beerspots'
import {
  CONTAINER_LABEL,
  BEER_SORT_LABEL,
  krPerCl,
  type BeerSort,
  type BeerSpot,
  type Container,
} from '../types'
import { distanceKm, formatDistance } from '../lib/distance'
import { activeNow } from '../lib/time'
import { useNow } from '../hooks/useNow'
import { YSTAD_CENTER } from '../data/restaurants'
import type { Coords } from '../hooks/useGeolocation'
import MapView, { type MapPoint } from './MapView'
import { Hero, ModeTabs, type Mode } from './TopBar'

interface Fav {
  isFavorite: (id: string) => boolean
  toggle: (id: string) => void
}
interface Geo {
  coords: Coords | null
  status: string
  request: () => void
}

const SORTS: BeerSort[] = ['cl', 'price', 'distance']
const CONTAINERS: Container[] = ['fat', 'flaska', 'burk']

function fmtCl(n: number): string {
  return `${n.toFixed(2).replace('.', ',')} kr/cl`
}

function directionsLink(s: BeerSpot): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`
}

export default function BeerView({
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
  const [sort, setSort] = useState<BeerSort>('cl')
  const [happyOnly, setHappyOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [containers, setContainers] = useState<Set<Container>>(new Set())
  const [view, setView] = useState<'list' | 'map'>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  const activeFilterCount = containers.size + (happyOnly ? 1 : 0)

  function toggleContainer(c: Container) {
    setContainers((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })
  }

  // Billigaste kr/cl totalt — får trofén oavsett sortering.
  const cheapestId = useMemo(() => {
    let best: BeerSpot | null = null
    for (const s of beerspots) if (!best || krPerCl(s) < krPerCl(best)) best = s
    return best?.id ?? null
  }, [])

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()

    let list = beerspots
      .map((s) => ({
        spot: s,
        cl: krPerCl(s),
        distance: coords ? distanceKm(coords, s) : null,
      }))
      .filter(({ spot }) => (happyOnly ? !!spot.happyHourInfo : true))
      .filter(({ spot }) => (containers.size === 0 ? true : containers.has(spot.container)))
      .filter(({ spot }) => {
        if (!q) return true
        const haystack = [spot.name, spot.area, spot.address, spot.brand]
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })

    list.sort((a, b) => {
      if (sort === 'price') return a.spot.price - b.spot.price
      if (sort === 'distance' && a.distance != null && b.distance != null) {
        return a.distance - b.distance
      }
      return a.cl - b.cl // 'cl' (default)
    })
    return list
  }, [sort, happyOnly, containers, query, coords])

  const mapPoints: MapPoint[] = useMemo(
    () =>
      items.map(({ spot: s }) => ({
        id: s.id,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        openToday: true,
        favorite: isFavorite(s.id),
        best: s.id === cheapestId,
      })),
    [items, isFavorite, cheapestId],
  )

  return (
    <>
      <Hero mode={mode} status={geo.status} onLocate={geo.request} />

      <header className="toolbar">
        <ModeTabs mode={mode} setMode={setMode} />

        <div className="search">
          <input
            type="search"
            placeholder="Sök krog, adress eller märke…"
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
        <FilterSheet
          sort={sort}
          setSort={setSort}
          happyOnly={happyOnly}
          setHappyOnly={setHappyOnly}
          containers={containers}
          toggleContainer={toggleContainer}
          coords={coords}
          resultCount={items.length}
          onReset={() => {
            setSort('cl')
            setHappyOnly(false)
            setContainers(new Set())
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
              <BeerPopup
                id={selectedId}
                coords={coords}
                cheapestId={cheapestId}
                isFavorite={isFavorite}
                toggle={toggle}
                onClose={() => setSelectedId(null)}
              />
            )}
          </div>
        ) : (
          <ul className="list">
            {items.length === 0 && (
              <li className="empty">Inga ställen matchar. Prova ett annat sök eller filter.</li>
            )}
            {items.map(({ spot: s, cl, distance }, i) => {
              const hh = happyHours[s.id]
              const hhNow = hh ? activeNow(hh, weekday, minutes) : false
              return (
              <li
                key={s.id}
                className={`card beercard ${hhNow ? 'hhnow' : ''}`}
                style={{ '--i': i } as CSSProperties}
              >
                {hhNow && <div className="hhnow-badge">🍺 Happy hour just nu!</div>}
                <div className="card-head">
                  <div>
                    <h2>
                      <span className="beer-rank">{i + 1}</span> {s.name}
                    </h2>
                    <p className="meta">
                      {s.area}
                      {distance != null && <> · {formatDistance(distance)}</>}
                    </p>
                    <p className="beer-address">📍 {s.address}</p>
                  </div>
                  <button
                    className={`fav ${isFavorite(s.id) ? 'on' : ''}`}
                    onClick={() => toggle(s.id)}
                    aria-label="Spara som favorit"
                  >
                    {isFavorite(s.id) ? '★' : '☆'}
                  </button>
                </div>

                <div className="beer-price-row">
                  <div className="beer-price">
                    {s.price} kr <span>billigast</span>
                  </div>
                  <div className={`krcl ${s.id === cheapestId ? 'best' : ''}`}>
                    {s.id === cheapestId && '🏆 '}
                    {fmtCl(cl)}
                  </div>
                </div>

                <p className="beer-spec">
                  {CONTAINER_LABEL[s.container]} {s.volumeCl} cl · {s.brand}
                </p>

                {s.happyHourInfo && (
                  <div className="hh">
                    🕒 Happy hour
                    {s.happyHourPrice != null && <> · {s.happyHourPrice} kr</>} · {s.happyHourInfo}
                  </div>
                )}

                {s.priceIsExample && <p className="examplenote">Exempelpris – ej verifierat</p>}
                {s.note && <p className="note">{s.note}</p>}

                <a className="menu-cta" href={directionsLink(s)} target="_blank" rel="noreferrer">
                  Vägbeskrivning →
                </a>
              </li>
              )
            })}
          </ul>
        )}
      </main>

      <footer className="disclaimer">
        💡 Priser från Ystads Allehanda (juni 2026), avser ställets billigaste öl.
        kr/cl gör olika storlekar jämförbara. Priser ändras – dubbelkolla vid
        behov. Drick måttligt. 🍺
      </footer>
    </>
  )
}

function BeerPopup({
  id,
  coords,
  cheapestId,
  isFavorite,
  toggle,
  onClose,
}: {
  id: string
  coords: Coords | null
  cheapestId: string | null
  isFavorite: (id: string) => boolean
  toggle: (id: string) => void
  onClose: () => void
}) {
  const s = beerspots.find((x) => x.id === id)
  if (!s) return null
  const distance = coords ? distanceKm(coords, s) : null
  return (
    <div className="popup">
      <button className="popup-close" onClick={onClose} aria-label="Stäng">
        ✕
      </button>
      <div className="card-head">
        <div>
          <h2>{s.name}</h2>
          <p className="meta">
            {s.area}
            {distance != null && <> · {formatDistance(distance)}</>}
          </p>
          <p className="beer-address">📍 {s.address}</p>
        </div>
        <button
          className={`fav ${isFavorite(s.id) ? 'on' : ''}`}
          onClick={() => toggle(s.id)}
          aria-label="Spara som favorit"
        >
          {isFavorite(s.id) ? '★' : '☆'}
        </button>
      </div>
      <div className="beer-price-row">
        <div className="beer-price">
          {s.price} kr <span>billigast</span>
        </div>
        <div className={`krcl ${s.id === cheapestId ? 'best' : ''}`}>
          {s.id === cheapestId && '🏆 '}
          {fmtCl(krPerCl(s))}
        </div>
      </div>
      <p className="beer-spec">
        {CONTAINER_LABEL[s.container]} {s.volumeCl} cl · {s.brand}
      </p>
      <a className="menu-cta" href={directionsLink(s)} target="_blank" rel="noreferrer">
        Vägbeskrivning →
      </a>
    </div>
  )
}

function FilterSheet({
  sort,
  setSort,
  happyOnly,
  setHappyOnly,
  containers,
  toggleContainer,
  coords,
  resultCount,
  onReset,
  onClose,
}: {
  sort: BeerSort
  setSort: (s: BeerSort) => void
  happyOnly: boolean
  setHappyOnly: (v: boolean) => void
  containers: Set<Container>
  toggleContainer: (c: Container) => void
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
            {SORTS.map((s) => (
              <button
                key={s}
                className={`chip ${sort === s ? 'active' : ''} ${
                  s === 'distance' && !coords ? 'is-disabled' : ''
                }`}
                disabled={s === 'distance' && !coords}
                onClick={() => setSort(s)}
              >
                {BEER_SORT_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h3>Typ</h3>
          <div className="beer-sort">
            {CONTAINERS.map((c) => (
              <button
                key={c}
                className={`chip ${containers.has(c) ? 'active' : ''}`}
                onClick={() => toggleContainer(c)}
              >
                {CONTAINER_LABEL[c]}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h3>Övrigt</h3>
          <div className="beer-sort">
            <button
              className={`chip ${happyOnly ? 'active' : ''}`}
              onClick={() => setHappyOnly(!happyOnly)}
            >
              🕒 Happy hour just nu
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
