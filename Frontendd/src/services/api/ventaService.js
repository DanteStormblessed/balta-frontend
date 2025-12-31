import { apiFetch } from './api';

export const ventaService = {
  getAll: () => apiFetch('/ventas').catch(() => []),

  getById: (id) => apiFetch(`/ventas/${id}`),

  registrar: (data) => apiFetch('/ventas', { method: 'POST', body: JSON.stringify(data) }),

  getPorPeriodo: (inicio, fin) => {
    const params = new URLSearchParams({ inicio, fin });
    return apiFetch(`/ventas/periodo?${params}`);
  },

  getTotalPorPeriodo: (inicio, fin) => {
    const params = new URLSearchParams({ inicio, fin });
    return apiFetch(`/ventas/total-periodo?${params}`);
  },

  actualizar: (id, data) => apiFetch(`/ventas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id) => apiFetch(`/ventas/${id}`, { method: 'DELETE' }).then(() => true),
      
  getTotalPorMetodoPago: (idMetodoPago, inicio, fin) => {
    const params = new URLSearchParams({ idMetodoPago, inicio: inicio.toISOString(), fin: fin.toISOString() });
    return apiFetch(`/ventas/total-metodo-pago?${params}`);
  }
};