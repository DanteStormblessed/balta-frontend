// src/pages/Inventario/components/TablaRecetas.jsx
import React from 'react'
import { Table, Button } from '../../../components/UI.jsx'
import { Edit, Visibility, Science } from '@mui/icons-material'

export default function TablaRecetas({ 
  productosFiltrados, 
  handleVerReceta,
  handleEditarReceta,
  handleCalcularCosto 
}) {
  const rows = productosFiltrados.map(producto => [
    producto.nombre || '-',
    producto.categoria?.nombre || '-',
    `$ ${(producto.precio || 0).toLocaleString('es-CL')}`,
    <div key={producto.idProducto} style={{ display: 'flex', gap: '0.5rem' }}>
      <Button
        small
        variant="ghost"
        onClick={() => handleVerReceta(producto)}
        title="Ver receta"
      >
        <Visibility sx={{ fontSize: 18 }} />
      </Button>
      <Button
        small
        variant="ghost"
        onClick={() => handleEditarReceta(producto)}
        style={{ background: '#4CAF50', color: 'white' }}
        title="Editar receta"
      >
        <Edit sx={{ fontSize: 18 }} />
      </Button>
      <Button
        small
        variant="ghost"
        onClick={() => handleCalcularCosto(producto)}
        style={{ background: '#2196F3', color: 'white' }}
        title="Calcular costo"
      >
        <Science sx={{ fontSize: 18 }} />
      </Button>
    </div>
  ])

  return (
    <Table
      columns={['Producto', 'Categoría', 'Precio', 'Acciones']}
      rows={rows}
    />
  )
}