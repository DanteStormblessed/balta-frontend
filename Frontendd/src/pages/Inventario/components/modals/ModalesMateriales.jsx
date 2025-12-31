// src/pages/Inventario/components/modals/ModalesMateriales.jsx - SIMPLIFICADO
import React from 'react'
import { Button } from '../../../../components/UI.jsx'
import { SwapVert, Science, Edit, Delete } from '@mui/icons-material'

export function ModalMovimiento({ 
  showMovimientoModal, 
  setShowMovimientoModal,
  formMovimiento,
  setFormMovimiento,
  handleRegistrarMovimiento
}) {
  if (!showMovimientoModal) return null

  return (
    <div className="inventario-modal-overlay" style={{
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
      <div className="inventario-modal" style={{
        background: 'var(--panel)',
        padding: '2rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        border: '2px solid var(--border)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <SwapVert sx={{ color: '#2196F3', fontSize: 28 }} />
          <h3 style={{ margin: 0, fontSize: '1.3rem' }}>
            Ajustar Stock
          </h3>
        </div>

        <div style={{ 
          background: '#2196F315', 
          padding: '0.75rem', 
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          <strong>{showMovimientoModal.nombre}</strong>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
            Stock actual: {showMovimientoModal.stockActual || 0} {showMovimientoModal.unidadMedida?.abreviatura || ''}
          </div>
        </div>
        
        <form onSubmit={handleRegistrarMovimiento}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
              Cantidad *
            </label>
            <input
              type="number"
              value={formMovimiento.cantidad}
              onChange={(e) => setFormMovimiento(prev => ({ ...prev, cantidad: e.target.value }))}
              required
              placeholder="Usar + para aumentar, - para disminuir"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
              Ejemplo: +10 (agregar), -5 (quitar)
            </div>
          </div>

          {formMovimiento.cantidad && (
            <div style={{
              background: '#2196F315',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              color: 'var(--muted)'
            }}>
              Nuevo stock: {(showMovimientoModal.stockActual || 0) + parseInt(formMovimiento.cantidad || 0)} {showMovimientoModal.unidadMedida?.abreviatura || ''}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => {
                setShowMovimientoModal(null)
                setFormMovimiento({ cantidad: '' })
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" style={{ background: '#2196F3' }}>
              Ajustar Stock
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ModalDetallesMaterial({ 
  showDetallesMaterial, 
  setShowDetallesMaterial 
}) {
  if (!showDetallesMaterial) return null

  const getStockStatus = (material) => {
    const stock = material.stockActual || 0
    const stockMinimo = material.stockMinimo || 10
    
    if (stock === 0) return { text: 'Sin Stock', color: '#F44336' }
    if (stock < stockMinimo) return { text: 'Bajo', color: '#FF9800' }
    if (stock <= stockMinimo * 2) return { text: 'Medio', color: '#FFC107' }
    return { text: 'OK', color: '#4CAF50' }
  }

  const status = getStockStatus(showDetallesMaterial)

  return (
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
          {showDetallesMaterial.nombre}
        </h3>

        <div style={{ marginBottom: '1rem' }}>
          <strong>Descripción:</strong> {showDetallesMaterial.descripcion || '-'}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Stock Actual:</strong> {showDetallesMaterial.stockActual || 0} {showDetallesMaterial.unidadMedida?.abreviatura || ''}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Stock Mínimo:</strong> {showDetallesMaterial.stockMinimo || 10} {showDetallesMaterial.unidadMedida?.abreviatura || ''}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Unidad de Medida:</strong> {showDetallesMaterial.unidadMedida?.nombre || '-'}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Estado:</strong> <span style={{ color: status.color, fontWeight: '600' }}>
            {status.text}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <Button variant="ghost" onClick={() => setShowDetallesMaterial(null)}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ModalMaterial({
  showForm,
  setShowForm,
  materialEdit,
  setMaterialEdit,
  formData,
  setFormData,
  unidadesMedida,
  handleSubmit
}) {
  if (!showForm) return null

  const esEdicion = !!materialEdit

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '1rem',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'var(--panel)',
        padding: '2rem',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: '2px solid var(--border)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid var(--border)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
            padding: '0.75rem',
            borderRadius: '12px',
            color: 'white'
          }}>
            <Science />
          </div>
          <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.5rem' }}>
            {esEdicion ? 'Editar Material' : 'Nuevo Material'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Nombre <span style={{ color: '#f97066' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              required
              placeholder="Ej: Cuero genuino"
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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              rows={3}
              placeholder="Descripción del material..."
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Unidad de Medida <span style={{ color: '#f97066' }}>*</span>
              </label>
              <select
                value={formData.idUnidadMedida}
                onChange={(e) => setFormData(prev => ({ ...prev, idUnidadMedida: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              >
                <option value="">Seleccionar</option>
                {unidadesMedida.map(unidad => (
                  <option key={unidad.idUnidadMedida} value={unidad.idUnidadMedida}>
                    {unidad.nombre} ({unidad.abreviatura})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Stock Mínimo
              </label>
              <input
                type="number"
                value={formData.stockMinimo}
                onChange={(e) => setFormData(prev => ({ ...prev, stockMinimo: e.target.value }))}
                min="0"
                placeholder="Ej: 10"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          {!esEdicion && (
            <div style={{ 
              padding: '1rem', 
              background: '#f0f9ff', 
              borderRadius: '8px',
              border: '1px solid #0ea5e9'
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#0c4a6e' }}>
                💡 <strong>Nota:</strong> El stock inicial se ajusta después de crear el material.
              </p>
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            justifyContent: 'flex-end',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border)'
          }}>
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => {
                setShowForm(false)
                setMaterialEdit(null)
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {esEdicion ? 'Actualizar' : 'Crear'} Material
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ModalConfirmarEliminarMaterial({ 
  showConfirmDelete, 
  setShowConfirmDelete,
  handleEliminarMaterial
}) {
  if (!showConfirmDelete) return null

  return (
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
        maxWidth: '400px',
        textAlign: 'center',
        border: '2px solid var(--border)'
      }}>
        <Delete sx={{ fontSize: 48, color: '#F44336', marginBottom: '1rem' }} />

        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem' }}>
          ¿Eliminar material?
        </h3>

        <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
          {showConfirmDelete.nombre}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Button variant="ghost" onClick={() => setShowConfirmDelete(null)}>
            Cancelar
          </Button>
          <Button onClick={handleEliminarMaterial} style={{ background: '#f97066' }}>
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  )
}