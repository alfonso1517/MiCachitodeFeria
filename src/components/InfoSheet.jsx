export default function InfoSheet({ onCerrar }) {
  return (
    <div className="bs-overlay" onClick={onCerrar}>
      <div className="bs-panel" onClick={e => e.stopPropagation()}>

        <div className="bs-handle" />

        <h2 className="auth-titulo">¡Bienvenido a<br />MiCachoDe Islantilla!</h2>

        <p className="info-intro">
          Entre todos vamos a construir el <strong>mosaico fotográfico del verano en Islantilla y La Antilla</strong>.
        </p>

        <p className="info-como">¿Cómo funciona?</p>

        <p className="info-texto">
          Busca tu chiringuito, bar o playa por nombre, o simplemente tócalo en el mapa.
          Pulsa <strong>"Subir Foto"</strong> y elige el lugar. Cada lugar admite todas las fotos que quieras — ¡deja tu huella!
        </p>

        <p className="info-cierre">¡A por tu cacho de verano!</p>

        <button className="btn-entra bs-reclamar" onClick={onCerrar}>
          Entendido
        </button>

      </div>
    </div>
  )
}
