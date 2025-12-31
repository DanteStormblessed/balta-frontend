import { apiFetch } from './api';

export const unidadMedidaService = {
  getAll: () => apiFetch('/unidades-medida').catch(err => { console.error('Error en getAll unidades medida:', err); return []; }),

  getById: (id) => apiFetch(`/unidades-medida/${id}`),

  create: (data) => apiFetch('/unidades-medida', { method: 'POST', body: JSON.stringify(data) }),

  update: (id, data) => apiFetch(`/unidades-medida/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: async (id) => apiFetch(`/unidades-medida/${id}`, { method: 'DELETE' })
};