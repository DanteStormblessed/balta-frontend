// src/pages/Inventario/InventarioMateriales.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Button, Toolbar } from '../../components/UI.jsx';
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import { materialService } from '../../services/api/materialService.js';
import { unidadMedidaService } from '../../services/api/unidadMedidaService.js';

export default function InventarioMateriales() {
  const [materiales, setMateriales] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetalles, setShowDetalles] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filtro, setFiltro] = useState({ buscar: '', stockBajo: false });
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    stockMinimo: 10,
    idUnidadMedida: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [materialesData, unidadesData] = await Promise.all([
        materialService.getAll(),
        unidadMedidaService.getAll()
      ]);

      setMateriales(materialesData);
      setUnidadesMedida(unidadesData);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const materialesFiltrados = useMemo(() => 
    materiales.filter(material => {
      const nombreMatch = filtro.buscar === '' || 
        material.nombre?.toLowerCase().includes(filtro.buscar.toLowerCase());
      const stockBajoMatch = !filtro.stockBajo || 
        (material.stockActual || 0) < (material.stockMinimo || 10);
      
      return nombreMatch && stockBajoMatch;
    }), [materiales, filtro]
  );

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      nombre: '',
      descripcion: '',
      stockMinimo: 10,
      idUnidadMedida: ''
    });
    setShowForm(true);
  };

  const handleEdit = (material) => {
    setEditingItem(material);
    setFormData({
      nombre: material.nombre || '',
      descripcion: material.descripcion || '',
      stockMinimo: material.stockMinimo || 10,
      idUnidadMedida: material.unidadMedida?.idUnidadMedida || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre || formData.nombre.trim() === '') {
      alert('⚠️ El nombre es obligatorio');
      return;
    }

    if (!formData.idUnidadMedida) {
      alert('⚠️ La unidad de medida es obligatoria');
      return;
    }

    try {
      const materialData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || '',
        stockMinimo: parseInt(formData.stockMinimo) || 10,
        unidadMedida: {
          idUnidadMedida: parseInt(formData.idUnidadMedida)
        }
      };

      if (editingItem) {
        await materialService.update(editingItem.idMaterial, materialData);
        alert('✅ Material actualizado');
      } else {
        await materialService.create(materialData);
        alert('✅ Material creado');
      }
      
      setShowForm(false);
      cargarDatos();
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await materialService.delete(deleteConfirm.idMaterial);
      setDeleteConfirm(null);
      cargarDatos();
      alert('✅ Material eliminado');
    } catch (err) {
      alert('❌ Error al eliminar');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStockStatus = (material) => {
    const stock = material.stockActual || 0;
    const stockMinimo = material.stockMinimo || 10;
    
    if (stock === 0) return 'Sin Stock';
    if (stock < stockMinimo) return 'Bajo';
    if (stock <= stockMinimo * 2) return 'Medio';
    return 'OK';
  };

  const rows = materialesFiltrados.map(material => [
    material.nombre || '-',
    `${material.stockActual || 0} ${material.unidadMedida?.abreviatura || ''}`,
    `${material.stockMinimo || 10} ${material.unidadMedida?.abreviatura || ''}`,
    getStockStatus(material),
    <div key={material.idMaterial} style={{ display: 'flex', gap: '0.5rem' }}>
      <Button small variant="ghost" onClick={() => setShowDetalles(material)}>
        <Visibility sx={{ fontSize: 18 }} />
      </Button>
      <Button small variant="ghost" onClick={() => handleEdit(material)}>
        <Edit sx={{ fontSize: 18 }} />
      </Button>
      <Button 
        small 
        variant="ghost" 
        onClick={() => setDeleteConfirm(material)}
        style={{ background: 'var(--error)', color: 'white' }}
      >
        <Delete sx={{ fontSize: 18 }} />
      </Button>
    </div>
  ]);

  if (loading) {
    return (
      <div className="stack" style={{ padding: '0.75rem' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
            Cargando...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="stack" style={{ padding: '0.75rem' }}>
      <Card>
        {/* FILTROS */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr auto', 
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <input
            type="text"
            placeholder="Buscar material..."
            value={filtro.buscar}
            onChange={(e) => setFiltro(prev => ({ ...prev, buscar: e.target.value }))}
            style={{
              padding: '0.5rem',
              border: '2px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}
          />

          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            fontSize: '0.9rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}>
            <input
              type="checkbox"
              checked={filtro.stockBajo}
              onChange={(e) => setFiltro(prev => ({ ...prev, stockBajo: e.target.checked }))}
            />
            Bajo stock
          </label>
        </div>

        {/* TOOLBAR */}
        <Toolbar style={{ marginBottom: '1rem' }}>
          <Button onClick={handleCreate}>
            <Add sx={{ fontSize: 18 }} />
            Nuevo
          </Button>
          <div style={{ flex: 1 }} />
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            {materialesFiltrados.length} de {materiales.length} materiales
          </span>
        </Toolbar>

        {/* TABLA */}
        <Table
          columns={['Material', 'Stock', 'Stock Mínimo', 'Estado', 'Acciones']}
          rows={rows}
        />
      </Card>

      {/* MODAL FORMULARIO */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--panel)',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            border: '2px solid var(--border)'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem' }}>
              {editingItem ? 'Editar' : 'Nuevo'} Material
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej: Cuero, Hilo, Cierre..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows="2"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                    Stock Mínimo *
                  </label>
                  <input
                    type="number"
                    name="stockMinimo"
                    value={formData.stockMinimo}
                    onChange={handleInputChange}
                    min="1"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                    Unidad *
                  </label>
                  <select
                    name="idUnidadMedida"
                    value={formData.idUnidadMedida}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">Seleccione</option>
                    {unidadesMedida.map(unidad => (
                      <option key={unidad.idUnidadMedida} value={unidad.idUnidadMedida}>
                        {unidad.nombre} ({unidad.abreviatura})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingItem ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLES */}
      {showDetalles && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--panel)',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            border: '2px solid var(--border)'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem' }}>
              {showDetalles.nombre}
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <strong>Descripción:</strong> {showDetalles.descripcion || '-'}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Stock Actual:</strong> {showDetalles.stockActual || 0} {showDetalles.unidadMedida?.abreviatura || ''}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Stock Mínimo:</strong> {showDetalles.stockMinimo || 10} {showDetalles.unidadMedida?.abreviatura || ''}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Unidad de Medida:</strong> {showDetalles.unidadMedida?.nombre || '-'}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Estado:</strong> {getStockStatus(showDetalles)}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <Button variant="ghost" onClick={() => setShowDetalles(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001
        }}>
          <div style={{
            background: 'var(--panel)',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center',
            border: '2px solid var(--border)'
          }}>
            <Delete sx={{ fontSize: 48, color: '#F44336', marginBottom: '1rem' }} />
            
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem' }}>
              ¿Eliminar "{deleteConfirm.nombre}"?
            </h3>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </Button>
              <Button onClick={handleDelete} style={{ background: 'var(--error)' }}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}