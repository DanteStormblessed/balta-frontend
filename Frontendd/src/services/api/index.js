// src/services/api/index.js

import { categoriaService } from './categoriaService';
import { productoService } from './productoService';
import { inventarioService } from './inventarioService';
import { ventaService } from './ventaService';
import { compraService } from './compraService';
import { gastoService } from './gastoService';
import { metodoPagoService } from './metodoPagoService';
import { materialService } from './materialService';
import { unidadMedidaService } from './unidadMedidaService';
import { inventarioMaterialService } from './inventarioMaterialService.js';
import { recetaService } from './recetaService';
import { agendamientoService } from './agendamientoService';
import authService from './authService';  // ✅ IMPORTAR SERVICIO DE AUTH

// Helper para manejar respuestas
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Error en el servidor');
    } else {
      const text = await response.text();
      throw new Error(text || `Error ${response.status}: ${response.statusText}`);
    }
  }
  
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
};

// Objeto API con todos los servicios
export const api = {
  auth: authService,  // ✅ SERVICIO DE AUTENTICACIÓN
  categorias: categoriaService,
  productos: productoService,
  inventario: inventarioService,
  ventas: ventaService,
  compras: compraService,
  gastos: gastoService,
  metodosPago: metodoPagoService,
  materiales: materialService,
  unidadesMedida: unidadMedidaService,
  inventarioMateriales: inventarioMaterialService,
  recetas: recetaService,
  agendamientos: agendamientoService
};

// Mantener compatibilidad con el código anterior
export const getCategorias = categoriaService.getAll;
export const getProductos = productoService.getAll;
export const getInventario = inventarioService.getAll;
export const getVentas = ventaService.getAll;
export const getCompras = compraService.getAll;
export const getGastos = gastoService.getAll;
export const getMetodosPago = metodoPagoService.getAll;

export { handleResponse };