import { useEffect } from 'react'

export default function ConfirmarCelda({ onConfirmar, onCerrar, direccion }) {
  // Escape cierra el popup (accesibilidad desktop)
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

        <p className="cc-pregunta">¿Reclamar este cacho?</p>
        {direccion && <p className="cc-direccion">{direccion}</p>}

        <button className="btn-entra cc-btn" onClick={onConfirmar}>
          Sí, subir foto
        </button>

      </div>
    </div>
  )
}
