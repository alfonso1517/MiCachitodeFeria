import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import MapaFeria from './components/MapaFeria'
import NombreModal from './components/NombreModal'
import ConfirmarCelda from './components/ConfirmarCelda'
import BottomSheet from './components/BottomSheet'
import FotoSheet from './components/FotoSheet'
import InfoSheet from './components/InfoSheet'
import './App.css'

const INFO_KEY = 'micacho_info_visto'

function formatDireccion({ street, number, name } = {}) {
  const partes = [street, number].filter(Boolean).join(', ')
  return name ? `${partes} — ${name}` : partes
}

export default function App() {
  const [usuario,           setUsuario]           = useState(null)
  const [celdaPendiente,    setCeldaPendiente]    = useState(null)
  const [celdaSeleccionada, setCeldaSeleccionada] = useState(null)
  const [pendingCelda,      setPendingCelda]      = useState(null)
  const [celdaVista,        setCeldaVista]        = useState(null)
  const [refrescar,         setRefrescar]         = useState(0)
  const [mostrarNombre,     setMostrarNombre]     = useState(false)
  // Abre automáticamente en la primera visita
  const [mostrarInfo,       setMostrarInfo]       = useState(
    () => !localStorage.getItem(INFO_KEY)
  )

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUsuario(session.user)
      } else {
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

  function cerrarInfo() {
    localStorage.setItem(INFO_KEY, 'true')
    setMostrarInfo(false)
  }

  function handleCeldaSeleccionada(celda) {
    setCeldaPendiente(celda)
  }

  function handleConfirmar() {
    const celda = celdaPendiente
    setCeldaPendiente(null)
    const tieneNombre = usuario?.user_metadata?.display_name
    if (!tieneNombre) {
      setPendingCelda(celda)
      setMostrarNombre(true)
    } else {
      setCeldaSeleccionada(celda)
    }
  }

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
        <div className="header-logo-wrap">
          <img src="/logo_mcdf.png" alt="MiCachoDeFeria" className="logo-img" />
        </div>

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

      {/* Botón de información flotante */}
      <button className="btn-info" onClick={() => setMostrarInfo(true)} title="¿Cómo funciona?">
        <i>i</i>
      </button>

      <div id="mapa-wrapper">
        <MapaFeria
          usuario={usuario}
          onCeldaSeleccionada={handleCeldaSeleccionada}
          onCeldaVista={setCeldaVista}
          refrescar={refrescar}
        />
      </div>

      {mostrarInfo && <InfoSheet onCerrar={cerrarInfo} />}

      {celdaPendiente && (
        <ConfirmarCelda
          onConfirmar={handleConfirmar}
          onCerrar={() => setCeldaPendiente(null)}
          direccion={formatDireccion(celdaPendiente)}
        />
      )}

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
