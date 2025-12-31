import React from 'react';
import { Button } from '../../../components/UI.jsx';
import { Description } from '@mui/icons-material';

export default function ObservacionesModal({ observaciones, onClose }) {
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
        maxWidth: '600px', 
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
            <Description sx={{ fontSize: 24 }} />
          </div>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.5rem', 
            color: 'var(--text)', 
            fontWeight: '600' 
          }}>
            Observaciones de la Venta
          </h3>
        </div>
        <div style={{ 
          background: 'var(--accent)', 
          padding: '1.5rem', 
          borderRadius: '12px', 
          borderLeft: '4px solid var(--brand)',
          marginBottom: '1.5rem' 
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: '1.05rem', 
            lineHeight: '1.6', 
            color: 'var(--text)', 
            whiteSpace: 'pre-wrap' 
          }}>
            {observaciones}
          </p>
        </div>
        <Button onClick={onClose} style={{ width: '100%' }}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}