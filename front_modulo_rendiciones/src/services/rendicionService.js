import { fetchWithAuth } from '../../../shared_components/apiClient';

async function parseOrThrow(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error: ${res.status}`);
  return data;
}

export const rendicionService = {
  async crear(data) {
    const res = await fetchWithAuth('/rendiciones/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return parseOrThrow(res);
  },
  async obtenerTodas() {
    const res = await fetchWithAuth('/rendiciones/');
    return res.json();
  },
  async eliminar(id) {
    const res = await fetchWithAuth(`/rendiciones/${id}`, {
      method: 'DELETE',
    });
    return parseOrThrow(res);
  },
};
