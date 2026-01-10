// agendamientoService.js
import { API_BASE_URL } from './config';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const parseResponseBody = async (response) => {
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? text : null;
};

export const agendamientoService = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/agendamientos`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error al obtener agendamientos:', error);
      throw error;
    }
  },

  create: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/agendamientos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  update: async (id, payload) => {
    const response = await fetch(`${API_BASE_URL}/agendamientos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  remove: async (id) => {
    const response = await fetch(`${API_BASE_URL}/agendamientos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return parseResponseBody(response);
  },
};