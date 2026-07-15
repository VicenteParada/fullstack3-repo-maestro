import { useState, useEffect, useMemo } from 'react'
import { solicitudService } from '../services/solicitudService'
import { labelDeModulo } from './modulos'
import { decodeJWT } from '../../../shared_components/auth'

const BADGE_ESTADO = {
  pendiente: 'badge-amber',
  en_proceso: 'badge-blue',
  resuelta: 'badge-green',
  rechazada: 'badge-red',
}
const BADGE_PRIORIDAD = {
  baja: 'badge-blue',
  media: 'badge-amber',
  alta: 'badge-red',
}

export default function SolicitudList({ permiso }) {
  const [tab, setTab] = useState('recibidas')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [respuesta, setRespuesta] = useState('')
  const [misModulos, setMisModulos] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const payload = token ? decodeJWT(token) : null
    const permisos = payload?.permisos || {}
    setMisModulos(Object.keys(permisos).filter(k => permisos[k] === 'view' || permisos[k] === 'edit'))
  }, [])

  useEffect(() => { cargar() }, [estadoFiltro])

  async function cargar() {
    setLoading(true)
    try {
      const data = await solicitudService.obtenerTodos({ estado: estadoFiltro || undefined })
      setSolicitudes(Array.isArray(data) ? data : [])
    } catch (err) { alert(err.message) } finally { setLoading(false) }
  }

  const filtradas = useMemo(() => {
    return solicitudes.filter(s => tab === 'recibidas'
      ? misModulos.includes(s.modulo_destino)
      : misModulos.includes(s.modulo_origen))
  }, [solicitudes, tab, misModulos])

  async function cambiarEstado(id, estado, respuestaTexto) {
    try {
      const result = await solicitudService.actualizar(id, { estado, respuesta: respuestaTexto || undefined })
      setSolicitudes(prev => prev.map(s => s.id === id ? result : s))
      setExpandedId(null)
      setRespuesta('')
    } catch (err) { alert(err.message) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
      <span style={{ width: 18, height: 18, border: '2px solid #1a1f35', borderTopColor: '#3b82f6', borderRadius: '50%' }} className="animate-spin-slow" />
      <span style={{ fontFamily: '"DM Mono"', fontSize: 12, color: '#2e3a52', letterSpacing: '0.1em' }}>CARGANDO SOLICITUDES</span>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['recibidas', 'Recibidas'], ['enviadas', 'Enviadas']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={tab === id ? 'btn-blue' : 'btn-outline-seal'}
              style={{ padding: '8px 16px', fontSize: 12 }}
            >
              {label}
            </button>
          ))}
        </div>
        <select value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)} className="field field-sm" style={{ width: 200 }}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En proceso</option>
          <option value="resuelta">Resuelta</option>
          <option value="rechazada">Rechazada</option>
        </select>
      </div>

      {filtradas.length === 0 ? (
        <div className="panel-soft" style={{ padding: '48px 24px', textAlign: 'center', fontFamily: '"DM Mono"', fontSize: 12, color: '#1e2640', letterSpacing: '0.1em' }}>
          SIN SOLICITUDES {tab === 'recibidas' ? 'RECIBIDAS' : 'ENVIADAS'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtradas.map((s, i) => (
            <div key={s.id} className="panel-soft animate-fade-up" style={{ animationDelay: `${i * 30}ms`, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span className={`badge ${BADGE_PRIORIDAD[s.prioridad] || 'badge-blue'}`}>{s.prioridad?.toUpperCase()}</span>
                    <span className={`badge ${BADGE_ESTADO[s.estado] || 'badge-blue'}`}>{s.estado?.replace('_', ' ').toUpperCase()}</span>
                    <span className="dim" style={{ fontFamily: '"DM Mono"', fontSize: 10, letterSpacing: '0.08em' }}>
                      {labelDeModulo(s.modulo_origen)} → {labelDeModulo(s.modulo_destino)}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 15, margin: 0 }}>{s.titulo}</h3>
                  <p className="muted" style={{ margin: '4px 0 0', fontFamily: 'Outfit', fontSize: 13, lineHeight: 1.5 }}>{s.mensaje}</p>
                  {s.respuesta && (
                    <div style={{
                      marginTop: 10, padding: '10px 12px', borderRadius: 12,
                      background: 'var(--green-bg)', border: '1px solid var(--green-bd)',
                      fontFamily: '"DM Mono"', fontSize: 11, color: 'var(--green)', lineHeight: 1.5,
                    }}>
                      Respuesta: {s.respuesta}
                    </div>
                  )}
                  <p className="dim" style={{ margin: '8px 0 0', fontFamily: '"DM Mono"', fontSize: 10 }}>
                    {s.creado_por_nombre || s.creado_por_id} · {new Date(s.created_at).toLocaleString('es-CL')}
                  </p>
                </div>

                {tab === 'recibidas' && permiso === 'edit' && !['resuelta', 'rechazada'].includes(s.estado) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    {expandedId === s.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 240 }}>
                        <textarea
                          rows={2}
                          value={respuesta}
                          onChange={e => setRespuesta(e.target.value)}
                          placeholder="Respuesta..."
                          className="field"
                          style={{ resize: 'none' }}
                        />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => { setExpandedId(null); setRespuesta('') }} className="btn-ghost" style={{ padding: '6px 10px', fontSize: 11 }}>Cancelar</button>
                          <button onClick={() => cambiarEstado(s.id, 'rechazada', respuesta)} className="btn-danger" style={{ padding: '6px 10px', fontSize: 11 }}>Rechazar</button>
                          <button onClick={() => cambiarEstado(s.id, 'resuelta', respuesta)} className="btn-blue" style={{ padding: '6px 10px', fontSize: 11 }}>Resolver</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {s.estado === 'pendiente' && (
                          <button onClick={() => cambiarEstado(s.id, 'en_proceso')} className="btn-outline-seal" style={{ padding: '6px 10px', fontSize: 11 }}>
                            Tomar
                          </button>
                        )}
                        <button onClick={() => setExpandedId(s.id)} className="btn-blue" style={{ padding: '6px 10px', fontSize: 11 }}>
                          Responder
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
