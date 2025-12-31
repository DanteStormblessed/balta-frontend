import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Toolbar
} from '../components/UI.jsx';
import { 
  Category, 
  Payment, 
  Add, 
  Edit, 
  Delete,
  CheckCircle,
  Cancel,
  Straighten
} from '@mui/icons-material';
import { categoriaService } from '../services/api/categoriaService.js';
import { metodoPagoService } from '../services/api/metodoPagoService';
import { unidadMedidaService } from '../services/api/unidadMedidaService';

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState('categorias');
  const [categorias, setCategorias] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [activeTab]);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'categorias') {
        const data = await categoriaService.getAll();
        setCategorias(data);
      } else if (activeTab === 'metodos-pago') {
        const data = await metodoPagoService.getAll();
        setMetodosPago(data);
      } else if (activeTab === 'unidades-medida') {
        const data = await unidadMedidaService.getAll();
        setUnidadesMedida(data);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    if (activeTab === 'categorias') {
      setFormData({ nombre: '', descripcion: '' });
    } else if (activeTab === 'metodos-pago') {
      setFormData({ nombre: '', comisionAsociada: 0 });
    } else if (activeTab === 'unidades-medida') {
      setFormData({ nombre: '', abreviatura: '' });
    }
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    const formData = { ...item };
    if (item.comisionAsociada !== undefined) {
      formData.comisionAsociada = parseFloat(item.comisionAsociada) || 0;
    }
    setFormData(formData);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (item) => {
    setDeleteConfirm(item);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      if (activeTab === 'categorias') {
        await categoriaService.delete(deleteConfirm.idCategoria);
        setSuccess('✅ Eliminado exitosamente');
      } else if (activeTab === 'metodos-pago') {
        const enUso = await metodoPagoService.verificarEnUso(deleteConfirm.idMetodoPago);
        if (enUso) {
          setError('❌ No se puede eliminar porque está en uso');
          setDeleteConfirm(null);
          return;
        }
        await metodoPagoService.delete(deleteConfirm.idMetodoPago);
        setSuccess('✅ Eliminado exitosamente');
      } else if (activeTab === 'unidades-medida') {
        await unidadMedidaService.delete(deleteConfirm.idUnidadMedida);
        setSuccess('✅ Eliminado exitosamente');
      }
      setDeleteConfirm(null);
      cargarDatos();
    } catch (err) {
      setError('❌ No se puede eliminar');
      setDeleteConfirm(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.nombre || formData.nombre.trim() === '') {
      setError('⚠️ El nombre es obligatorio');
      return;
    }

    try {
      if (activeTab === 'categorias') {
        const categoriaData = {
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion?.trim() || ''
        };

        if (editingItem) {
          await categoriaService.update(editingItem.idCategoria, categoriaData);
          setSuccess('✅ Actualizado exitosamente');
        } else {
          await categoriaService.create(categoriaData);
          setSuccess('✅ Creado exitosamente');
        }
      } else if (activeTab === 'metodos-pago') {
        const metodoPagoData = {
          nombre: formData.nombre.trim(),
          comisionAsociada: parseFloat(formData.comisionAsociada) || 0
        };

        if (editingItem) {
          await metodoPagoService.update(editingItem.idMetodoPago, metodoPagoData);
          setSuccess('✅ Actualizado exitosamente');
        } else {
          await metodoPagoService.create(metodoPagoData);
          setSuccess('✅ Creado exitosamente');
        }
      } else if (activeTab === 'unidades-medida') {
        const unidadMedidaData = {
          nombre: formData.nombre.trim(),
          abreviatura: formData.abreviatura?.trim() || ''
        };
        
        if (!unidadMedidaData.abreviatura) {
          setError('⚠️ La abreviatura es obligatoria');
          return;
        }

        if (editingItem) {
          await unidadMedidaService.update(editingItem.idUnidadMedida, unidadMedidaData);
          setSuccess('✅ Actualizado exitosamente');
        } else {
          await unidadMedidaService.create(unidadMedidaData);
          setSuccess('✅ Creado exitosamente');
        }
      }
      setShowForm(false);
      cargarDatos();
    } catch (err) {
      console.error('Error:', err);
      setError('❌ Error al guardar');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'categorias': return categorias;
      case 'metodos-pago': return metodosPago;
      case 'unidades-medida': return unidadesMedida;
      default: return [];
    }
  };

  const getColumns = () => {
    switch (activeTab) {
      case 'categorias': return ['Nombre', 'Descripción', 'Acciones'];
      case 'metodos-pago': return ['Nombre', 'Comisión', 'Acciones'];
      case 'unidades-medida': return ['Nombre', 'Abreviatura', 'Acciones'];
      default: return [];
    }
  };

  const getRows = () => {
    const currentData = getCurrentData();
    
    return currentData.map(item => {
      if (activeTab === 'categorias') {
        return [
          item.nombre,
          item.descripcion || '-',
          <div key={item.idCategoria} style={{ display: 'flex', gap: '0.25rem', flexWrap: 'nowrap', alignItems: 'center' }}>
            <Button small variant="ghost" onClick={() => handleEdit(item)}>
              <Edit sx={{ fontSize: { xs: 15, sm: 18 } }} />
            </Button>
            <Button
              small
              variant="ghost"
              onClick={() => handleDelete(item)}
              style={{ background: 'var(--error)', color: 'white', minWidth: 0, padding: '0 0.4rem', height: 28, minHeight: 28 }}
            >
              <Delete sx={{ fontSize: { xs: 15, sm: 18 } }} />
            </Button>
          </div>
        ];
      } else if (activeTab === 'metodos-pago') {
        return [
          item.nombre,
          item.comisionAsociada ? `${parseFloat(item.comisionAsociada).toFixed(2)}%` : '0%',
          <div key={item.idMetodoPago} style={{ display: 'flex', gap: '0.25rem', flexWrap: 'nowrap', alignItems: 'center' }}>
            <Button small variant="ghost" onClick={() => handleEdit(item)} style={{ minWidth: 0, padding: '0 0.4rem', height: 28, minHeight: 28 }}>
              <Edit sx={{ fontSize: { xs: 15, sm: 18 } }} />
            </Button>
            <Button
              small
              variant="ghost"
              onClick={() => handleDelete(item)}
              style={{ background: 'var(--error)', color: 'white', minWidth: 0, padding: '0 0.4rem', height: 28, minHeight: 28 }}
            >
              <Delete sx={{ fontSize: { xs: 15, sm: 18 } }} />
            </Button>
          </div>
        ];
      } else if (activeTab === 'unidades-medida') {
        return [
          item.nombre,
          item.abreviatura,
          <div key={item.idUnidadMedida} style={{ display: 'flex', gap: '0.25rem', flexWrap: 'nowrap', alignItems: 'center' }}>
            <Button small variant="ghost" onClick={() => handleEdit(item)} style={{ minWidth: 0, padding: '0 0.4rem', height: 28, minHeight: 28 }}>
              <Edit sx={{ fontSize: { xs: 15, sm: 18 } }} />
            </Button>
            <Button
              small
              variant="ghost"
              onClick={() => handleDelete(item)}
              style={{ background: 'var(--error)', color: 'white', minWidth: 0, padding: '0 0.4rem', height: 28, minHeight: 28 }}
            >
              <Delete sx={{ fontSize: { xs: 15, sm: 18 } }} />
            </Button>
          </div>
        ];
      }
    });
  };

  const getTabLabel = () => {
    switch (activeTab) {
      case 'categorias': return 'Categoría';
      case 'metodos-pago': return 'Método de Pago';
      case 'unidades-medida': return 'Unidad de Medida';
      default: return '';
    }
  };

  const currentData = getCurrentData();
  const columns = getColumns();
  const rows = getRows();

  return (
    <div className="stack" style={{ padding: '0.75rem' }}>
      <Card>
        {/* PESTAÑAS SIMPLES */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          borderBottom: '2px solid var(--border)',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => setActiveTab('categorias')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'categorias' ? 'var(--brand)' : 'transparent',
              color: activeTab === 'categorias' ? 'white' : 'var(--text)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Category sx={{ fontSize: 20 }} />
            Categorías
          </button>
          <button
            onClick={() => setActiveTab('metodos-pago')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'metodos-pago' ? 'var(--brand)' : 'transparent',
              color: activeTab === 'metodos-pago' ? 'white' : 'var(--text)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Payment sx={{ fontSize: 20 }} />
            Métodos de Pago
          </button>
          <button
            onClick={() => setActiveTab('unidades-medida')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'unidades-medida' ? 'var(--brand)' : 'transparent',
              color: activeTab === 'unidades-medida' ? 'white' : 'var(--text)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Straighten sx={{ fontSize: 20 }} />
            Unidades
          </button>
        </div>

        {/* MENSAJES */}
        {error && (
          <div style={{
            background: '#FFEBEE',
            border: '2px solid #F44336',
            color: '#C62828',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#E8F5E8',
            border: '2px solid #4CAF50',
            color: '#2E7D32',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {success}
          </div>
        )}

        {/* BOTÓN AGREGAR */}
        <Toolbar>
          <Button onClick={handleCreate}>
            <Add sx={{ fontSize: 18 }} />
            Nuevo
          </Button>
        </Toolbar>

        {/* TABLA */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
            Cargando...
          </div>
        ) : (
          <Table className="config-table" columns={columns} rows={rows} />
        )}
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
              {editingItem ? 'Editar' : 'Nuevo'} {getTabLabel()}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre || ''}
                  onChange={handleInputChange}
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

              {activeTab === 'categorias' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion || ''}
                    onChange={handleInputChange}
                    rows="3"
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
              )}

              {activeTab === 'metodos-pago' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                    Comisión (%)
                  </label>
                  <input
                    type="number"
                    name="comisionAsociada"
                    value={formData.comisionAsociada || 0}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              )}

              {activeTab === 'unidades-medida' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                    Abreviatura *
                  </label>
                  <input
                    type="text"
                    name="abreviatura"
                    value={formData.abreviatura || ''}
                    onChange={handleInputChange}
                    required
                    placeholder="kg, L, m, etc."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
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
              <Button onClick={confirmDelete} style={{ background: 'var(--error)' }}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}