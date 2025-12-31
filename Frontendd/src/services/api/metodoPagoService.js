import { apiFetch } from './api';

export const metodoPagoService = {
  getAll: async () => apiFetch('/metodos-pago'),

  getById: async (id) => apiFetch(`/metodos-pago/${id}`),

  create: async (data) => apiFetch('/metodos-pago', { method: 'POST', body: JSON.stringify(data) }),

  update: async (id, data) => apiFetch(`/metodos-pago/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: async (id) => apiFetch(`/metodos-pago/${id}`, { method: 'DELETE' }).then(() => true),

  verificarEnUso: async (id) => apiFetch(`/metodos-pago/${id}/en-uso`)
};