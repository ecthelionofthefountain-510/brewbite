import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface MapPoint {
  id: string
  name: string
  lat: number
  lng: number
  openToday: boolean
  favorite: boolean
}

interface Props {
  points: MapPoint[]
  center: { lat: number; lng: number }
  userCoords: { lat: number; lng: number } | null
  selectedId: string | null
  onSelect: (id: string) => void
}

function markerHtml(p: MapPoint, selected: boolean): string {
  const bg = !p.openToday ? '#94a3b8' : p.favorite ? '#f59e0b' : '#0f766e'
  const scale = selected ? 1.25 : 1
  return `
    <div style="
      transform: translate(-50%, -100%) scale(${scale});
      transform-origin: bottom center;
      width: 30px; height: 38px;
      display:flex; align-items:flex-start; justify-content:center;
      filter: drop-shadow(0 2px 3px rgba(0,0,0,.35));
    ">
      <svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 13 21.6 13.6 22.1a2 2 0 0 0 2.8 0C17 36.6 30 25.5 30 15 30 6.7 23.3 0 15 0Z" fill="${bg}"/>
        <circle cx="15" cy="14.5" r="6" fill="#fff"/>
        ${p.favorite ? `<text x="15" y="19" font-size="9" text-anchor="middle" fill="${bg}">★</text>` : ''}
      </svg>
    </div>`
}

export default function MapView({
  points,
  center,
  userCoords,
  selectedId,
  onSelect,
}: Props) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const userMarkerRef = useRef<L.Marker | null>(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  // Initiera kartan en gång.
  useEffect(() => {
    if (mapRef.current || !elRef.current) return
    const map = L.map(elRef.current, {
      center: [center.lat, center.lng],
      zoom: 13,
      zoomControl: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  }, [center.lat, center.lng])

  // Synka restaurangmarkörer.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const existing = markersRef.current

    // Ta bort markörer som inte längre finns.
    for (const [id, m] of existing) {
      if (!points.some((p) => p.id === id)) {
        m.remove()
        existing.delete(id)
      }
    }

    for (const p of points) {
      const icon = L.divIcon({
        html: markerHtml(p, p.id === selectedId),
        className: '',
        iconSize: [30, 38],
      })
      const current = existing.get(p.id)
      if (current) {
        current.setLatLng([p.lat, p.lng])
        current.setIcon(icon)
      } else {
        const m = L.marker([p.lat, p.lng], { icon, title: p.name })
          .addTo(map)
          .on('click', () => onSelectRef.current(p.id))
        existing.set(p.id, m)
      }
    }
  }, [points, selectedId])

  // Användarens position.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!userCoords) {
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
      return
    }
    const icon = L.divIcon({
      html: `<div style="
        transform: translate(-50%,-50%);
        width:18px;height:18px;border-radius:50%;
        background:#2563eb;border:3px solid #fff;
        box-shadow:0 0 0 3px rgba(37,99,235,.3);"></div>`,
      className: '',
      iconSize: [18, 18],
    })
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng])
    } else {
      userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], {
        icon,
        interactive: false,
      }).addTo(map)
    }
  }, [userCoords])

  // Panorera till vald restaurang.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const p = points.find((x) => x.id === selectedId)
    if (p) map.panTo([p.lat, p.lng], { animate: true })
  }, [selectedId, points])

  return <div ref={elRef} className="map" />
}
