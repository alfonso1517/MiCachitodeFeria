import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function NombreModal({ onGuardar, onCerrar }) {
  const [nombre,   setNombre]   = useState('')
  const [cargando, setCargando] = useState(false)
  const [error,    setError]    = useState(null)

  async function handleGuardar(e) {
    e.preventDefault()
    const trimmed = nombre.trim()

    if (trimmed.length < 2)  { setError('El nombre debe tener al menos 2 caracteres'); return }
    if (trimmed.length > 30) { setError('El nombre no puede superar los 30 caracteres'); return }

    setCargando(true)
    setError(null)

    const { data, error } = await supabase.auth.updateUser({
      data: { display_name: trimmed },
    })

    setCargando(false)

    if (error) {
      setError('Algo salió mal. Inténtalo de nuevo.')
      return
    }

    onGuardar(data.user)
  }

  return (
    <div className="auth-overlay" onClick={onCerrar}>
      <div className="auth-panel" onClick={e => e.stopPropagation()}>

        <h2 className="auth-titulo">¿Cómo te llamas?</h2>
        <p className="auth-subtitulo">
          Tu nombre aparecerá en las celdas que reclames.
        </p>

        <form onSubmit={handleGuardar} className="auth-form">
          <input
            type="text"
            placeholder="Tu nombre en la feria"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            maxLength={30}
            className="auth-input"
            autoFocus
            required
          />
          <button
            type="submit"
            className="btn-entra auth-btn"
            disabled={cargando}
          >
            {cargando ? 'Guardando…' : '¡Este es mi nombre!'}
          </button>
        </form>

        {error && <p className="auth-error">{error}</p>}

      </div>
    </div>
  )
}
