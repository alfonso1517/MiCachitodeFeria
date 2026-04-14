import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import MapaFeria from './components/MapaFeria'
import NombreModal from './components/NombreModal'
import BottomSheet from './components/BottomSheet'
import FotoSheet from './components/FotoSheet'
import './App.css'

export default function App() {
  const [usuario,           setUsuario]           = useState(null)
  const [celdaSeleccionada, setCeldaSeleccionada] = useState(null)
  const [pendingCelda,      setPendingCelda]      = useState(null)   // espera a que el usuario ponga nombre
  const [celdaVista,        setCeldaVista]        = useState(null)
  const [refrescar,         setRefrescar]         = useState(0)
  const [mostrarNombre,     setMostrarNombre]     = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUsuario(session.user)
      } else {
        // Sin sesión → crear usuario anónimo automáticamente
        supabase.auth.signInAnonymously().then(({ data, error }) => {
          if (!error) setUsuario(data.user)
        })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUsuario(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Cuando el usuario toca una celda libre:
  // si aún no tiene nombre → pedir nombre primero, luego abrir BottomSheet
  function handleCeldaSeleccionada(celda) {
    const tieneNombre = usuario?.user_metadata?.display_name
    if (!tieneNombre) {
      setPendingCelda(celda)
      setMostrarNombre(true)
    } else {
      setCeldaSeleccionada(celda)
    }
  }

  // Cuando el usuario guarda su nombre en el modal
  function handleNombreGuardado(updatedUser) {
    setUsuario(updatedUser)
    setMostrarNombre(false)
    if (pendingCelda) {
      setCeldaSeleccionada(pendingCelda)
      setPendingCelda(null)
    }
  }

  const displayName = usuario?.user_metadata?.display_name ?? null

  return (
    <div id="app">

      <header id="header">
        <span className="header-logo">MiCachoDeFeria</span>

        <div className="header-usuario">
          {displayName ? (
            <>
              <span className="header-nombre">{displayName}</span>
              <button
                className="btn-editar-nombre"
                onClick={() => setMostrarNombre(true)}
                title="Cambiar nombre"
              >✎</button>
            </>
          ) : (
            <button className="btn-entra" onClick={() => setMostrarNombre(true)}>
              Pon tu nombre
            </button>
          )}
        </div>
      </header>

      <div id="mapa-wrapper">
        <MapaFeria
          usuario={usuario}
          onCeldaSeleccionada={handleCeldaSeleccionada}
          onCeldaVista={setCeldaVista}
          refrescar={refrescar}
        />
      </div>

      {mostrarNombre && (
        <NombreModal
          onGuardar={handleNombreGuardado}
          onCerrar={() => {
            setMostrarNombre(false)
            setPendingCelda(null)
          }}
        />
      )}

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
