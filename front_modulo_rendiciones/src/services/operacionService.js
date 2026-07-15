import { fetchWithAuth } from '../../../shared_components/apiClient';

export const operacionService = {
  async obtenerViajes() {
    const res = await fetchWithAuth('/operacion/viajes');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
  async obtenerRutas() {
    const res = await fetchWithAuth('/operacion/rutas');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
};
