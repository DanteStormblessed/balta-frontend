import { apiFetch } from './api';

export const categoriaService = {
  getAll: () =>
    apiFetch('/categorias'),

  getById: (id) =>
    apiFetch(`/categorias/${id}`),

  create: (data) =>
    apiFetch('/categorias', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  update: (id, data) =>
    apiFetch(`/categorias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  delete: (id) =>
    apiFetch(`/categorias/${id}`, {
      method: 'DELETE'
    })
};
