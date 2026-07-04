import { useMemo, useState, type CSSProperties } from 'react'
import { beerspots, happyHours } from '../data/beerspots'
import {
  CONTAINER_LABEL,
  BEER_SORT_LABEL,
  krPerCl,
  type BeerSort,
  type BeerSpot,
} from '../types'
import { distanceKm, formatDistance } from '../lib/distance'
import { activeNow } from '../lib/time'
import { useNow } from '../hooks/useNow'
import { YSTAD_CENTER } from '../data/restaurants'
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

const SORTS: BeerSort[] = ['cl', 'price', 'distance']

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
  const [view, setView] = useState<'list' | 'map'>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Billigaste kr/cl totalt — får trofén oavsett sortering.
  const cheapestId = useMemo(() => {
    let best: BeerSpot | null = null
    for (const s of beerspots) if (!best || krPerCl(s) < krPerCl(best)) best = s
    return best?.id ?? null
  }, [])

  const items = useMemo(() => {
    let list = beerspots
      .map((s) => ({
        spot: s,
        cl: krPerCl(s),
        distance: coords ? distanceKm(coords, s) : null,
      }))
      .filter(({ spot }) => (happyOnly ? !!spot.happyHourInfo : true))

    list.sort((a, b) => {
      if (sort === 'price') return a.spot.price - b.spot.price
      if (sort === 'distance' && a.distance != null && b.distance != null) {
        return a.distance - b.distance
      }
      return a.cl - b.cl // 'cl' (default)
    })
    return list
  }, [sort, happyOnly, coords])

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
      <header className="header">
        <TopBar mode={mode} setMode={setMode} status={geo.status} onLocate={geo.request} />

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
          <button
            className={`chip ${happyOnly ? 'active' : ''}`}
            onClick={() => setHappyOnly((v) => !v)}
          >
            🕒 Happy hour
          </button>
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
              <li className="empty">Inga ställen matchar. Stäng av happy hour-filtret?</li>
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
                    {s.price} kr <span>stor stark</span>
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
        ⚠️ Ölpriserna är exempeldata och måste verifieras — priser ändras ofta.
        Nyckeltalet kr/cl gör olika storlekar jämförbara. Drick måttligt. 🍺
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
          {s.price} kr <span>stor stark</span>
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
