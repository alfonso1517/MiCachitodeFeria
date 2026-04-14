import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Comprime la imagen antes de subirla: máx 1200px en cualquier dimensión, JPEG 0.82
// Evita subir fotos de 8MB desde el móvil
async function comprimirImagen(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1200
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else                { width  = Math.round(width  * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.82)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

export default function BottomSheet({ celda, usuario, onCerrar, onReclamada }) {
  const [foto,      setFoto]      = useState(null)
  const [preview,   setPreview]   = useState(null)
  const [pieDeFoto, setPieDeFoto] = useState('')
  const [cargando,  setCargando]  = useState(false)
  const [error,     setError]     = useState(null)
  const inputRef = useRef(null)

  function handleFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setFoto(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleReclamar() {
    if (!foto) return
    setCargando(true)
    setError(null)

    try {
      // 1. Comprimir imagen en cliente
      const blob = await comprimirImagen(foto)

      // 2. Subir a Supabase Storage
      const fileName = `${usuario.id}/${celda.row}-${celda.col}-${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('celda-images')
        .upload(fileName, blob, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      // 3. Obtener URL pública de la imagen
      const { data: { publicUrl } } = supabase.storage
        .from('celda-images')
        .getPublicUrl(fileName)

      // 4. Guardar celda en la BD
      const ownerName = usuario.user_metadata?.display_name
                     ?? usuario.user_metadata?.name
                     ?? 'Anónimo'
      const { error: dbError } = await supabase.from('celdas').insert({
        row:         celda.row,
        col:         celda.col,
        owner_id:    usuario.id,
        owner_name:  ownerName,
        image_url:   publicUrl,
        pie_de_foto: pieDeFoto.trim() || null,
      })
      if (dbError) throw dbError

      // 5. Notificar al mapa y cerrar
      onReclamada({
        row:         celda.row,
        col:         celda.col,
        owner_name:  ownerName,
        image_url:   publicUrl,
        pie_de_foto: pieDeFoto.trim() || null,
      })
      onCerrar()

    } catch (err) {
      setError('Algo salió mal. Inténtalo de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="bs-overlay" onClick={onCerrar}>
      <div className="bs-panel" onClick={e => e.stopPropagation()}>

        {/* Tirador visual */}
        <div className="bs-handle" />

        <h2 className="bs-titulo">¡Este cacho es tuyo!</h2>
        <p className="bs-subtitulo">
          Hazte una foto aquí mismo o elige una de la galería.
        </p>

        {/* Input de imagen oculto — abre cámara en móvil */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFoto}
          style={{ display: 'none' }}
        />

        {preview ? (
          <div className="bs-preview-wrapper">
            <img src={preview} className="bs-preview" alt="preview" />
            <button
              className="bs-cambiar"
              onClick={() => inputRef.current.click()}
            >
              Cambiar foto
            </button>
          </div>
        ) : (
          <button
            className="bs-foto-btn"
            onClick={() => inputRef.current.click()}
          >
            <span className="bs-foto-icono">📷</span>
            <span>Enséñanos tu feria</span>
          </button>
        )}

        {/* Pie de foto — solo aparece cuando hay foto seleccionada */}
        {foto && (
          <input
            type="text"
            placeholder="Un pie de foto (opcional)"
            value={pieDeFoto}
            onChange={e => setPieDeFoto(e.target.value)}
            maxLength={80}
            className="bs-pie-input"
          />
        )}

        {error && <p className="bs-error">{error}</p>}

        <button
          className="btn-entra bs-reclamar"
          onClick={handleReclamar}
          disabled={!foto || cargando}
        >
          {cargando ? 'Reclamando…' : '¡Este cacho es mío!'}
        </button>

      </div>
    </div>
  )
}
