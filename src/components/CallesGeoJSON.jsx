import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import callesData from '../data/calles_feria.geojson'

const COLOR = '#D4A843'

export default function CallesGeoJSON() {
  const map = useMap()

  useEffect(() => {
    const layer = L.geoJSON(callesData, {
      interactive: false,
      style: (feature) => {
        const tipo = feature.geometry.type
        if (tipo === 'Polygon' || tipo === 'MultiPolygon') {
          return { color: COLOR, fillColor: COLOR, weight: 0, fillOpacity: 0.75 }
        }
        return { color: COLOR, weight: 13, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }
      },
    })
    layer.addTo(map)
    return () => layer.remove()
  }, [map])

  return null
}
