import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import MapaFeria from './components/MapaFeria'
import NombreModal from './components/NombreModal'
import ConfirmarCelda from './components/ConfirmarCelda'
import BottomSheet from './components/BottomSheet'
import FotoSheet from './components/FotoSheet'
import InfoSheet from './components/InfoSheet'
import BuscadorCasetas from './components/BuscadorCasetas'
import './App.css'

const INFO_KEY = 'micacho_info_visto'

function esIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
}

function estaInstalada() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

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
  const [mostrarInfo,       setMostrarInfo]       = useState(
    () => !localStorage.getItem(INFO_KEY)
  )
  const [celdaResaltada,    setCeldaResaltada]    = useState(null)
  const [toastVisible,      setToastVisible]      = useState(false)
  const toastTimerRef = useRef(null)

  // PWA install
  const [deferredPrompt,    setDeferredPrompt]    = useState(null)
  const [mostrarGuiaIOS,    setMostrarGuiaIOS]    = useState(false)
  const [mostrarBtnPWA,     setMostrarBtnPWA]     = useState(false)

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

  // PWA: mostrar botón si no está instalada
  useEffect(() => {
    if (estaInstalada()) return

    if (esIOS()) {
      setMostrarBtnPWA(true)
      return
    }

    function onBeforeInstallPrompt(e) {
      e.preventDefault()
      setDeferredPrompt(e)
      setMostrarBtnPWA(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  async function handleInstalarApp() {
    if (esIOS()) {
      setMostrarGuiaIOS(true)
      return
    }
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setMostrarBtnPWA(false)
    setDeferredPrompt(null)
  }

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

  function handleSubirFoto() {
    const tieneNombre = usuario?.user_metadata?.display_name
    if (!tieneNombre) {
      setMostrarNombre(true)
      return
    }
    // Mostrar toast guía
    setToastVisible(true)
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 3000)
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

      {/* Botones flotantes independientes */}
      {mostrarBtnPWA && (
        <button className="btn-pwa" onClick={handleInstalarApp} aria-label="Instalar app">
          App
        </button>
      )}
      <BuscadorCasetas onSeleccionar={item => setCeldaResaltada(item)} />
      <button className="btn-subir-foto" onClick={handleSubirFoto} aria-label="Subir foto">
        📷 Subir Foto
      </button>

      {/* Toast guía */}
      {toastVisible && (
        <div className="toast-guia">
          ¡Busca tu caseta o tócala en el mapa!
        </div>
      )}

      <div id="mapa-wrapper">
        <MapaFeria
          usuario={usuario}
          onCeldaSeleccionada={handleCeldaSeleccionada}
          onCeldaVista={setCeldaVista}
          refrescar={refrescar}
          celdaResaltada={celdaResaltada}
        />
      </div>

      {mostrarInfo && <InfoSheet onCerrar={cerrarInfo} />}

      {/* Guía de instalación iOS */}
      {mostrarGuiaIOS && (
        <div className="bs-overlay" onClick={() => setMostrarGuiaIOS(false)}>
          <div className="bs-panel pwa-guia-panel" onClick={e => e.stopPropagation()}>
            <div className="bs-handle" />
            <h2 className="bs-titulo">Añadir a tu móvil</h2>
            <p className="pwa-guia-paso">
              <span className="pwa-guia-num">1</span>
              Pulsa el botón <strong>Compartir</strong> de Safari
              <span className="pwa-guia-icono"> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></span>
            </p>
            <p className="pwa-guia-paso">
              <span className="pwa-guia-num">2</span>
              Selecciona <strong>"Añadir a pantalla de inicio"</strong>
            </p>
            <p className="pwa-guia-paso">
              <span className="pwa-guia-num">3</span>
              Pulsa <strong>"Añadir"</strong> y ¡listo!
            </p>
            <button className="btn-entra bs-reclamar" onClick={() => setMostrarGuiaIOS(false)}>
              Entendido
            </button>
          </div>
        </div>
      )}

      {celdaPendiente && (
        <ConfirmarCelda
          onConfirmar={handleConfirmar}
          onCerrar={() => setCeldaPendiente(null)}
          direccion={formatDireccion(celdaPendiente)}
          fotoCount={celdaPendiente.fotoCount ?? 0}
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
          usuario={usuario}
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
