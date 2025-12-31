
import { apiFetch } from './api';

export const materialService = {
  getAll: () => apiFetch('/materiales').catch(err => { console.error('Error en getAll materiales:', err); return []; }),

  getById: (id) => apiFetch(`/materiales/${id}`),

  create: (data) => apiFetch('/materiales', { method: 'POST', body: JSON.stringify(data) }),

  update: (id, data) => apiFetch(`/materiales/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id) => apiFetch(`/materiales/${id}`, { method: 'DELETE' }),

  buscar: (nombre) => apiFetch(`/materiales/buscar?nombre=${encodeURIComponent(nombre)}`),

  getBajoStock: () => apiFetch('/materiales/bajo-stock').catch(err => { console.error('Error en getBajoStock:', err); return []; }),

  getStock: (id) => apiFetch(`/materiales/${id}/stock`)
};
