import { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'

// Re-exportamos para que MapaFeria pueda importar desde aquí
export { POLIGONO, ANGULO_GRID } from './GridCeldas'

// ─── Paleta ───────────────────────────────────────────────────────────────────
const ESTILO_LIBRE = {
  color: '#666', fillColor: '#8a8a8a', weight: 1, opacity: 1, fillOpacity: 0.85,
}
const ESTILO_HOVER = {
  color: '#666', fillColor: '#aaa', weight: 1, opacity: 1, fillOpacity: 0.85,
}
const ESTILO_RECLAMADA = {
  color: '#a02020', fillColor: '#C8372D', weight: 1, opacity: 1, fillOpacity: 0.85,
}
// Resultado de búsqueda resaltado
const ESTILO_RESALTADA = {
  color: '#fff', fillColor: '#C8372D', weight: 3, opacity: 1, fillOpacity: 0.95,
}
// Zonas especiales (Calle del Infierno, Mañaneo, La Estrellita)
const ESTILO_ESPECIAL = {
  color: '#B8960C', fillColor: '#D4A843', weight: 1.5, opacity: 1, fillOpacity: 0.60,
}
const ESTILO_ESPECIAL_HOVER = {
  color: '#B8960C', fillColor: '#D4A843', weight: 1.5, opacity: 1, fillOpacity: 0.80,
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function CasetasGeoJSON({ usuario, onCeldaSeleccionada, onCeldaVista, refrescar = 0, celdaResaltada }) {
  const map = useMap()
  const [casetasData, setCasetasData] = useState(null)

  // Lazy load — no bloquea el render inicial de la app
  useEffect(() => {
    import('../data/casetas_feria.geojson').then(m => setCasetasData(m.default))
  }, [])

  // key "row-col" → { layer, row, col }
  const featuresRef           = useRef(new Map())
  // key "row-col" → fila de BD
  const celdasRef             = useRef(new Map())
  const hoveredKeyRef         = useRef(null)
  const resaltadaKeyRef       = useRef(null)
  // Función estable que re-aplica estilos sobre todos los polígonos
  const aplicarEstilosRef     = useRef(null)

  const usuarioRef             = useRef(usuario)
  const onCeldaSeleccionadaRef = useRef(onCeldaSeleccionada)
  const onCeldaVistaRef        = useRef(onCeldaVista)

  useEffect(() => { usuarioRef.current = usuario },                         [usuario])
  useEffect(() => { onCeldaSeleccionadaRef.current = onCeldaSeleccionada }, [onCeldaSeleccionada])
  useEffect(() => { onCeldaVistaRef.current = onCeldaVista },               [onCeldaVista])

  // ── Recargar celdas reclamadas cuando sube una foto nueva ─────────────────
  useEffect(() => {
    if (!aplicarEstilosRef.current) return   // capa aún no montada
    async function recargar() {
      const { data, error } = await supabase
        .from('celdas')
        .select('row, col, owner_name, image_url, pie_de_foto')
      if (error) { console.error('Error recargando celdas:', error.message); return }
      const mapa = new Map()
      data.forEach(c => mapa.set(`${c.row}-${c.col}`, c))
      celdasRef.current = mapa
      aplicarEstilosRef.current(mapa)
    }
    recargar()
  }, [refrescar])

  // ── Montar la capa GeoJSON (espera a que los datos estén cargados) ──────────
  useEffect(() => {
    if (!casetasData) return
    // Devuelve el estilo base (sin hover, sin reclamar) según el tipo de feature
    function estiloBase(item) {
      return item.isSpecial ? ESTILO_ESPECIAL : ESTILO_LIBRE
    }

    // Aplica estilos a todos los polígonos según el mapa BD
    function aplicarEstilos(mapa) {
      featuresRef.current.forEach((item, key) => {
        item.layer.setStyle(mapa.get(key) ? ESTILO_RECLAMADA : estiloBase(item))
      })
    }
    aplicarEstilosRef.current = aplicarEstilos

    // padding: 1 cubre el viewport rotado 80° completo (leaflet-rotate)
    const renderer = L.svg({ padding: 1 })

    const geoLayer = L.geoJSON(casetasData, {
      renderer,
      style: (feature) =>
        feature.properties.zone === 'special' ? { ...ESTILO_ESPECIAL } : { ...ESTILO_LIBRE },

      onEachFeature(feature, layer) {
        const { row, col, street, number, name, zone } = feature.properties
        const key = `${row}-${col}`
        const isSpecial = zone === 'special'
        featuresRef.current.set(key, { layer, row, col, street, number, name, isSpecial })

        // ── Hover ──
        layer.on('mouseover', () => {
          // Quitar hover del polígono anterior
          if (hoveredKeyRef.current && hoveredKeyRef.current !== key) {
            const prev = featuresRef.current.get(hoveredKeyRef.current)
            if (prev) {
              prev.layer.setStyle(
                celdasRef.current.get(hoveredKeyRef.current) ? ESTILO_RECLAMADA : estiloBase(prev)
              )
            }
          }
          hoveredKeyRef.current = key
          if (!celdasRef.current.get(key)) {
            layer.setStyle(isSpecial ? ESTILO_ESPECIAL_HOVER : ESTILO_HOVER)
          }
        })

        layer.on('mouseout', () => {
          if (hoveredKeyRef.current === key) {
            hoveredKeyRef.current = null
            layer.setStyle(celdasRef.current.get(key) ? ESTILO_RECLAMADA : estiloBase({ isSpecial }))
          }
        })

        // ── Click ──
        layer.on('click', (e) => {
          const reclamada = celdasRef.current.get(key)
          const partes = [street, number].filter(Boolean).join(', ')
          const dirCompleta = name ? `${partes} — ${name}` : partes

          if (reclamada) {
            const pie = reclamada.pie_de_foto
              ? `<p class="popup-pie">${reclamada.pie_de_foto}</p>`
              : ''
            const dir = dirCompleta
              ? `<p class="popup-dir">${dirCompleta}</p>`
              : ''
            L.popup({ className: 'popup-celda' })
              .setLatLng(e.latlng)
              .setContent(
                `<div class="popup-celda-inner">` +
                  `<img src="${reclamada.image_url}" class="popup-foto popup-foto-zoom"` +
                       ` onclick="window.__verFotoFeria('${key}')" alt="foto" />` +
                  `<p class="popup-titulo">${reclamada.owner_name || 'Anónimo'}</p>` +
                  dir +
                  pie +
                `</div>`
              )
              .openOn(map)
          } else if (usuarioRef.current) {
            onCeldaSeleccionadaRef.current?.({ row, col, street, number, name })
          } else {
            L.popup({ className: 'popup-celda' })
              .setLatLng(e.latlng)
              .setContent(
                `<div class="popup-celda-inner">` +
                  `<p class="popup-titulo">¡Este cacho está libre!</p>` +
                  `<p>Entra para reclamarlo.</p>` +
                `</div>`
              )
              .openOn(map)
          }
        })
      },
    })

    geoLayer.addTo(map)

    // Función global para que el onclick del popup llame al callback de React
    window.__verFotoFeria = (key) => {
      const celda = celdasRef.current.get(key)
      if (!celda) return
      const feat = featuresRef.current.get(key)
      onCeldaVistaRef.current?.({
        ...celda,
        street: feat?.street,
        number: feat?.number,
        name:   feat?.name,
      })
    }

    // Carga inicial de celdas reclamadas
    async function cargarCeldas() {
      const { data, error } = await supabase
        .from('celdas')
        .select('row, col, owner_name, image_url, pie_de_foto')
      if (error) { console.error('Error cargando celdas:', error.message); return }
      const mapa = new Map()
      data.forEach(c => mapa.set(`${c.row}-${c.col}`, c))
      celdasRef.current = mapa
      aplicarEstilos(mapa)
    }
    cargarCeldas()

    return () => {
      delete window.__verFotoFeria
      aplicarEstilosRef.current = null
      geoLayer.remove()
      featuresRef.current.clear()
    }
  }, [map, casetasData]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Resaltar caseta buscada + flyTo ──────────────────────────────────────
  useEffect(() => {
    // Restaurar estilo de la caseta anteriormente resaltada
    if (resaltadaKeyRef.current) {
      const prev = featuresRef.current.get(resaltadaKeyRef.current)
      if (prev) {
        prev.layer.setStyle(
          celdasRef.current.get(resaltadaKeyRef.current)
            ? ESTILO_RECLAMADA
            : prev.isSpecial ? ESTILO_ESPECIAL : ESTILO_LIBRE
        )
      }
      resaltadaKeyRef.current = null
    }

    if (!celdaResaltada) return

    const { key, lat, lng } = celdaResaltada
    const item = featuresRef.current.get(key)
    if (item) {
      item.layer.setStyle(ESTILO_RESALTADA)
      item.layer.bringToFront()
      resaltadaKeyRef.current = key
    }
    map.flyTo([lat, lng], 19, { animate: true, duration: 0.8 })
  }, [celdaResaltada, map])

  return null
}
