import { fetchWithAuth } from '../../../shared_components/apiClient';

export const rrhhService = {
  async obtenerPersonal() {
    const res = await fetchWithAuth('/personal/');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
};
