import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'

// ─── Polígono jugable (4 esquinas exactas del recinto) ───────────────────────
// Orden: SW → SE → NE → NW  (sentido horario visto desde arriba)
// Si cambias estas coordenadas, cámbialas también en MapaFeria.jsx
export const POLIGONO = [
  [37.369139, -6.011528],  // SW — extremo inferior izquierda
  [37.366750, -5.990972],  // SE — extremo inferior derecha (CarloyJose)
  [37.371917, -5.990111],  // NE — extremo superior derecha (río / pasarela)
  [37.374278, -6.011083],  // NW — extremo superior izquierda (La Portada)
]

// ─── Ángulo de rotación ───────────────────────────────────────────────────────
// -10.5° alinea las celdas con la inclinación real de las calles de la Feria
// Exportado para que MapaFeria sepa qué ángulo usar
export const ANGULO_GRID = -10.5

// ─── Constantes de conversión ────────────────────────────────────────────────
// Centro del polígono como punto de rotación
const ORIGEN_LAT = POLIGONO.reduce((s, c) => s + c[0], 0) / POLIGONO.length
const ORIGEN_LNG = POLIGONO.reduce((s, c) => s + c[1], 0) / POLIGONO.length
const M_LAT = 111320
const M_LNG = 111320 * Math.cos(ORIGEN_LAT * Math.PI / 180)
const CELL_M = 20

// Paleta
const COLOR_NORMAL = '#E8E4DE'   // --gris-claro
const COLOR_HOVER  = '#D4A55A'   // --albero

// ─── Conversiones lat/lng ↔ coordenadas locales rotadas ──────────────────────
function aLocal(lat, lng, θ) {
  const dx = (lng - ORIGEN_LNG) * M_LNG
  const dy = (lat - ORIGEN_LAT) * M_LAT
  return [
     dx * Math.cos(θ) + dy * Math.sin(θ),
    -dx * Math.sin(θ) + dy * Math.cos(θ),
  ]
}

function aLatLng(u, v, θ) {
  const dx = u * Math.cos(θ) - v * Math.sin(θ)
  const dy = u * Math.sin(θ) + v * Math.cos(θ)
  return [ORIGEN_LAT + dy / M_LAT, ORIGEN_LNG + dx / M_LNG]
}

// ─── Extent del grid ─────────────────────────────────────────────────────────
// Calcula cuántas filas/columnas hacen falta para cubrir el polígono completo
function calcExtent(θ) {
  const esquinas = POLIGONO.map(([lat, lng]) => aLocal(lat, lng, θ))
  const minU = Math.min(...esquinas.map(e => e[0]))
  const maxU = Math.max(...esquinas.map(e => e[0]))
  const minV = Math.min(...esquinas.map(e => e[1]))
  const maxV = Math.max(...esquinas.map(e => e[1]))
  const oU = Math.floor(minU / CELL_M) * CELL_M
  const oV = Math.floor(minV / CELL_M) * CELL_M
  return {
    oU, oV,
    nCols: Math.ceil((maxU - oU) / CELL_M),
    nRows: Math.ceil((maxV - oV) / CELL_M),
  }
}

// ─── Punto dentro del polígono (ray casting) ─────────────────────────────────
// Solo dibujamos celdas cuyo centro cae dentro del polígono jugable exacto.
function dentroDePoligono(lat, lng) {
  let inside = false
  const n = POLIGONO.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [lat_i, lng_i] = POLIGONO[i]
    const [lat_j, lng_j] = POLIGONO[j]
    if ((lng_i > lng) !== (lng_j > lng) &&
        lat < (lat_j - lat_i) * (lng - lng_i) / (lng_j - lng_i) + lat_i) {
      inside = !inside
    }
  }
  return inside
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function GridCeldas({ angulo = ANGULO_GRID, usuario, onCeldaSeleccionada, onCeldaVista, refrescar = 0 }) {
  const map = useMap()

  const canvasRef            = useRef(null)
  const θRef                 = useRef(angulo * Math.PI / 180)
  const extRef               = useRef(calcExtent(θRef.current))
  const hoverRef             = useRef(null)
  const rafRef               = useRef(null)
  const redrawRef            = useRef(null)
  // Mapa de celdas reclamadas: clave "row-col" → datos de BD
  const celdasRef            = useRef(new Map())
  // Refs para props que cambian sin re-montar el canvas
  const usuarioRef             = useRef(usuario)
  const onCeldaSeleccionadaRef = useRef(onCeldaSeleccionada)
  const onCeldaVistaRef        = useRef(onCeldaVista)

  useEffect(() => { usuarioRef.current = usuario },                       [usuario])
  useEffect(() => { onCeldaSeleccionadaRef.current = onCeldaSeleccionada }, [onCeldaSeleccionada])
  useEffect(() => { onCeldaVistaRef.current = onCeldaVista },             [onCeldaVista])

  useEffect(() => {
    θRef.current     = angulo * Math.PI / 180
    extRef.current   = calcExtent(θRef.current)
    hoverRef.current = null
    if (redrawRef.current) redrawRef.current(true)
  }, [angulo])

  // Recargar celdas desde Supabase cuando se haga una nueva reclamación
  useEffect(() => {
    if (!redrawRef.current) return   // todavía no se ha montado el canvas
    async function recargar() {
      const { data, error } = await supabase
        .from('celdas')
        .select('row, col, owner_name, image_url, pie_de_foto')
      if (error) { console.error('Error recargando celdas:', error.message); return }
      const mapa = new Map()
      data.forEach(c => mapa.set(`${c.row}-${c.col}`, c))
      celdasRef.current = mapa
      redrawRef.current(false)
    }
    recargar()
  }, [refrescar])

  useEffect(() => {
    // ── Cargar celdas reclamadas desde Supabase ──────────────────────────
    async function cargarCeldas() {
      const { data, error } = await supabase
        .from('celdas')
        .select('row, col, owner_name, image_url, pie_de_foto')

      if (error) {
        console.error('Error cargando celdas:', error.message)
        return
      }

      // Guardar en el mapa para lookup O(1) al dibujar
      const mapa = new Map()
      data.forEach(c => mapa.set(`${c.row}-${c.col}`, c))
      celdasRef.current = mapa

      // Redibujar con las celdas recién cargadas
      if (redrawRef.current) redrawRef.current(false)
    }

    cargarCeldas()

    const canvas = L.DomUtil.create('canvas', 'grid-canvas', map.getPanes().overlayPane)
    canvasRef.current = canvas
    canvas.style.position      = 'absolute'
    canvas.style.pointerEvents = 'none'
    canvas.style.transition    = 'opacity 0.18s ease'

    function redibujar(conFade = true) {
      if (conFade) canvas.style.opacity = '0'

      const θ   = θRef.current
      const ext = extRef.current
      const ctx = canvas.getContext('2d')
      const mb  = map.getBounds()

      // Margen de 18 celdas para cubrir pans rápidos sin bordes vacíos
      const mLat = (CELL_M * 18) / M_LAT
      const mLng = (CELL_M * 18) / M_LNG
      const N = mb.getNorth() + mLat, S = mb.getSouth() - mLat
      const E = mb.getEast()  + mLng, W = mb.getWest()  - mLng

      const tl = map.latLngToLayerPoint(L.latLng(N, W))
      const br = map.latLngToLayerPoint(L.latLng(S, E))
      canvas.width  = Math.max(br.x - tl.x, 1)
      canvas.height = Math.max(br.y - tl.y, 1)
      L.DomUtil.setPosition(canvas, tl)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Rango de filas/cols visibles en el viewport actual
      const vpLocal = [[N,W],[N,E],[S,W],[S,E]].map(([lat,lng]) => aLocal(lat,lng,θ))
      const vpMinU = Math.min(...vpLocal.map(c=>c[0]))
      const vpMaxU = Math.max(...vpLocal.map(c=>c[0]))
      const vpMinV = Math.min(...vpLocal.map(c=>c[1]))
      const vpMaxV = Math.max(...vpLocal.map(c=>c[1]))

      const c0 = Math.max(0,         Math.floor((vpMinU - ext.oU) / CELL_M))
      const c1 = Math.min(ext.nCols,  Math.ceil((vpMaxU - ext.oU) / CELL_M))
      const r0 = Math.max(0,         Math.floor((vpMinV - ext.oV) / CELL_M))
      const r1 = Math.min(ext.nRows,  Math.ceil((vpMaxV - ext.oV) / CELL_M))

      for (let row = r0; row < r1; row++) {
        for (let col = c0; col < c1; col++) {
          // Verificar que el centro de la celda esté dentro del polígono jugable
          const uC = ext.oU + (col + 0.5) * CELL_M
          const vC = ext.oV + (row + 0.5) * CELL_M
          const [latC, lngC] = aLatLng(uC, vC, θ)
          if (!dentroDePoligono(latC, lngC)) continue

          // Dibujar la celda como polígono rotado
          const uA = ext.oU +  col      * CELL_M
          const uB = ext.oU + (col + 1) * CELL_M
          const vA = ext.oV +  row      * CELL_M
          const vB = ext.oV + (row + 1) * CELL_M

          const pts = [[uA,vA],[uB,vA],[uB,vB],[uA,vB]].map(([u,v]) => {
            const [lat, lng] = aLatLng(u, v, θ)
            const pt = map.latLngToLayerPoint([lat, lng])
            return [pt.x - tl.x, pt.y - tl.y]
          })

          ctx.beginPath()
          ctx.moveTo(pts[0][0], pts[0][1])
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
          ctx.closePath()

          const isHov      = hoverRef.current?.row === row && hoverRef.current?.col === col
          const reclamada  = celdasRef.current.get(`${row}-${col}`)

          if (reclamada) {
            // Celda reclamada: relleno albero suave + borde marcado
            ctx.fillStyle   = 'rgba(212, 165, 90, 0.30)'
            ctx.fill()
            ctx.strokeStyle = '#D4A55A'
            ctx.lineWidth   = 1.5
          } else {
            ctx.strokeStyle = isHov ? COLOR_HOVER : COLOR_NORMAL
            ctx.lineWidth   = isHov ? 2 : 1
          }
          ctx.stroke()
        }
      }

      if (conFade) requestAnimationFrame(() => { canvas.style.opacity = '1' })
    }

    redrawRef.current = redibujar

    // Encontrar celda bajo un punto lat/lng — O(1) + test de polígono
    function encontrarCelda(lat, lng) {
      if (!dentroDePoligono(lat, lng)) return null
      const θ   = θRef.current
      const ext = extRef.current
      const [u, v] = aLocal(lat, lng, θ)
      const col = Math.floor((u - ext.oU) / CELL_M)
      const row = Math.floor((v - ext.oV) / CELL_M)
      if (col < 0 || col >= ext.nCols || row < 0 || row >= ext.nRows) return null
      return { row, col }
    }

    // Hover throttleado con RAF
    function onMousemove(e) {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        const c = encontrarCelda(e.latlng.lat, e.latlng.lng)
        const p = hoverRef.current
        if (c?.row !== p?.row || c?.col !== p?.col) {
          hoverRef.current = c
          redibujar(false)
        }
      })
    }

    function onMouseout() {
      if (hoverRef.current) { hoverRef.current = null; redibujar(false) }
    }

    function onClick(e) {
      const c = encontrarCelda(e.latlng.lat, e.latlng.lng)
      if (!c) return

      const reclamada = celdasRef.current.get(`${c.row}-${c.col}`)

      if (reclamada) {
        // Celda reclamada: popup con foto clicable para verla grande
        const pie = reclamada.pie_de_foto
          ? `<p class="popup-pie">${reclamada.pie_de_foto}</p>`
          : ''
        L.popup({ className: 'popup-celda' })
          .setLatLng(e.latlng)
          .setContent(
            `<div class="popup-celda-inner">` +
              `<img src="${reclamada.image_url}" class="popup-foto popup-foto-zoom"` +
                   ` onclick="window.__verFotoFeria('${c.row}-${c.col}')" alt="foto" />` +
              `<p class="popup-titulo">${reclamada.owner_name || 'Anónimo'}</p>` +
              pie +
            `</div>`
          )
          .openOn(map)
      } else if (usuarioRef.current) {
        // Celda libre + usuario logueado → abrir bottom sheet
        onCeldaSeleccionadaRef.current?.(c)
      } else {
        // Celda libre + no logueado → invitar a entrar
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
    }

    // Función global para que el onclick del popup pueda llamar al callback de React
    window.__verFotoFeria = (key) => {
      const celda = celdasRef.current.get(key)
      if (celda) onCeldaVistaRef.current?.(celda)
    }

    map.on('moveend zoomend', redibujar)
    map.on('mousemove', onMousemove)
    map.on('mouseout', onMouseout)
    map.on('click', onClick)
    redibujar(false)

    return () => {
      delete window.__verFotoFeria
      map.off('moveend zoomend', redibujar)
      map.off('mousemove', onMousemove)
      map.off('mouseout', onMouseout)
      map.off('click', onClick)
      canvas.remove()
      canvasRef.current = null
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    }
  }, [map])

  return null
}
