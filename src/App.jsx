import MapaFeria from './components/MapaFeria'
import './App.css'

export default function App() {
  return (
    <div id="app">

      {/* Header flotante: se queda fijo arriba mientras el mapa es scrollable */}
      <header id="header">
        <span className="header-logo">MiCachoDeFeria</span>

        {/* Botón de login — vacío por ahora, se conecta en Fase 4 */}
        <button className="btn-entra">Entra</button>
      </header>

      {/* Contenedor del mapa: ocupa todo el viewport */}
      <div id="mapa-wrapper">
        <MapaFeria />
      </div>

    </div>
  )
}
