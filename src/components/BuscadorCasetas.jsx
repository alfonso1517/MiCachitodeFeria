import { useState, useMemo, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import lugaresData from '../data/lugares_islantilla.json'

const DIACRITICOS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g')

function normalizar(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(DIACRITICOS, '')
}

const INDICE = lugaresData.map(l => ({
  lugar_id:      l.id,
  display:       l.nombre,
  textoBusqueda: normalizar(l.nombre),
  lat:           l.lat,
  lng:           l.lng,
}))

export default function BuscadorCasetas({ onSeleccionar }) {
  const [abierto, setAbierto] = useState(false)
  const [query,   setQuery]   = useState('')
  const inputRef = useRef(null)
  const panelRef = useRef(null)

  const resultados = useMemo(() => {
    const q = normalizar(query).trim()
    if (!q) return []
    const tokens = q.split(/\s+/)
    return INDICE
      .filter(item => tokens.every(t => item.textoBusqueda.includes(t)))
      .slice(0, 9)
  }, [query])

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
        aria-label="Buscar lugar"
        title="Buscar lugar"
      >
        <Search size={20} strokeWidth={2} />
      </button>

      {abierto && (
        <>
          <div className="buscador-backdrop" onClick={() => setAbierto(false)} />

          <div className="buscador-panel" ref={panelRef}>
            <input
              ref={inputRef}
              className="buscador-input"
              type="search"
              placeholder="Chiringuito, bar, playa…"
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
                    key={item.lugar_id}
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
