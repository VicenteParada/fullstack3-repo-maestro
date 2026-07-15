import { fetchWithAuth } from '../../../shared_components/apiClient';

export const solicitudService = {
  async crear(data) {
    const res = await fetchWithAuth('/solicitudes/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async obtenerTodos({ modulo_destino, modulo_origen, estado } = {}) {
    const params = new URLSearchParams();
    if (modulo_destino) params.set('modulo_destino', modulo_destino);
    if (modulo_origen) params.set('modulo_origen', modulo_origen);
    if (estado) params.set('estado', estado);
    const qs = params.toString();
    const res = await fetchWithAuth(`/solicitudes/${qs ? `?${qs}` : ''}`);
    return res.json();
  },
  async actualizar(id, data) {
    const res = await fetchWithAuth(`/solicitudes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async eliminar(id) {
    const res = await fetchWithAuth(`/solicitudes/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },
};
