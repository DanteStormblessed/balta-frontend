import React from 'react';
import { Button } from '../../../components/UI.jsx';
import { ShoppingCart } from '@mui/icons-material';

export default function DetallesProductosModal({ detalles, onClose }) {
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(0, 0, 0, 0.6)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 10000, 
      padding: '1rem' 
    }} onClick={onClose}>
      <div style={{ 
        background: 'var(--panel)', 
        borderRadius: '16px', 
        padding: '2rem', 
        maxWidth: '500px', 
        width: '100%', 
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: '2px solid var(--border)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
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
            <ShoppingCart sx={{ fontSize: 24 }} />
          </div>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.5rem', 
            color: 'var(--text)', 
            fontWeight: '600' 
          }}>
            Productos Vendidos
          </h3>
        </div>
        
        <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1.5rem' }}>
          {detalles.map((detalle, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: 'var(--accent)',
              borderRadius: '8px',
              marginBottom: '0.5rem',
              borderLeft: '4px solid var(--brand)'
            }}>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                  {detalle.producto?.nombre || 'Producto no disponible'}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                  ${Math.round(detalle.precioUnitario || 0).toLocaleString('es-CL')} c/u
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '600', color: 'var(--brand)' }}>
                  {detalle.cantidad} und
                </div>
                <div style={{ fontWeight: '600', color: 'var(--success)' }}>
                  ${Math.round(detalle.subtotal || 0).toLocaleString('es-CL')}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <Button onClick={onClose} style={{ width: '100%' }}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}