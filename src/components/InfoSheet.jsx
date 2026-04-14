export default function InfoSheet({ onCerrar }) {
  return (
    <div className="bs-overlay" onClick={onCerrar}>
      <div className="bs-panel" onClick={e => e.stopPropagation()}>

        <div className="bs-handle" />

        <h2 className="auth-titulo">¿Cómo funciona<br />MiCachoDeFeria?</h2>

        <p className="info-intro">
          Un mapa colectivo de la Feria 2026.
        </p>

        <ul className="info-lista">
          <li>Toca cualquier <strong>cacho libre</strong> del Real.</li>
          <li>Sube una foto tuya allí: con tu gente, tu caseta, lo que quieras.</li>
          <li>Ponle pie de foto y tu nombre.</li>
          <li>Entre todos montamos el <strong>mosaico de la feria</strong>.</li>
        </ul>

        <p className="info-cierre">¡Lánzate!</p>

        <button className="btn-entra bs-reclamar" onClick={onCerrar}>
          Entendido
        </button>

      </div>
    </div>
  )
}
