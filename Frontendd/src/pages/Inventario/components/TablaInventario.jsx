// src/pages/Inventario/components/TablaInventario.jsx
import React from 'react'
import { Table, Button } from '../../../components/UI.jsx'
import { Visibility, Edit, Delete } from '@mui/icons-material'

export default function TablaInventario({ 
  inventarioFiltrado,
  categorias,
  ajustarStock,
  actualizarPrecio,
  actualizarCategoria,
  handleVerDetalles,
  handleEditarProducto,
  setShowConfirmDelete
}) {
  const rows = inventarioFiltrado.map(item => {
    const producto = item.producto || {}
    
    return [
      producto.nombre || '-',
      `${item.cantidadProducto || 0}`,
      `$ ${(producto.precio || 0).toLocaleString('es-CL')}`,
      producto.categoria?.nombre || '-',
      <div
        key={producto.idProducto}
        style={{ display: 'flex', gap: '0.25rem', flexWrap: 'nowrap', alignItems: 'center' }}
      >
        <Button
          small
          variant="ghost"
          onClick={() => handleVerDetalles(producto)}
          title="Ver detalles"
          style={{ minWidth: 0, padding: '0 0.4rem', height: 28, minHeight: 28 }}
        >
          <Visibility sx={{ fontSize: { xs: 15, sm: 18 } }} />
        </Button>
        <Button
          small
          variant="ghost"
          onClick={() => handleEditarProducto(producto)}
          style={{
            background: '#4CAF50',
            color: 'white',
            minWidth: 0,
            padding: '0 0.4rem',
            height: 28,
            minHeight: 28
          }}
          title="Editar producto"
        >
          <Edit sx={{ fontSize: { xs: 15, sm: 18 } }} />
        </Button>
        <Button
          small
          variant="ghost"
          onClick={() => setShowConfirmDelete(producto)}
          style={{
            background: 'var(--error)',
            color: 'white',
            minWidth: 0,
            padding: '0 0.4rem',
            height: 28,
            minHeight: 28
          }}
          title="Eliminar producto"
        >
          <Delete sx={{ fontSize: { xs: 15, sm: 18 } }} />
        </Button>
      </div>
    ]
  })

  return (
    <Table
      className="inventario-table"
      columns={['Producto', 'Stock', 'Precio', 'Categoría', 'Acciones']}
      rows={rows}
    />
  )
}