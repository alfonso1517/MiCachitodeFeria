import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polygon, Marker, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-rotate'
import L from 'leaflet'
import CasetasGeoJSON, { POLIGONO } from './CasetasGeoJSON'

// Centro geográfico de las casetas
const CENTRO = [37.3697, -5.9999]

const estiloPoligono = {
  color:       '#D4A55A',
  weight:      1,
  opacity:     0.5,
  fillOpacity: 0,
}

const POIS = [
  { pos: [37.3714, -5.9974], emoji: '🏮', label: 'La Portada' },
  { pos: [37.3677, -5.9912], emoji: '🧇', label: 'CarloyJose' },
]

function crearIconoPoi(emoji) {
  return L.divIcon({
    html: `<div class="poi-icono">${emoji}</div>`,
    className: '',
    iconAnchor: [20, 20],
    iconSize:   [40, 40],
  })
}

// ─── MapInit ─────────────────────────────────────────────────────────────────
// 1. Aplica el bearing PRIMERO
// 2. Luego invalidateSize (para que Leaflet conozca el tamaño real del container)
// 3. ResizeObserver para reaccionar a cambios de viewport (address bar de Safari)
function MapInit({ bearing }) {
  const map    = useMap()
  const roRef  = useRef(null)

  // Bearing + invalidateSize en el orden correcto
  useEffect(() => {
    if (typeof map.setBearing === 'function') {
      map.setBearing(bearing)
    }
    // Tras aplicar el bearing, dejamos que el layout se estabilice antes de
    // invalidar — Safari necesita unos ms para recalcular el viewport
    const t = setTimeout(() => map.invalidateSize({ animate: false }), 120)
    return () => clearTimeout(t)
  }, [map, bearing])

  // ResizeObserver: más fiable que window.resize en Safari iOS
  useEffect(() => {
    const container = map.getContainer()

    function invalidar() {
      map.invalidateSize({ animate: false })
    }

    if (typeof ResizeObserver !== 'undefined') {
      roRef.current = new ResizeObserver(invalidar)
      roRef.current.observe(container)
    } else {
      // Fallback para navegadores sin ResizeObserver
      window.addEventListener('resize', invalidar)
    }

    // orientationchange necesita un delay extra
    function onOrient() { setTimeout(invalidar, 350) }
    window.addEventListener('orientationchange', onOrient)

    return () => {
      if (roRef.current) { roRef.current.disconnect(); roRef.current = null }
      else window.removeEventListener('resize', invalidar)
      window.removeEventListener('orientationchange', onOrient)
    }
  }, [map])

  return null
}

function esMobilePortraitActual() {
  return window.matchMedia('(orientation: portrait) and (max-width: 768px)').matches
}

export default function MapaFeria({ usuario, onCeldaSeleccionada, onCeldaVista, refrescar, celdaResaltada }) {
  const BEARING_MOVIL = 80
  const [mobilePortrait, setMobilePortrait] = useState(esMobilePortraitActual)

  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait) and (max-width: 768px)')
    const onChange = (e) => setMobilePortrait(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const bearing = mobilePortrait ? BEARING_MOVIL : 0

  return (
    <>
      <MapContainer
        center={CENTRO}
        zoom={16}
        zoomControl={false}
        rotate={true}
        touchRotate={false}
        rotateControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <MapInit bearing={bearing} />

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        <Polygon positions={POLIGONO} pathOptions={estiloPoligono} />

        <CasetasGeoJSON
          usuario={usuario}
          onCeldaSeleccionada={onCeldaSeleccionada}
          onCeldaVista={onCeldaVista}
          refrescar={refrescar}
          celdaResaltada={celdaResaltada}
        />

        {POIS.map((poi) => (
          <Marker
            key={poi.label}
            position={poi.pos}
            icon={crearIconoPoi(poi.emoji)}
          >
            <Tooltip permanent direction="bottom" offset={[0, 8]} className="poi-tooltip">
              {poi.label}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </>
  )
}
