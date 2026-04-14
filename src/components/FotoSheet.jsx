export default function FotoSheet({ celda, onCerrar }) {
  return (
    <div className="bs-overlay" onClick={onCerrar}>
      <div className="bs-panel fs-panel" onClick={e => e.stopPropagation()}>

        <div className="bs-handle" />

        <img
          src={celda.image_url}
          className="fs-foto"
          alt={`Foto de ${celda.owner_name || 'Anónimo'}`}
        />

        <div className="fs-texto">
          <p className="fs-nombre">{celda.owner_name || 'Anónimo'}</p>
          {celda.pie_de_foto && <p className="fs-pie">{celda.pie_de_foto}</p>}
          <button className="btn-entra fs-cerrar" onClick={onCerrar}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  )
}
