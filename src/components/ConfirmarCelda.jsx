import { useEffect } from 'react'

const MAX_FOTOS = 10

export default function ConfirmarCelda({ onConfirmar, onCerrar, direccion, fotoCount = 0, sinLimite = false }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCerrar])

  return (
    <div className="cc-overlay" onClick={onCerrar}>
      <div className="cc-panel" onClick={e => e.stopPropagation()}>

        <div className="bs-handle" />

        {fotoCount > 0 && !sinLimite ? (
          <>
            <p className="cc-pregunta">¿Añadir tu foto?</p>
            <p className="cc-fotos-contador">{fotoCount}/{MAX_FOTOS} fotos ya subidas</p>
          </>
        ) : (
          <p className="cc-pregunta">¿Reclamar este cacho?</p>
        )}
        {direccion && <p className="cc-direccion">{direccion}</p>}

        <button className="btn-entra cc-btn" onClick={onConfirmar}>
          Sí, subir foto
        </button>

      </div>
    </div>
  )
}
