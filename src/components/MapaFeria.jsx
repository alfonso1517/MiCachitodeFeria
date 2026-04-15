import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Polygon, Marker, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-rotate'
import L from 'leaflet'
import CasetasGeoJSON, { POLIGONO } from './CasetasGeoJSON'

// Centro calculado como centroide del polígono jugable
const CENTRO = [
  POLIGONO.reduce((s, c) => s + c[0], 0) / POLIGONO.length,
  POLIGONO.reduce((s, c) => s + c[1], 0) / POLIGONO.length,
]

const estiloPoligono = {
  color:       '#D4A55A',
  weight:      1,
  opacity:     0.5,
  fillOpacity: 0,
}

// ─── Puntos de interés ────────────────────────────────────────────────────────
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

// Componente hijo que aplica el bearing dinámicamente al mapa de Leaflet
function BearingControl({ bearing }) {
  const map = useMap()
  useEffect(() => {
    if (typeof map.setBearing === 'function') {
      map.setBearing(bearing)
    }
  }, [map, bearing])
  return null
}

function esMobilePortraitActual() {
  return window.matchMedia('(orientation: portrait) and (max-width: 768px)').matches
}

export default function MapaFeria({ usuario, onCeldaSeleccionada, onCeldaVista, refrescar }) {
  const BEARING_MOVIL = 80
  const [mobilePortrait, setMobilePortrait] = useState(esMobilePortraitActual)

  // Actualizar cuando cambie orientación o tamaño de pantalla
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
        zoom={15}
        zoomControl={false}
        rotate={true}
        touchRotate={false}
        rotateControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <BearingControl bearing={bearing} />

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Borde naranja siguiendo el polígono exacto del recinto */}
        <Polygon positions={POLIGONO} pathOptions={estiloPoligono} />

        {/* Polígonos reales de casetas extraídos de OpenStreetMap */}
        <CasetasGeoJSON
          usuario={usuario}
          onCeldaSeleccionada={onCeldaSeleccionada}
          onCeldaVista={onCeldaVista}
          refrescar={refrescar}
        />

        {/* Marcadores de puntos de interés */}
        {POIS.map((poi) => (
          <Marker
            key={poi.label}
            position={poi.pos}
            icon={crearIconoPoi(poi.emoji)}
          >
            <Tooltip
              permanent
              direction="bottom"
              offset={[0, 8]}
              className="poi-tooltip"
            >
              {poi.label}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

    </>
  )
}
