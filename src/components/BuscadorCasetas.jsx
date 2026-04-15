import { useState, useMemo, useRef, useEffect } from 'react'

function normalizar(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function centroide(coordenadas) {
  const ring = coordenadas[0]
  const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length
  const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length
  return [lat, lng]
}

function construirIndice(data) {
  return data.features
    .map(f => {
      const { row, col, name, street, number } = f.properties
      const key = `${row}-${col}`
      const partes = [street, number].filter(Boolean).join(', ')
      const display = name ? `${partes} — ${name}` : partes
      if (!display) return null
      return {
        key,
        row, col,
        display,
        textoBusqueda: normalizar(`${name} ${street} ${number}`),
        lat: centroide(f.geometry.coordinates)[0],
        lng: centroide(f.geometry.coordinates)[1],
      }
    })
    .filter(Boolean)
}

export default function BuscadorCasetas({ onSeleccionar }) {
  const [abierto, setAbierto] = useState(false)
  const [query,   setQuery]   = useState('')
  const [indice,  setIndice]  = useState([])
  const inputRef = useRef(null)
  const panelRef = useRef(null)

  // Lazy load — no bloquea el render inicial
  useEffect(() => {
    import('../data/casetas_feria.geojson')
      .then(m => setIndice(construirIndice(m.default)))
  }, [])

  const resultados = useMemo(() => {
    const q = normalizar(query).trim()
    if (!q) return []
    const tokens = q.split(/\s+/)
    return indice
      .filter(item => tokens.every(t => item.textoBusqueda.includes(t)))
      .slice(0, 9)
  }, [query, indice])

  useEffect(() => {
    if (abierto) {
      setTimeout(() => inputRef.current?.focus(), 60)
    } else {
      setQuery('')
    }
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    function onKey(e) { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [abierto])

  function seleccionar(item) {
    setAbierto(false)
    onSeleccionar(item)
  }

  return (
    <>
      <button
        className="btn-buscar"
        onClick={() => setAbierto(a => !a)}
        aria-label="Buscar caseta"
      >
        Buscar Caseta
      </button>

      {abierto && (
        <>
          <div className="buscador-backdrop" onClick={() => setAbierto(false)} />

          <div className="buscador-panel" ref={panelRef}>
            <input
              ref={inputRef}
              className="buscador-input"
              type="search"
              placeholder="Caseta, calle o número…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />

            {resultados.length > 0 && (
              <ul className="buscador-lista">
                {resultados.map(item => (
                  <li
                    key={item.key}
                    className="buscador-item"
                    onClick={() => seleccionar(item)}
                  >
                    {item.display}
                  </li>
                ))}
              </ul>
            )}

            {query.trim() && resultados.length === 0 && (
              <p className="buscador-vacio">Sin resultados</p>
            )}
          </div>
        </>
      )}
    </>
  )
}
