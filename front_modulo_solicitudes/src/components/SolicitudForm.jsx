import { useState } from 'react'
import { solicitudService } from '../services/solicitudService'
import { MODULOS_SISTEMA } from './modulos'

const INIT = { modulo_origen: '', modulo_destino: '', titulo: '', mensaje: '', prioridad: 'media' }

export default function SolicitudForm({ onCreated }) {
  const [form, setForm] = useState(INIT)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  function validate() {
    const e = {}
    if (!form.modulo_origen) e.modulo_origen = 'Requerido'
    if (!form.modulo_destino) e.modulo_destino = 'Requerido'
    if (form.modulo_origen && form.modulo_origen === form.modulo_destino) e.modulo_destino = 'Debe ser distinto al origen'
    if (!form.titulo.trim()) e.titulo = 'Requerido'
    if (!form.mensaje.trim()) e.mensaje = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMsg(null)
    if (!validate()) return
    setLoading(true)
    try {
      const result = await solicitudService.crear(form)
      setMsg({ ok: true, text: 'Solicitud enviada correctamente.' })
      setForm(INIT)
      onCreated?.(result)
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <div className="panel-soft" style={{ marginBottom: 18, padding: '18px 18px' }}>
        <div className="ui-eyebrow" style={{ margin: 0 }}>Nueva</div>
        <h2 style={{ margin: 0, fontFamily: '"Cormorant Garamond"', fontSize: 32, lineHeight: 1.05 }}>Enviar solicitud</h2>
        <p className="dim" style={{ margin: '6px 0 0', fontFamily: '"DM Mono"', fontSize: 11, letterSpacing: '0.08em' }}>
          Notifica a otro módulo sobre un requerimiento o incidencia.
        </p>
      </div>

      {msg && (
        <div className="animate-fade-in" style={{
          marginBottom: 24, padding: '12px 16px', borderRadius: 12,
          background: msg.ok ? 'var(--green-bg)' : 'var(--red-bg)',
          border: `1px solid ${msg.ok ? 'var(--green-bd)' : 'var(--red-bd)'}`,
          fontFamily: 'Outfit', fontSize: 14, fontWeight: 600,
          color: msg.ok ? 'var(--green)' : 'var(--red)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.5, fontSize: 18 }}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label className="lbl lbl-req">Módulo origen</label>
            <select
              className={errors.modulo_origen ? 'field field-error' : 'field'}
              name="modulo_origen"
              value={form.modulo_origen}
              onChange={handleChange}
            >
              <option value="">Seleccionar...</option>
              {MODULOS_SISTEMA.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            {errors.modulo_origen && <p className="err">{errors.modulo_origen}</p>}
          </div>
          <div>
            <label className="lbl lbl-req">Módulo destino</label>
            <select
              className={errors.modulo_destino ? 'field field-error' : 'field'}
              name="modulo_destino"
              value={form.modulo_destino}
              onChange={handleChange}
            >
              <option value="">Seleccionar...</option>
              {MODULOS_SISTEMA.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            {errors.modulo_destino && <p className="err">{errors.modulo_destino}</p>}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="lbl lbl-req">Título</label>
          <input
            className={errors.titulo ? 'field field-error' : 'field'}
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            placeholder="Ej: Falta repuesto para camión 12"
          />
          {errors.titulo && <p className="err">{errors.titulo}</p>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="lbl lbl-req">Mensaje</label>
          <textarea
            className={errors.mensaje ? 'field field-error' : 'field'}
            name="mensaje"
            rows={4}
            value={form.mensaje}
            onChange={handleChange}
            placeholder="Detalle de la solicitud..."
            style={{ resize: 'none', lineHeight: 1.5 }}
          />
          {errors.mensaje && <p className="err">{errors.mensaje}</p>}
        </div>

        <div style={{ marginBottom: 24 }}>
          <label className="lbl">Prioridad</label>
          <select className="field" name="prioridad" value={form.prioridad} onChange={handleChange}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="btn-blue" style={{ width: '100%', justifyContent: 'center', padding: '13px 0', fontSize: 14 }}>
          {loading ? 'Enviando...' : 'Enviar Solicitud'}
        </button>
      </form>
    </div>
  )
}
