// src/pages/Inventario/hooks/useInventarioMateriales.js
import { useState, useEffect } from 'react';
import { materialService } from '../../../services/api/materialService';
import { inventarioMaterialService } from '../../../services/api/inventarioMaterialService';
import { unidadMedidaService } from '../../../services/api/unidadMedidaService';

export const useInventarioMateriales = () => {
  const [materiales, setMateriales] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [materialesData, unidadesData] = await Promise.all([
        materialService.getAll(),
        unidadMedidaService.getAll()
      ]);

      setMateriales(materialesData);
      setUnidadesMedida(unidadesData);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarMovimientosPorMaterial = async (idMaterial) => {
    try {
      const movimientosData = await inventarioMaterialService.getMovimientosPorMaterial(idMaterial);
      return movimientosData;
    } catch (err) {
      console.error('Error cargando movimientos:', err);
      throw err;
    }
  };

  const registrarEntrada = async (idMaterial, cantidad, costoUnitario, observaciones) => {
    try {
      await inventarioMaterialService.registrarEntrada(
        idMaterial,
        cantidad,
        costoUnitario,
        observaciones
      );
      await cargarDatos(); // ✅ Recargar después de registrar
    } catch (err) {
      console.error('Error registrando entrada:', err);
      throw err;
    }
  };

  const registrarSalida = async (idMaterial, cantidad, observaciones) => {
    try {
      await inventarioMaterialService.registrarSalida(
        idMaterial,
        cantidad,
        observaciones
      );
      await cargarDatos(); // ✅ Recargar después de registrar
    } catch (err) {
      console.error('Error registrando salida:', err);
      throw err;
    }
  };

  return {
    materiales,
    unidadesMedida,
    loading,
    error,
    cargarDatos, // ✅ Exportar para poder llamarlo desde fuera
    cargarMovimientosPorMaterial,
    registrarEntrada,
    registrarSalida
  };
};