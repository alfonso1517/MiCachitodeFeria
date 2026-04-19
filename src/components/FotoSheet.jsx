import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function formatDireccion({ street, number, name } = {}) {
  const partes = [street, number].filter(Boolean).join(', ')
  return name ? `${partes} — ${name}` : partes
}

const DIAS  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function formatFecha(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const dia  = DIAS[d.getDay()]
  const num  = d.getDate()
  const mes  = MESES[d.getMonth()]
  const h    = String(d.getHours()).padStart(2, '0')
  const m    = String(d.getMinutes()).padStart(2, '0')
  return `${dia} ${num} ${mes} · ${h}:${m}`
}

function tiempoRelativo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)    return 'ahora mismo'
  if (diff < 3600)  return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return `hace ${Math.floor(diff / 86400)} d`
}

const MAX_COMENTARIOS = 50

// celda = { fotos, row, col, street, number, name }
export default function FotoSheet({ celda, usuario, onCerrar }) {
  const direccion = formatDireccion(celda)
  const fotos = celda.fotos ?? []
  const total = fotos.length

  // ── Carrusel ──────────────────────────────────────────────────────────────
  const [idx, setIdx] = useState(0)
  const scrollRef = useRef(null)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    setIdx(Math.round(el.scrollLeft / el.offsetWidth))
  }

  const fotoActual = fotos[idx] ?? fotos[0]

  // ── Comentarios ───────────────────────────────────────────────────────────
  const [comentarios,  setComentarios]  = useState([])
  const [textoNuevo,   setTextoNuevo]   = useState('')
  const [enviando,     setEnviando]     = useState(false)
  const listaRef = useRef(null)

  useEffect(() => {
    if (celda.row == null || celda.col == null) return
    supabase
      .from('comentarios')
      .select('id, owner_name, texto, created_at')
      .eq('celda_row', celda.row)
      .eq('celda_col', celda.col)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setComentarios(data)
      })
  }, [celda.row, celda.col])

  // Scroll al final al cargar
  useEffect(() => {
    if (listaRef.current && comentarios.length > 0) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight
    }
  }, [comentarios.length])

  async function enviarComentario() {
    const texto = textoNuevo.trim()
    if (!texto || !usuario || enviando) return
    if (comentarios.length >= MAX_COMENTARIOS) return
    setEnviando(true)
    const ownerName = usuario.user_metadata?.display_name ?? 'Anónimo'
    const { data, error } = await supabase
      .from('comentarios')
      .insert({
        celda_row:  celda.row,
        celda_col:  celda.col,
        owner_id:   usuario.id,
        owner_name: ownerName,
        texto,
      })
      .select()
      .single()
    setEnviando(false)
    if (!error && data) {
      setComentarios(prev => [...prev, data])
      setTextoNuevo('')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarComentario()
    }
  }

  return (
    <div className="bs-overlay" onClick={onCerrar}>
      <div className="bs-panel fs-panel" onClick={e => e.stopPropagation()}>

        <div className="bs-handle" />

        {/* Carrusel */}
        <div className="fs-carrusel" ref={scrollRef} onScroll={handleScroll}>
          {fotos.map((foto, i) => (
            <div key={i} className="fs-slide">
              <img
                src={foto.image_url}
                className="fs-foto"
                alt={`Foto de ${foto.owner_name || 'Anónimo'}`}
              />
            </div>
          ))}
        </div>

        {total > 1 && (
          <p className="fs-contador">{idx + 1} / {Math.min(total, 10)} fotos</p>
        )}

        {/* Info de la foto actual */}
        <div className="fs-info">
          <div className="fs-info-fila">
            {fotoActual && (
              <span className="fs-nombre">{fotoActual.owner_name || 'Anónimo'}</span>
            )}
            <button className="fs-cerrar-x" onClick={onCerrar} aria-label="Cerrar">✕</button>
          </div>
          {fotoActual?.pie_de_foto && <p className="fs-pie">{fotoActual.pie_de_foto}</p>}
          {fotoActual?.claimed_at && <p className="fs-fecha">{formatFecha(fotoActual.claimed_at)}</p>}
          {direccion && <p className="fs-direccion">{direccion}</p>}
        </div>

        {/* Sección de comentarios */}
        <div className="fs-comentarios">
          <p className="fs-comentarios-titulo">Comentarios</p>

          <div className="fs-comentarios-lista" ref={listaRef}>
            {comentarios.length === 0 ? (
              <p className="fs-comentarios-vacio">Sé el primero en comentar</p>
            ) : (
              comentarios.map(c => (
                <div key={c.id} className="fs-comentario">
                  <div className="fs-comentario-meta">
                    <span className="fs-comentario-autor">{c.owner_name || 'Anónimo'}</span>
                    <span className="fs-comentario-tiempo">{tiempoRelativo(c.created_at)}</span>
                  </div>
                  <p className="fs-comentario-texto">{c.texto}</p>
                </div>
              ))
            )}
          </div>

          {usuario && (
            <div className="fs-comentario-input">
              <input
                className="fs-comentario-field"
                type="text"
                placeholder="Escribe un comentario…"
                value={textoNuevo}
                onChange={e => setTextoNuevo(e.target.value.slice(0, 200))}
                onKeyDown={handleKeyDown}
                maxLength={200}
              />
              <button
                className="fs-comentario-enviar"
                onClick={enviarComentario}
                disabled={!textoNuevo.trim() || enviando}
              >
                {enviando ? '…' : 'Enviar'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
