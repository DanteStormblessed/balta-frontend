import { apiFetch } from './api';

export const inventarioService = {
  getAll: () => apiFetch('/inventario'),

  getById: (id) => apiFetch(`/inventario/${id}`),

  getPorProducto: (idProducto) => apiFetch(`/inventario/producto/${idProducto}`),

  registrar: (data) => apiFetch('/inventario', { method: 'POST', body: JSON.stringify(data) }),

  actualizar: (id, data) => apiFetch(`/inventario/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  ajustarCantidad: (idProducto, cantidad) => apiFetch(`/inventario/ajustar/${idProducto}?cantidad=${cantidad}`, { method: 'PUT' }),

  getBajoStock: (minimo = 10) => apiFetch(`/inventario/bajo-stock?minimo=${minimo}`),

  delete: (id) => apiFetch(`/inventario/${id}`, { method: 'DELETE' })
};