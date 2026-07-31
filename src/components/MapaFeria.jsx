import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import LugaresIslantilla from './LugaresIslantilla'

// Centro geográfico aproximado de Islantilla / La Antilla
const CENTRO = [37.2080, -7.2130]

// ─── MapInit ─────────────────────────────────────────────────────────────────
// invalidateSize + ResizeObserver para reaccionar a cambios de viewport
// (address bar de Safari, cambios de orientación...)
function MapInit() {
  const map    = useMap()
  const roRef  = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize({ animate: false }), 120)
    return () => clearTimeout(t)
  }, [map])

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

export default function MapaFeria({ usuario, onCeldaSeleccionada, onCeldaVista, refrescar, celdaResaltada }) {
  return (
    <MapContainer
      center={CENTRO}
      zoom={15}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
    >
      <MapInit />

      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      <LugaresIslantilla
        usuario={usuario}
        onCeldaSeleccionada={onCeldaSeleccionada}
        onCeldaVista={onCeldaVista}
        refrescar={refrescar}
        celdaResaltada={celdaResaltada}
      />
    </MapContainer>
  )
}
