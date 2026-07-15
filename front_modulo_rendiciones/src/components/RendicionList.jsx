import { useState, useEffect } from 'react';
import { rendicionService } from '../services/rendicionService';
import { operacionService } from '../services/operacionService';
import { rrhhService } from '../services/rrhhService';

export default function RendicionList({ permiso, refreshKey }) {
  const [rendiciones, setRendiciones] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargar(); }, [refreshKey]);

  const cargar = async () => {
    setLoading(true);
    try {
      const [r, v, p] = await Promise.all([
        rendicionService.obtenerTodas(),
        operacionService.obtenerViajes(),
        rrhhService.obtenerPersonal(),
      ]);
      setRendiciones(Array.isArray(r) ? r : []);
      setViajes(v);
      setPersonal(p);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nombreConductor = (id) => {
    const p = personal.find(x => x.id === id);
    return p ? `${p.nombre} ${p.apellido1}` : `#${id}`;
  };

  const infoViaje = (id) => viajes.find(v => v.id === id);

  const handleDelete = async (id) => {
    if (!confirm(`¿Eliminar la solicitud de rendición #${id}?`)) return;
    setError('');
    try {
      await rendicionService.eliminar(id);
      setRendiciones(prev => prev.filter(x => x.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-lg">Solicitudes de Rendición</h3>
      </div>

      {error && <div className="m-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Viaje</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Conductor</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Comentarios</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px] text-right">Monto</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Estado</th>
              {permiso === 'edit' && <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px] text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">Cargando...</td></tr>
            ) : rendiciones.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No hay solicitudes de rendición.</td></tr>
            ) : rendiciones.map(r => {
              const viaje = infoViaje(r.viaje_id);
              return (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700">
                    #{r.viaje_id}
                    {viaje && <div className="text-slate-400 text-xs">{viaje.fecha} — {viaje.origen || '—'} → {viaje.destino || '—'}</div>}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{nombreConductor(r.conductor_id)}</td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{r.comentarios || '—'}</td>
                  <td className="px-6 py-4 font-mono font-bold text-emerald-600 text-right">${r.monto.toLocaleString()}</td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700">{r.estado}</span></td>
                  {permiso === 'edit' && (
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(r.id)} className="text-xs text-red-500 hover:underline font-medium">Eliminar</button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
