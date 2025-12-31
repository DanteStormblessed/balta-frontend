// TablaMateriales.jsx - SIN BOTÓN DE AJUSTAR STOCK EN ACCIONES
import React from 'react'
import { Table, Button } from '../../../components/UI.jsx'
import { Visibility, Edit, Delete } from '@mui/icons-material'

export default function TablaMateriales({ 
  materialesFiltrados,
  setShowDetallesMaterial,
  handleEditarMaterial,
  setShowConfirmDeleteMaterial
}) {
  const getStockStatus = (material) => {
    const stock = material.stockActual || 0
    const stockMinimo = material.stockMinimo || 10
    
    if (stock === 0) return { text: 'Sin Stock', color: '#F44336' }
    if (stock < stockMinimo) return { text: 'Bajo', color: '#FF9800' }
    if (stock <= stockMinimo * 2) return { text: 'Medio', color: '#FFC107' }
    return { text: 'OK', color: '#4CAF50' }
  }

  const rows = materialesFiltrados.map(material => {
    const status = getStockStatus(material)
    return [
      material.nombre || '-',
      `${material.stockActual || 0} ${material.unidadMedida?.abreviatura || ''}`,
      `${material.stockMinimo || 10} ${material.unidadMedida?.abreviatura || ''}`,
      <span 
        key={`status-${material.idMaterial}`}
        style={{ 
          color: status.color, 
          fontWeight: '600',
          padding: '0.2rem 0.45rem',
          borderRadius: '4px',
          background: `${status.color}15`
        }}
      >
        {status.text}
      </span>,
      <div
        key={material.idMaterial}
        style={{ display: 'flex', gap: '0.25rem', flexWrap: 'nowrap', alignItems: 'center' }}
      >
        <Button 
          small 
          variant="ghost" 
          onClick={() => setShowDetallesMaterial(material)}
          title="Ver detalles"
          style={{ minWidth: 0, padding: '0 0.4rem', height: 28, minHeight: 28 }}
        >
          <Visibility sx={{ fontSize: { xs: 15, sm: 18 } }} />
        </Button>
        <Button 
          small 
          variant="ghost" 
          onClick={() => handleEditarMaterial(material)}
          title="Editar material"
          style={{ minWidth: 0, padding: '0 0.4rem', height: 28, minHeight: 28 }}
        >
          <Edit sx={{ fontSize: { xs: 15, sm: 18 } }} />
        </Button>
        <Button 
          small 
          variant="ghost" 
          onClick={() => setShowConfirmDeleteMaterial(material)}
          style={{
            color: '#f97066',
            minWidth: 0,
            padding: '0 0.4rem',
            height: 28,
            minHeight: 28
          }}
          title="Eliminar material"
        >
          <Delete sx={{ fontSize: { xs: 15, sm: 18 } }} />
        </Button>
      </div>
    ]
  })

  return (
    <Table
      className="inventario-table"
      columns={['Material', 'Stock', 'Stock Mínimo', 'Estado', 'Acciones']}
      rows={rows}
    />
  )
}