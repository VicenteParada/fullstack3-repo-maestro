import { useState, useEffect } from 'react';
import { rendicionService } from '../services/rendicionService';
import { operacionService } from '../services/operacionService';
import { rrhhService } from '../services/rrhhService';

export default function RendicionForm({ onCreated }) {
  const [viajes, setViajes] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [viajeId, setViajeId] = useState('');
  const [monto, setMonto] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      operacionService.obtenerViajes(),
      operacionService.obtenerRutas(),
      rrhhService.obtenerPersonal(),
    ]).then(([v, r, p]) => {
      setViajes(v.filter(x => x.conductor_id));
      setRutas(r);
      setPersonal(p);
    }).catch(err => setError('Error cargando datos base: ' + err.message));
  }, []);

  const viajeSeleccionado = viajes.find(v => v.id === parseInt(viajeId));
  const rutaDelViaje = viajeSeleccionado?.ruta_id ? rutas.find(r => r.id === viajeSeleccionado.ruta_id) : null;
  const conductorDelViaje = viajeSeleccionado ? personal.find(p => p.id === viajeSeleccionado.conductor_id) : null;

  useEffect(() => {
    // Al elegir un viaje, sugiere el monto base de su ruta (si tiene) — el
    // usuario lo puede aumentar, nunca bajarlo por debajo del base.
    if (rutaDelViaje) setMonto(String(rutaDelViaje.monto_base));
    else if (viajeSeleccionado) setMonto('');
  }, [viajeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!viajeId) {
      setError('Seleccione un viaje.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        viaje_id: parseInt(viajeId),
        monto: monto ? parseFloat(monto) : null,
        comentarios: comentarios || null,
      };
      const creada = await rendicionService.crear(payload);
      setSuccess(`Solicitud de rendición #${creada.id} creada por $${creada.monto.toLocaleString()}.`);
      setViajeId('');
      setMonto('');
      setComentarios('');
      onCreated?.(creada);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Solicitar Rendición</h2>
      <p className="text-slate-500 text-sm mb-6">Solo se puede pedir rendición para un viaje ya creado y con conductor asignado.</p>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Viaje</label>
          <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" value={viajeId} onChange={(e) => setViajeId(e.target.value)} required>
            <option value="">Seleccione un viaje...</option>
            {viajes.map(v => {
              const conductor = personal.find(p => p.id === v.conductor_id);
              const nombreConductor = conductor ? `${conductor.nombre} ${conductor.apellido1}` : v.conductor_nombre || `#${v.conductor_id}`;
              const ruta = v.ruta_id ? rutas.find(r => r.id === v.ruta_id) : null;
              return (
                <option key={v.id} value={v.id}>
                  #{v.id} — {v.fecha} — {nombreConductor}{ruta ? ` — ${ruta.origen} → ${ruta.destino}` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {viajeSeleccionado && (
          <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 space-y-1">
            <div><strong>Conductor:</strong> {conductorDelViaje ? `${conductorDelViaje.nombre} ${conductorDelViaje.apellido1}` : viajeSeleccionado.conductor_nombre}</div>
            <div><strong>Ruta:</strong> {rutaDelViaje ? `${rutaDelViaje.origen} → ${rutaDelViaje.destino} (base $${rutaDelViaje.monto_base.toLocaleString()})` : 'Sin ruta preconfigurada — indique el monto manualmente'}</div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Monto</label>
          <input
            type="number"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
          />
          {rutaDelViaje && <p className="text-[10px] text-slate-400 mt-1">Sugerido desde la ruta — se puede aumentar, no bajar de ${rutaDelViaje.monto_base.toLocaleString()}.</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Comentarios</label>
          <textarea rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none" value={comentarios} onChange={(e) => setComentarios(e.target.value)} />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50">
            {loading ? 'Enviando...' : 'Solicitar Rendición'}
          </button>
        </div>
      </form>
    </div>
  );
}
