import { MapContainer, TileLayer, Polygon, Marker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import GridCeldas, { POLIGONO, ANGULO_GRID } from './GridCeldas'

// Centro calculado como centroide del polígono jugable
const CENTRO = [
  POLIGONO.reduce((s, c) => s + c[0], 0) / POLIGONO.length,
  POLIGONO.reduce((s, c) => s + c[1], 0) / POLIGONO.length,
]

const estiloPoligono = {
  color:       '#D4A55A',
  weight:      2,
  fillColor:   '#D4A55A',
  fillOpacity: 0.06,
}

// ─── Puntos de interés ────────────────────────────────────────────────────────
const POIS = [
  { pos: [37.3714, -5.9974], emoji: '🏮', label: 'La Portada'  },
  { pos: [37.3677, -5.9912], emoji: '🧇', label: 'CarloyJose'  },
]

function crearIconoPoi(emoji) {
  return L.divIcon({
    html: `<div class="poi-icono">${emoji}</div>`,
    className: '',
    iconAnchor: [20, 20],
    iconSize:   [40, 40],
  })
}

export default function MapaFeria({ usuario, onCeldaSeleccionada, onCeldaVista, refrescar }) {
  return (
    <MapContainer
      center={CENTRO}
      zoom={15}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      {/* Borde naranja siguiendo el polígono exacto del recinto */}
      <Polygon positions={POLIGONO} pathOptions={estiloPoligono} />

      {/* Cuadrícula de celdas rotada y recortada al polígono */}
      <GridCeldas
        angulo={ANGULO_GRID}
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
  )
}
