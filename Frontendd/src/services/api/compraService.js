import { apiFetch } from './api';

export const compraService = {
  getAll: () => apiFetch('/compras'),

  getById: (id) => apiFetch(`/compras/${id}`),

  registrar: async (data) => {
    try {
      if (!data || typeof data !== 'object') {
        throw new Error('Los datos de la compra son inválidos');
      }

      const cleanData = {
        fecha: data.fecha,
        metodoPago: {
          idMetodoPago: parseInt(data.metodoPago?.idMetodoPago)
        },
        tipoDocumento: data.tipoDocumento || 'sin-documento',
        observaciones: data.observaciones || '',
        detalles: (data.detalles || []).map(detalle => ({
          descripcion: detalle.descripcion,
          cantidad: parseInt(detalle.cantidad),
          precioUnitario: parseFloat(detalle.precioUnitario),
          subtotal: parseFloat(detalle.subtotal)
        }))
      };

      console.log('🔍 Datos limpios a enviar:', JSON.stringify(cleanData, null, 2));

      return apiFetch('/compras', {
        method: 'POST',
        body: JSON.stringify(cleanData)
      });
    } catch (error) {
      console.error('❌ Error en registrar compra:', error);
      console.error('Datos que causaron el error:', data);
      throw error;
    }
  },

  update: (id, data) => apiFetch(`/compras/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getTotalPorPeriodo: (inicio, fin) => {
    const params = new URLSearchParams({ inicio, fin });
    return apiFetch(`/compras/total-periodo?${params}`);
  },

  eliminar: (id) => apiFetch(`/compras/${id}`, { method: 'DELETE' }),

  // Alias para compatibilidad
  delete(id) {
    return this.eliminar(id);
  },

  registrarCompraMaterial: (compraData, materiales) => {
    const data = {
      compra: {
        fecha: compraData.fecha,
        metodoPago: compraData.metodoPago,
        observaciones: compraData.observaciones,
        tipoDocumento: 'compra-material'
      },
      materiales: (materiales || []).map(m => ({
        material: { idMaterial: m.material.idMaterial },
        cantidad: parseInt(m.cantidad),
        precioUnitario: parseFloat(m.precioUnitario)
      }))
    };

    return apiFetch('/compras/materiales', { method: 'POST', body: JSON.stringify(data) });
  },

  getMaterialesPorCompra: (idCompra) => apiFetch(`/compras/${idCompra}/materiales`)
};