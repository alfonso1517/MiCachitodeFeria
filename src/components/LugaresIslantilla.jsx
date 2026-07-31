import { useEffect, useRef, createElement } from 'react'
import { useMap } from 'react-leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  UtensilsCrossed, Beer, Umbrella, Music2, ShoppingBag,
  Building2, Trees, Flag, Coffee, MapPin,
} from 'lucide-react'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import lugaresData from '../data/lugares_islantilla.json'

const ICONOS = {
  chiringuito:      UtensilsCrossed,
  bar:              Beer,
  playa:            Umbrella,
  club:             Music2,
  centro_comercial: ShoppingBag,
  urbanizacion:     Building2,
  parque:           Trees,
  golf:             Flag,
  terraza:          Coffee,
}

// Cada icono se renderiza una sola vez a SVG estático (Leaflet pinta con HTML
// plano, no con componentes React)
const ICONOS_SVG = Object.fromEntries(
  Object.entries(ICONOS).map(([categoria, Icono]) => [
    categoria,
    renderToStaticMarkup(createElement(Icono, { size: 20, strokeWidth: 2 })),
  ])
)
const ICONO_SVG_DEFECTO = renderToStaticMarkup(createElement(MapPin, { size: 20, strokeWidth: 2 }))

function crearIcono(categoria, count) {
  const svg = ICONOS_SVG[categoria] || ICONO_SVG_DEFECTO
  const badge = count > 0 ? `<span class="lugar-marker-badge">${count}</span>` : ''
  return L.divIcon({
    html: `<div class="lugar-marker">${svg}${badge}</div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

const DIAS  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
function formatFecha(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]} · ${h}:${m}`
}

// Agrupa filas de BD por lugar_id, ordena fotos por claimed_at DESC
function agruparPorLugar(data) {
  const mapa = new Map()
  data.forEach(c => {
    if (!mapa.has(c.lugar_id)) mapa.set(c.lugar_id, { fotos: [], count: 0 })
    const entrada = mapa.get(c.lugar_id)
    entrada.fotos.push(c)
    entrada.count++
  })
  mapa.forEach(entrada => {
    entrada.fotos.sort((a, b) => new Date(b.claimed_at) - new Date(a.claimed_at))
  })
  return mapa
}

// ─── Componente ───────────────────────────────────────────────────────────────
// Un marcador circular por lugar (chiringuito, bar, playa...) en vez del grid
// de polígonos que usaba Sevilla/Jerez. Cada lugar admite fotos ilimitadas.
export default function LugaresIslantilla({ usuario, onCeldaSeleccionada, onCeldaVista, refrescar = 0, celdaResaltada }) {
  const map = useMap()

  const markersRef            = useRef(new Map()) // lugar_id → marker
  const celdasRef              = useRef(new Map()) // lugar_id → { fotos, count }
  const usuarioRef             = useRef(usuario)
  const onCeldaSeleccionadaRef = useRef(onCeldaSeleccionada)
  const onCeldaVistaRef        = useRef(onCeldaVista)

  useEffect(() => { usuarioRef.current = usuario },                         [usuario])
  useEffect(() => { onCeldaSeleccionadaRef.current = onCeldaSeleccionada }, [onCeldaSeleccionada])
  useEffect(() => { onCeldaVistaRef.current = onCeldaVista },               [onCeldaVista])

  // ── Montar los marcadores (una sola vez) ──────────────────────────────────
  useEffect(() => {
    lugaresData.forEach(lugar => {
      const marker = L.marker([lugar.lat, lugar.lng], { icon: crearIcono(lugar.categoria, 0) })

      marker.on('click', () => {
        const entrada = celdasRef.current.get(lugar.id)

        if (entrada) {
          const primerFoto = entrada.fotos[0]
          const count = entrada.count
          const fechaStr = primerFoto.claimed_at ? formatFecha(primerFoto.claimed_at) : ''
          const metaParts = [primerFoto.pie_de_foto, fechaStr].filter(Boolean)
          const meta = metaParts.length
            ? `<p class="popup-meta">${metaParts.join(' · ')}</p>`
            : ''
          const btnAnadir = usuarioRef.current
            ? `<button class="popup-anadir" onclick="window.__anadirFotoIslantilla('${lugar.id}')">+ Añadir mi foto</button>`
            : ''
          L.popup({ className: 'popup-celda' })
            .setLatLng(marker.getLatLng())
            .setContent(
              `<div class="popup-celda-inner">` +
                `<img src="${primerFoto.image_url}" class="popup-foto popup-foto-zoom"` +
                     ` onclick="window.__verFotoIslantilla('${lugar.id}')" alt="foto" />` +
                `<p class="popup-titulo">${lugar.nombre}</p>` +
                `<p class="popup-dir">${primerFoto.owner_name || 'Anónimo'}</p>` +
                meta +
                `<p class="popup-contador">${count} foto${count === 1 ? '' : 's'} · ` +
                  `<span class="popup-ver-fotos" onclick="window.__verFotoIslantilla('${lugar.id}')">` +
                    `Ver todas →` +
                  `</span></p>` +
                btnAnadir +
              `</div>`
            )
            .openOn(map)
        } else if (usuarioRef.current) {
          onCeldaSeleccionadaRef.current?.({
            lugar_id:     lugar.id,
            nombre_lugar: lugar.nombre,
            categoria:    lugar.categoria,
            lat:          lugar.lat,
            lng:          lugar.lng,
          })
        } else {
          L.popup({ className: 'popup-celda' })
            .setLatLng(marker.getLatLng())
            .setContent(
              `<div class="popup-celda-inner">` +
                `<p class="popup-titulo">${lugar.nombre}</p>` +
                `<p>Entra para subir la primera foto.</p>` +
              `</div>`
            )
            .openOn(map)
        }
      })

      marker.addTo(map)
      markersRef.current.set(lugar.id, marker)
    })

    window.__verFotoIslantilla = (lugarId) => {
      const entrada = celdasRef.current.get(lugarId)
      const lugar = lugaresData.find(l => l.id === lugarId)
      if (!entrada || !lugar) return
      onCeldaVistaRef.current?.({
        fotos:        entrada.fotos,
        lugar_id:     lugar.id,
        nombre_lugar: lugar.nombre,
      })
    }

    window.__anadirFotoIslantilla = (lugarId) => {
      map.closePopup()
      const lugar = lugaresData.find(l => l.id === lugarId)
      if (!lugar || !usuarioRef.current) return
      onCeldaSeleccionadaRef.current?.({
        lugar_id:     lugar.id,
        nombre_lugar: lugar.nombre,
        categoria:    lugar.categoria,
        lat:          lugar.lat,
        lng:          lugar.lng,
      })
    }

    return () => {
      delete window.__verFotoIslantilla
      delete window.__anadirFotoIslantilla
      markersRef.current.forEach(m => m.remove())
      markersRef.current.clear()
    }
  }, [map])

  // ── Cargar / recargar fotos por lugar ─────────────────────────────────────
  useEffect(() => {
    async function cargar() {
      const { data, error } = await supabase
        .from('celdas')
        .select('lugar_id, owner_name, image_url, pie_de_foto, claimed_at')
        .eq('feria', 'islantilla')
      if (error) { console.error('Error cargando lugares:', error.message); return }
      const mapa = agruparPorLugar(data)
      celdasRef.current = mapa
      lugaresData.forEach(lugar => {
        const marker = markersRef.current.get(lugar.id)
        if (marker) marker.setIcon(crearIcono(lugar.categoria, mapa.get(lugar.id)?.count ?? 0))
      })
    }
    cargar()
  }, [refrescar])

  // ── Resaltar lugar buscado + flyTo ────────────────────────────────────────
  useEffect(() => {
    if (!celdaResaltada) return
    const { lat, lng, lugar_id } = celdaResaltada
    map.flyTo([lat, lng], 18, { animate: true, duration: 0.8 })
    const marker = markersRef.current.get(lugar_id)
    if (marker) marker.openPopup()
  }, [celdaResaltada, map])

  return null
}
