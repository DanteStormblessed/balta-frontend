import { apiFetch } from './api';

const handleJsonResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  let payload = null;

  if (text) {
    if (contentType.includes('application/json')) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    } else {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === 'string'
        ? payload
        : payload?.message || payload?.error || response.statusText;
    throw new Error(message || 'Error al procesar la solicitud');
  }

  return payload;
};

export const agendamientoService = {
  getAll: async () => {
    try {
      const response = await apiFetch('/agendamientos');
      const data = await handleJsonResponse(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error al obtener agendamientos:', error);
      return [];
    }
  },

  create: async (payload) => {
    const response = await apiFetch('/agendamientos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(response);
  },

  update: async (id, payload) => {
    const response = await apiFetch(`/agendamientos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(response);
  },

  remove: async (id) => {
    const response = await apiFetch(`/agendamientos/${id}`, {
      method: 'DELETE',
    });
    return handleJsonResponse(response);
  },
};
