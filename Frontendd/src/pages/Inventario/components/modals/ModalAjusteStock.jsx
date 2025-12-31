// components/modals/ModalAjusteStock.jsx - SIN MOTIVO
import React from 'react'
import { Button } from '../../../../components/UI'
import { TrendingDown } from '@mui/icons-material'

export default function ModalAjusteStock({
  showAjuste,
  setShowAjuste,
  ajusteData,
  setAjusteData,
  productos,
  handleAjusteStock
}) {
  if (!showAjuste) return null

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
          width: '90%',
          maxWidth: '500px',
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
            background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
            padding: '0.75rem',
            borderRadius: '12px',
            color: 'white'
          }}>
            <TrendingDown />
          </div>
          <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.5rem' }}>
            Ajustar Stock
          </h3>
        </div>

        <form onSubmit={handleAjusteStock} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Producto <span style={{ color: '#f97066' }}>*</span>
            </label>
            <select
              value={ajusteData.idProducto}
              onChange={(e) => setAjusteData(prev => ({ ...prev, idProducto: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            >
              <option value="">Seleccionar producto</option>
              {productos.map(prod => (
                <option key={prod.idProducto} value={prod.idProducto}>
                  {prod.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Cantidad <span style={{ color: '#f97066' }}>*</span>
            </label>
            <input
              type="number"
              value={ajusteData.cantidad}
              onChange={(e) => setAjusteData(prev => ({ ...prev, cantidad: e.target.value }))}
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
                setShowAjuste(false)
                setAjusteData({ idProducto: '', cantidad: 0 })
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Ajustar Stock
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}