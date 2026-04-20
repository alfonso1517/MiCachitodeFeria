export default function InfoSheet({ onCerrar }) {
  return (
    <div className="bs-overlay" onClick={onCerrar}>
      <div className="bs-panel" onClick={e => e.stopPropagation()}>

        <div className="bs-handle" />

        <h2 className="auth-titulo">¡Bienvenido a<br />MiCachoDeFeria!</h2>

        <p className="info-intro">
          Entre todos vamos a construir el <strong>mosaico fotográfico de la Feria de Sevilla 2026</strong>.
        </p>

        <p className="info-como">¿Cómo funciona?</p>

        <p className="info-texto">
          Busca tu caseta por nombre, calle o número, o simplemente tócala en el mapa.
          Pulsa <strong>"Subir Foto"</strong> y elige tu caseta. Cada caseta admite todas las fotos que quieras — ¡deja tu huella!
        </p>

        <p className="info-cierre">¡A por tu cacho de feria!</p>

        <button className="btn-entra bs-reclamar" onClick={onCerrar}>
          Entendido
        </button>

      </div>
    </div>
  )
}
