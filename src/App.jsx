import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import MapaFeria from './components/MapaFeria'
import AuthPanel from './components/AuthPanel'
import BottomSheet from './components/BottomSheet'
import FotoSheet from './components/FotoSheet'
import './App.css'

export default function App() {
  const [usuario,           setUsuario]           = useState(null)
  const [mostrarAuth,       setMostrarAuth]       = useState(false)
  const [celdaSeleccionada, setCeldaSeleccionada] = useState(null)
  const [celdaVista,        setCeldaVista]        = useState(null)
  const [refrescar,         setRefrescar]         = useState(0)

  // Escuchar cambios de sesión: login, logout y redirección desde magic link
  useEffect(() => {
    // Sesión activa al cargar (por si ya estaba logueado)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null)
    })

    // Escuchar cualquier cambio posterior (login via magic link, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUsuario(session?.user ?? null)
        // Si acaba de entrar, cerrar el panel de login
        if (session?.user) setMostrarAuth(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  // Nombre a mostrar: usa el metadata si existe, si no el email antes del @
  const nombreUsuario = usuario?.user_metadata?.name
    ?? usuario?.email?.split('@')[0]
    ?? ''

  return (
    <div id="app">

      <header id="header">
        <span className="header-logo">MiCachoDeFeria</span>

        {usuario ? (
          // Usuario logueado: nombre + botón de salir
          <div className="header-usuario">
            <span className="header-nombre">{nombreUsuario}</span>
            <button className="btn-salir" onClick={handleLogout}>Salir</button>
          </div>
        ) : (
          // No logueado: botón de entrar
          <button className="btn-entra" onClick={() => setMostrarAuth(true)}>
            Entra
          </button>
        )}
      </header>

      <div id="mapa-wrapper">
        <MapaFeria
          usuario={usuario}
          onCeldaSeleccionada={setCeldaSeleccionada}
          onCeldaVista={setCeldaVista}
          refrescar={refrescar}
        />
      </div>

      {/* Panel de login — solo visible cuando se pulsa "Entra" */}
      {mostrarAuth && (
        <AuthPanel onCerrar={() => setMostrarAuth(false)} />
      )}

      {/* Bottom sheet para reclamar una celda */}
      {celdaVista && (
        <FotoSheet
          celda={celdaVista}
          onCerrar={() => setCeldaVista(null)}
        />
      )}

      {celdaSeleccionada && usuario && (
        <BottomSheet
          celda={celdaSeleccionada}
          usuario={usuario}
          onCerrar={() => setCeldaSeleccionada(null)}
          onReclamada={() => {
            setCeldaSeleccionada(null)
            setRefrescar(r => r + 1)
          }}
        />
      )}

    </div>
  )
}
