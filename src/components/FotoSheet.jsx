import { useState, useRef } from 'react'

function formatDireccion({ street, number, name } = {}) {
  const partes = [street, number].filter(Boolean).join(', ')
  return name ? `${partes} — ${name}` : partes
}

const MAX_FOTOS = 10

// celda = { fotos: [{owner_name, image_url, pie_de_foto, claimed_at}], street, number, name }
export default function FotoSheet({ celda, onCerrar }) {
  const direccion = formatDireccion(celda)
  const fotos = celda.fotos ?? []
  const total = fotos.length

  const [idx, setIdx] = useState(0)
  const scrollRef = useRef(null)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    setIdx(Math.round(el.scrollLeft / el.offsetWidth))
  }

  const fotoActual = fotos[idx] ?? fotos[0]

  return (
    <div className="bs-overlay" onClick={onCerrar}>
      <div className="bs-panel fs-panel" onClick={e => e.stopPropagation()}>

        <div className="bs-handle" />

        {/* Carrusel */}
        <div className="fs-carrusel" ref={scrollRef} onScroll={handleScroll}>
          {fotos.map((foto, i) => (
            <div key={i} className="fs-slide">
              <img
                src={foto.image_url}
                className="fs-foto"
                alt={`Foto de ${foto.owner_name || 'Anónimo'}`}
              />
            </div>
          ))}
        </div>

        {/* Contador de fotos */}
        {total > 1 && (
          <p className="fs-contador">{idx + 1} / {Math.min(total, MAX_FOTOS)} fotos</p>
        )}

        <div className="fs-texto">
          {fotoActual && (
            <>
              <p className="fs-nombre">{fotoActual.owner_name || 'Anónimo'}</p>
              {fotoActual.pie_de_foto && <p className="fs-pie">{fotoActual.pie_de_foto}</p>}
            </>
          )}
          {direccion && <p className="fs-direccion">{direccion}</p>}
          <button className="btn-entra fs-cerrar" onClick={onCerrar}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  )
}
