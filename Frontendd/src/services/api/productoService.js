import { apiFetch } from './api';

export const productoService = {
  getAll: () => apiFetch('/productos').catch(err => { console.error('Error en getAll productos:', err); return []; }),

  getById: (id) => apiFetch(`/productos/${id}`),

  create: (data) => apiFetch('/productos', { method: 'POST', body: JSON.stringify(data) }),

  update: (id, data) => apiFetch(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id) => apiFetch(`/productos/${id}`, { method: 'DELETE' }),

  buscar: (nombre) => apiFetch(`/productos/buscar?nombre=${encodeURIComponent(nombre)}`),

  getPorCategoria: (idCategoria) => apiFetch(`/productos/categoria/${idCategoria}`),

  // NUEVA FUNCIÓN - Productos más vendidos
  getMasVendidos: (inicio, fin) => apiFetch(`/productos/mas-vendidos?inicio=${inicio.toISOString()}&fin=${fin.toISOString()}`).catch(err => { console.error('Error en getMasVendidos:', err); return []; })
};