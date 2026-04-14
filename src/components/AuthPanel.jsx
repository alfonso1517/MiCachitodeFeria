import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Panel de login con magic link.
// El usuario solo necesita su email — Supabase le manda un enlace y ya está.
export default function AuthPanel({ onCerrar }) {
  const [email,   setEmail]   = useState('')
  const [enviado, setEnviado] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleEnviar(e) {
    e.preventDefault()
    if (!email.trim()) return
    setCargando(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // Redirige aquí tras hacer click en el enlace del email
        emailRedirectTo: window.location.origin,
      },
    })

    setCargando(false)
    if (error) {
      setError('Algo salió mal. Revisa el email e inténtalo de nuevo.')
    } else {
      setEnviado(true)
    }
  }

  return (
    // Fondo oscuro que cierra el panel al tocar fuera
    <div className="auth-overlay" onClick={onCerrar}>
      <div className="auth-panel" onClick={e => e.stopPropagation()}>

        {!enviado ? (
          <>
            <h2 className="auth-titulo">Entra a la feria</h2>
            <p className="auth-subtitulo">
              Te mandamos un enlace a tu correo. Sin contraseña, sin rollos.
            </p>

            <form onSubmit={handleEnviar} className="auth-form">
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="auth-input"
                autoFocus
                required
              />
              <button
                type="submit"
                className="btn-entra auth-btn"
                disabled={cargando}
              >
                {cargando ? 'Enviando…' : 'Mándame el enlace'}
              </button>
            </form>

            {error && <p className="auth-error">{error}</p>}
          </>
        ) : (
          <>
            <div className="auth-check">📬</div>
            <h2 className="auth-titulo">¡Revisa tu correo!</h2>
            <p className="auth-subtitulo">
              Te hemos mandado un enlace a <strong>{email}</strong>.
              Ábrelo y estarás dentro.
            </p>
            <button className="btn-entra auth-btn" onClick={onCerrar}>
              Entendido
            </button>
          </>
        )}

      </div>
    </div>
  )
}
