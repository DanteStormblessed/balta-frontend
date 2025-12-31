// components/modals/ModalConfirmacion.jsx
import React from 'react'
import { Button } from '../../../../components/UI.jsx'
import { Warning, Delete } from '@mui/icons-material'

export default function ModalConfirmacion({
  showConfirmDelete,
  setShowConfirmDelete,
  handleEliminarProducto
}) {
  if (!showConfirmDelete) return null

  return (
    <div
      className="inventario-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '1rem',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        className="inventario-modal"
        style={{
          background: 'var(--panel)',
          padding: '2rem',
          borderRadius: '16px',
          minWidth: '400px',
          maxWidth: '90vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '2px solid var(--border)'
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid var(--border)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--error), #E57373)',
            padding: '0.75rem',
            borderRadius: '12px',
            color: 'white'
          }}>
            <Warning sx={{ fontSize: 24 }} />
          </div>
          <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.5rem' }}>
            Confirmar Eliminación
          </h3>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text)' }}>
            ¿Estás seguro de que deseas eliminar el producto?
          </p>
          <div style={{
            background: 'var(--accent)',
            padding: '1rem',
            borderRadius: '8px',
            borderLeft: '4px solid var(--error)'
          }}>
            <strong style={{ color: 'var(--error)' }}>Producto a eliminar:</strong>
            <p style={{ margin: '0.5rem 0 0 0', fontWeight: '600' }}>
              {showConfirmDelete.nombre}
            </p>
            {showConfirmDelete.categoria && (
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--muted)' }}>
                Categoría: {showConfirmDelete.categoria.nombre}
              </p>
            )}
          </div>
          <p style={{ margin: '1rem 0 0 0', color: 'var(--warning)', fontSize: '0.9rem' }}>
            ⚠️ Esta acción no se puede deshacer. Se eliminará el producto y su registro de inventario.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setShowConfirmDelete(null)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => handleEliminarProducto(showConfirmDelete)}
            style={{ background: 'var(--error)' }}
          >
            <Delete sx={{ fontSize: 20, marginRight: '0.5rem' }} />
            Eliminar Producto
          </Button>
        </div>
      </div>
    </div>
  )
}