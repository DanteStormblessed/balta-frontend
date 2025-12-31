import { apiFetch } from './api';

export const gastoService = {
  getAll: () => apiFetch('/gastos'),

  getById: (id) => apiFetch(`/gastos/${id}`),

  registrar: (data) => apiFetch('/gastos', { method: 'POST', body: JSON.stringify(data) }),

  update: (id, data) => apiFetch(`/gastos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getTotalPorPeriodo: (inicio, fin) => {
    const params = new URLSearchParams({ inicio, fin });
    return apiFetch(`/gastos/total-periodo?${params}`);
  },

  delete: (id) => apiFetch(`/gastos/${id}`, { method: 'DELETE' })
};