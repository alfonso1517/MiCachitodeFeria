function formatDireccion({ street, number, name } = {}) {
  const partes = [street, number].filter(Boolean).join(', ')
  return name ? `${partes} — ${name}` : partes
}

export default function FotoSheet({ celda, onCerrar }) {
  const direccion = formatDireccion(celda)

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
          {direccion && <p className="fs-direccion">{direccion}</p>}
          {celda.pie_de_foto && <p className="fs-pie">{celda.pie_de_foto}</p>}
          <button className="btn-entra fs-cerrar" onClick={onCerrar}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  )
}
