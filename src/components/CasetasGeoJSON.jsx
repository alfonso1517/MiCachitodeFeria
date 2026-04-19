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
// Zona unlimited (CUMPLE ALI Y CLAU)
const ESTILO_UNLIMITED = {
  color: '#9C1368', fillColor: '#E91E8C', weight: 2, opacity: 1, fillOpacity: 0.75,
}
const ESTILO_UNLIMITED_HOVER = {
  color: '#9C1368', fillColor: '#F048A8', weight: 2, opacity: 1, fillOpacity: 0.90,
}

const MAX_FOTOS = 10

// Agrupa filas de BD por (row, col), ordena fotos por claimed_at DESC
function agruparCeldas(data) {
  const mapa = new Map()
  data.forEach(c => {
    const key = `${c.row}-${c.col}`
    if (!mapa.has(key)) mapa.set(key, { fotos: [], count: 0 })
    const entrada = mapa.get(key)
    entrada.fotos.push(c)
    entrada.count++
  })
  mapa.forEach(entrada => {
    entrada.fotos.sort((a, b) => new Date(b.claimed_at) - new Date(a.claimed_at))
  })
  return mapa
}

const DIAS  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
function formatFecha(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const h = String(d.getHours()).padStart(2,'0')
  const m = String(d.getMinutes()).padStart(2,'0')
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]} · ${h}:${m}`
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function CasetasGeoJSON({ usuario, onCeldaSeleccionada, onCeldaVista, refrescar = 0, celdaResaltada }) {
  const map = useMap()
  const [casetasData, setCasetasData] = useState(null)

  // Lazy load — no bloquea el render inicial de la app
  useEffect(() => {
    import('../data/casetas_feria.geojson').then(m => setCasetasData(m.default))
  }, [])

  // key "row-col" → { layer, row, col, ... }
  const featuresRef           = useRef(new Map())
  // key "row-col" → { fotos: [...], count: N }
  const celdasRef             = useRef(new Map())
  const hoveredKeyRef         = useRef(null)
  const resaltadaKeyRef       = useRef(null)
  const aplicarEstilosRef     = useRef(null)

  const usuarioRef             = useRef(usuario)
  const onCeldaSeleccionadaRef = useRef(onCeldaSeleccionada)
  const onCeldaVistaRef        = useRef(onCeldaVista)

  useEffect(() => { usuarioRef.current = usuario },                         [usuario])
  useEffect(() => { onCeldaSeleccionadaRef.current = onCeldaSeleccionada }, [onCeldaSeleccionada])
  useEffect(() => { onCeldaVistaRef.current = onCeldaVista },               [onCeldaVista])

  // ── Recargar celdas reclamadas cuando sube una foto nueva ─────────────────
  useEffect(() => {
    if (!aplicarEstilosRef.current) return
    async function recargar() {
      const { data, error } = await supabase
        .from('celdas')
        .select('row, col, owner_name, image_url, pie_de_foto, claimed_at')
      if (error) { console.error('Error recargando celdas:', error.message); return }
      const mapa = agruparCeldas(data)
      celdasRef.current = mapa
      aplicarEstilosRef.current(mapa)
    }
    recargar()
  }, [refrescar])

  // ── Montar la capa GeoJSON ──────────────────────────────────────────────────
  useEffect(() => {
    if (!casetasData) return

    function estiloBase(item) {
      if (item.isUnlimited) return ESTILO_UNLIMITED
      if (item.isSpecial)   return ESTILO_ESPECIAL
      return ESTILO_LIBRE
    }

    function aplicarEstilos(mapa) {
      featuresRef.current.forEach((item, key) => {
        item.layer.setStyle(mapa.get(key) ? ESTILO_RECLAMADA : estiloBase(item))
      })
    }
    aplicarEstilosRef.current = aplicarEstilos

    const renderer = L.svg({ padding: 1 })

    const geoLayer = L.geoJSON(casetasData, {
      renderer,
      style: (feature) => {
        if (feature.properties.zone === 'unlimited') return { ...ESTILO_UNLIMITED }
        if (feature.properties.zone === 'special')   return { ...ESTILO_ESPECIAL }
        return { ...ESTILO_LIBRE }
      },

      onEachFeature(feature, layer) {
        const { row, col, street, number, name, zone } = feature.properties
        const key = `${row}-${col}`
        const isSpecial   = zone === 'special'
        const isUnlimited = zone === 'unlimited'
        featuresRef.current.set(key, { layer, row, col, street, number, name, isSpecial, isUnlimited })

        // ── Hover ──
        layer.on('mouseover', () => {
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
            layer.setStyle(
              isUnlimited ? ESTILO_UNLIMITED_HOVER :
              isSpecial   ? ESTILO_ESPECIAL_HOVER  : ESTILO_HOVER
            )
          }
        })

        layer.on('mouseout', () => {
          if (hoveredKeyRef.current === key) {
            hoveredKeyRef.current = null
            layer.setStyle(celdasRef.current.get(key) ? ESTILO_RECLAMADA : estiloBase({ isSpecial, isUnlimited }))
          }
        })

        // ── Click ──
        layer.on('click', (e) => {
          const entrada = celdasRef.current.get(key)
          const partes = [street, number].filter(Boolean).join(', ')
          const dirCompleta = name ? `${partes} — ${name}` : partes

          if (entrada) {
            // Caseta con fotos — mostrar popup con la más reciente
            const primerFoto = entrada.fotos[0]
            const count = entrada.count
            const pie = primerFoto.pie_de_foto
              ? `<p class="popup-pie">${primerFoto.pie_de_foto}</p>`
              : ''
            const fecha = primerFoto.claimed_at
              ? `<p class="popup-fecha">${formatFecha(primerFoto.claimed_at)}</p>`
              : ''
            const dir = dirCompleta
              ? `<p class="popup-dir">${dirCompleta}</p>`
              : ''
            const entrada2    = celdasRef.current.get(key)
            const ilimitada   = featuresRef.current.get(key)?.isUnlimited
            const btnAnadir = (usuarioRef.current && (ilimitada || count < MAX_FOTOS))
              ? `<button class="popup-anadir" onclick="window.__añadirFotoFeria('${key}')">+ Añadir mi foto</button>`
              : ''
            L.popup({ className: 'popup-celda' })
              .setLatLng(e.latlng)
              .setContent(
                `<div class="popup-celda-inner">` +
                  `<img src="${primerFoto.image_url}" class="popup-foto popup-foto-zoom"` +
                       ` onclick="window.__verFotoFeria('${key}')" alt="foto" />` +
                  `<p class="popup-titulo">${primerFoto.owner_name || 'Anónimo'}</p>` +
                  dir +
                  pie +
                  fecha +
                  (!ilimitada ? `<p class="popup-contador">${count}/${MAX_FOTOS} fotos · ` :
                   `<p class="popup-contador">${count} fotos · `) +
                    `<span class="popup-ver-fotos" onclick="window.__verFotoFeria('${key}')">` +
                      `Ver todas →` +
                    `</span></p>` +
                  btnAnadir +
                `</div>`
              )
              .openOn(map)
          } else if (usuarioRef.current) {
            onCeldaSeleccionadaRef.current?.({ row, col, street, number, name, fotoCount: 0, sinLimite: isUnlimited })
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

    // Ver fotos en carrusel
    window.__verFotoFeria = (key) => {
      const entrada = celdasRef.current.get(key)
      if (!entrada) return
      const feat = featuresRef.current.get(key)
      onCeldaVistaRef.current?.({
        fotos:  entrada.fotos,
        row:    feat?.row,
        col:    feat?.col,
        street: feat?.street,
        number: feat?.number,
        name:   feat?.name,
      })
    }

    // Añadir foto desde el popup
    window.__añadirFotoFeria = (key) => {
      map.closePopup()
      const entrada = celdasRef.current.get(key)
      const feat = featuresRef.current.get(key)
      if (!feat || !usuarioRef.current) return
      onCeldaSeleccionadaRef.current?.({
        row:        feat.row,
        col:        feat.col,
        street:     feat.street,
        number:     feat.number,
        name:       feat.name,
        fotoCount:  entrada?.count ?? 0,
        sinLimite:  feat.isUnlimited ?? false,
      })
    }

    // Carga inicial de celdas reclamadas
    async function cargarCeldas() {
      const { data, error } = await supabase
        .from('celdas')
        .select('row, col, owner_name, image_url, pie_de_foto, claimed_at')
      if (error) { console.error('Error cargando celdas:', error.message); return }
      const mapa = agruparCeldas(data)
      celdasRef.current = mapa
      aplicarEstilos(mapa)
    }
    cargarCeldas()

    return () => {
      delete window.__verFotoFeria
      delete window.__añadirFotoFeria
      aplicarEstilosRef.current = null
      geoLayer.remove()
      featuresRef.current.clear()
    }
  }, [map, casetasData]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Resaltar caseta buscada + flyTo ──────────────────────────────────────
  useEffect(() => {
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
