// recetaService.js
import { apiFetch } from './api';

export const recetaService = {
  agregarMaterial: (data) =>
    apiFetch('/recetas', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getMaterialesPorProducto: (idProducto) =>
    apiFetch(`/recetas/producto/${idProducto}`)
      .catch(err => {
        console.error('Error en getMaterialesPorProducto:', err);
        return [];
      }),

  getProductosPorMaterial: (idMaterial) =>
    apiFetch(`/recetas/material/${idMaterial}`),

  getCostoProducto: (idProducto) =>
    apiFetch(`/recetas/producto/${idProducto}/costo`),

  actualizarReceta: async (idProducto, materiales) => {
    await apiFetch(`/recetas/producto/${idProducto}`, {
      method: 'PUT',
      body: JSON.stringify(materiales)
    });

    return {
      success: true,
      message: 'Receta actualizada exitosamente'
    };
  },

  eliminarMaterial: (id) =>
    apiFetch(`/recetas/${id}`, {
      method: 'DELETE'
    })
};
