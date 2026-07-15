import React, { useState, useEffect, useRef, useCallback } from 'react';
import { decodeJWT } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const POLL_INTERVAL_MS = 30000;

/**
 * Campanita de notificaciones — muestra las solicitudes pendientes dirigidas
 * a los módulos a los que el usuario tiene acceso (ver módulo Solicitudes).
 *
 * No usa fetchWithAuth a propósito: un usuario sin permiso en 'solicitudes'
 * recibiría 403 al consultar, y fetchWithAuth trata 401/403 como sesión
 * expirada y fuerza logout — eso rompería todos los demás módulos, ya que
 * este componente se renderiza globalmente dentro de Header.
 */
const NotificationBell = () => {
  const [tienePermiso, setTienePermiso] = useState(false);
  const [pendientes, setPendientes] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const payload = decodeJWT(token);
    const permisos = payload?.permisos || {};
    const nivel = permisos['solicitudes'] || 'none';
    setTienePermiso(nivel === 'view' || nivel === 'edit');
  }, []);

  const cargarPendientes = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/solicitudes/?estado=pendiente`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return; // fail-silent: no interrumpir otros módulos por esto
      const data = await res.json();
      const payload = decodeJWT(token);
      const permisos = payload?.permisos || {};
      const misModulos = Object.keys(permisos).filter(k => permisos[k] === 'view' || permisos[k] === 'edit');
      const mias = Array.isArray(data) ? data.filter(s => misModulos.includes(s.modulo_destino)) : [];
      setPendientes(mias);
    } catch {
      // Sin conexión al MS de solicitudes: no mostrar nada, no romper la UI.
    }
  }, []);

  useEffect(() => {
    if (!tienePermiso) return;
    cargarPendientes();
    const id = setInterval(cargarPendientes, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [tienePermiso, cargarPendientes]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!tienePermiso) return null;

  const count = pendientes.length;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Solicitudes pendientes"
        style={{
          position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
          padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8,
            background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
          }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%', width: 320, maxHeight: 360, overflowY: 'auto',
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)', zIndex: 50,
        }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 12, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Solicitudes pendientes ({count})
          </div>
          {count === 0 ? (
            <div style={{ padding: '24px 14px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
              Sin pendientes
            </div>
          ) : (
            pendientes.slice(0, 8).map(s => (
              <a
                key={s.id}
                href="/solicitudes/"
                style={{ display: 'block', padding: '10px 14px', borderBottom: '1px solid #f1f5f9', textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{s.titulo}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  De {s.modulo_origen} · Prioridad {s.prioridad}
                </div>
              </a>
            ))
          )}
          <a
            href="/solicitudes/"
            style={{ display: 'block', padding: '10px 14px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}
          >
            Ver todas
          </a>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
