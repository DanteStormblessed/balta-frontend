// ModalDetalles.jsx - SIN ÚLTIMA ACTUALIZACIÓN
import React from 'react'
import { Button } from '../../../../components/UI.jsx'
import { Visibility } from '@mui/icons-material'

export default function ModalDetalles({
  showDetalles,
  setShowDetalles,
  handleEditarProducto
}) {
  if (!showDetalles) return null

  return (
    <div
      className="inventario-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <div
        className="inventario-modal"
        style={{
          background: 'var(--panel)',
          padding: '2rem',
          maxWidth: '500px',
          width: '90%',
          border: '2px solid var(--border)',
          borderRadius: '16px'
        }}
      >
        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem' }}>
          Detalles del Producto
        </h3>

        <div style={{
          display: 'grid',
          gap: '1rem'
        }}>
          <div>
            <strong style={{ color: 'var(--text)' }}>Nombre:</strong>
            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--muted)' }}>
              {showDetalles.producto?.nombre || '-'}
            </p>
          </div>

          <div>
            <strong style={{ color: 'var(--text)' }}>Descripción:</strong>
            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--muted)' }}>
              {showDetalles.producto?.descripcion || '-'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <strong style={{ color: 'var(--text)' }}>Precio:</strong>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--muted)' }}>
                ${showDetalles.producto?.precio?.toLocaleString('es-CL') || '0'}
              </p>
            </div>

            <div>
              <strong style={{ color: 'var(--text)' }}>Stock Actual:</strong>
              <p style={{ 
                margin: '0.5rem 0 0 0',
                color: (showDetalles.inventario?.cantidadProducto || 0) <= 10 ? '#f97066' : '#4CAF50',
                fontWeight: '600'
              }}>
                {showDetalles.inventario?.cantidadProducto || 0} unidades
              </p>
            </div>
          </div>

          <div>
            <strong style={{ color: 'var(--text)' }}>Categoría:</strong>
            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--muted)' }}>
              {showDetalles.producto?.categoria?.nombre || '-'}
            </p>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          justifyContent: 'flex-end',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border)'
        }}>
          <Button variant="ghost" onClick={() => setShowDetalles(null)}>
            Cerrar
          </Button>
          <Button onClick={() => {
            handleEditarProducto(showDetalles.producto)
            setShowDetalles(null)
          }}>
            Editar Producto
          </Button>
        </div>
      </div>
    </div>
  )
}