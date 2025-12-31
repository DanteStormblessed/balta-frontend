import { apiFetch } from './api';

export const inventarioMaterialService = {
  registrarMovimiento: (data) =>
    apiFetch('/inventario-materiales', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  registrarEntrada: (idMaterial, cantidad, costoUnitario, observaciones = '') => {
    const cantidadEntera = Math.ceil(parseFloat(cantidad));

    const params = new URLSearchParams({
      idMaterial: parseInt(idMaterial),
      cantidad: cantidadEntera,
      costoUnitario: parseFloat(costoUnitario),
      ...(observaciones && { observaciones })
    });

    return apiFetch(`/inventario-materiales/entrada?${params}`, {
      method: 'POST'
    });
  },

  registrarSalida: (idMaterial, cantidad, observaciones = '') => {
    const cantidadEntera = Math.ceil(parseFloat(cantidad));

    const params = new URLSearchParams({
      idMaterial: parseInt(idMaterial),
      cantidad: cantidadEntera,
      ...(observaciones && { observaciones })
    });

    return apiFetch(`/inventario-materiales/salida?${params}`, {
      method: 'POST'
    });
  },

  getMovimientosPorMaterial: (idMaterial) =>
    apiFetch(`/inventario-materiales/material/${idMaterial}`),

  getUltimosMovimientos: (idMaterial) =>
    apiFetch(`/inventario-materiales/material/${idMaterial}/ultimos`),

  getStockActual: (idMaterial) =>
    apiFetch(`/inventario-materiales/material/${idMaterial}/stock`),

  getCostoPromedio: (idMaterial) =>
    apiFetch(`/inventario-materiales/material/${idMaterial}/costo`)
};
