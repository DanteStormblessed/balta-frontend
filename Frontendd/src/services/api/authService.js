import { apiFetch } from './api';

const authService = {

  login: async (credentials) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    if (data.token) {
      localStorage.setItem('token', data.token);
    }

    if (data.usuario) {
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
    }

    return data;
  },

  registro: async (userData) => {
    const data = await apiFetch('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    if (data.token) {
      localStorage.setItem('token', data.token);
    }

    if (data.usuario) {
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
    }

    return data;
  },

  verificarCorreo: (correo) =>
    apiFetch(`/auth/verificar-correo?correo=${encodeURIComponent(correo)}`),

  verificarRut: (rut) =>
    apiFetch(`/auth/verificar-rut?rut=${encodeURIComponent(rut)}`),

  cambiarPassword: (data) =>
    apiFetch('/auth/cambiar-password', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getToken: () => localStorage.getItem('token'),

  logout: () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  },

  getUsuarioActual: () => {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  },

  estaAutenticado: () =>
    !!localStorage.getItem('token')
};

export default authService;
