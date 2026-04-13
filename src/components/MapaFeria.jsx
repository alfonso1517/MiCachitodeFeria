import { MapContainer, TileLayer, Rectangle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Bounding box del área jugable:
// Rectángulo apaisado (más ancho que alto) que cubre el Real de la Feria,
// la Calle del Infierno al oeste, el Puente de las Delicias
// y la zona de Carlos y José al este del puente
const BOUNDS = [
  [37.3670, -6.0110], // suroeste
  [37.3725, -5.9895], // noreste
]

// Centro calculado como punto medio de la bounding box
const CENTRO = [37.3698, -6.0003]

// Estilo del rectángulo que marca el área jugable
const estiloRectangulo = {
  color: '#D4A55A',      // albero — color de acento principal
  weight: 2,
  fillColor: '#D4A55A',
  fillOpacity: 0.08,     // relleno muy sutil para no tapar el mapa
}

export default function MapaFeria() {
  return (
    <MapContainer
      center={CENTRO}
      zoom={15}
      zoomControl={false}        // ocultamos controles de zoom — usamos pinch-zoom en móvil
      style={{ height: '100%', width: '100%' }}
    >
      {/* Tiles de CartoDB Positron: look limpio, gratis, sin API key */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      {/* Rectángulo que delimita la zona jugable del Real */}
      <Rectangle bounds={BOUNDS} pathOptions={estiloRectangulo} />
    </MapContainer>
  )
}
