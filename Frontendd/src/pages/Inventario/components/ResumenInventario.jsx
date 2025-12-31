// components/ResumenInventario.jsx
import React from 'react'
import { Card } from '../../../components/UI'
import { Inventory, Warning, TrendingUp } from '@mui/icons-material'

export default function ResumenInventario({ productos, bajoStock, inventario }) {
  const valorTotal = inventario.reduce((total, item) => {
    const precio = item.producto?.precio || 0
    const cantidad = item.cantidadProducto || 0
    return total + (precio * cantidad)
  }, 0)

  const resumen = [
    { 
      label: 'N° de Productos', 
      value: productos.length.toString(),
      icon: <Inventory sx={{ fontSize: 32, color: 'var(--brand)' }} />,
      trend: 'neutral'
    },
    { 
      label: 'N° Productos con Bajo Stock', 
      value: bajoStock.length.toString(),
      icon: <Warning sx={{ fontSize: 32, color: 'var(--warning)' }} />,
      trend: 'down'
    },
    { 
      label: 'Valor total del Inventario Actual', 
      value: `$ ${Math.round(valorTotal).toLocaleString('es-CL')}`,
      icon: <TrendingUp sx={{ fontSize: 32, color: 'var(--success)' }} />,
      trend: 'up'
    },
  ]

  return (
    <Card title="Resumen de Inventario" subtitle="Vista general del stock y productos" accent="accent">
      <div className="stats">
        {resumen.map((r, index) => (
          <div key={r.label} className="stat">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              {r.icon}
              <span style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                background: r.trend === 'up' ? '#E8F5E8' : r.trend === 'down' ? '#FFEBEE' : '#F3E5F5',
                color: r.trend === 'up' ? '#2E7D32' : r.trend === 'down' ? '#C62828' : '#7B1FA2'
              }}>
                {r.trend === 'up' ? '↑' : r.trend === 'down' ? '↓' : '→'}
              </span>
            </div>
            <span className="stat-label">{r.label}</span>
            <span className="stat-value">{r.value}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}