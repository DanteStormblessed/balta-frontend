// components/FiltrosInventario.jsx
import React from 'react'
import { Button } from '../../../components/UI'
import { Search, Category, Warning, Refresh } from '@mui/icons-material'

export default function FiltrosInventario({ 
  filtro, 
  setFiltro, 
  categorias, 
  buscarProductos, 
  filtrarPorCategoria, 
  cargarDatos,
  inventario,
  inventarioFiltrado 
}) {
  const categoryOptions = categorias.map(c => ({ 
    value: c.idCategoria, 
    label: c.nombre 
  }))

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr auto', 
      gap: '1rem', 
      alignItems: 'flex-end', 
      marginBottom: '1.5rem' 
    }}>
      <div>
        <label className="field-label">
          <Search sx={{ fontSize: 20, marginRight: 1 }} />
          Buscar Producto
        </label>
        <input 
          type="text" 
          placeholder="Nombre del producto..." 
          value={filtro.buscar}
          onChange={(e) => {
            setFiltro({ ...filtro, buscar: e.target.value })
            buscarProductos(e.target.value)
          }}
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
        <label className="field-label">
          <Category sx={{ fontSize: 20, marginRight: 1 }} />
          Filtrar por Categoría
        </label>
        <select
          value={filtro.categoria}
          onChange={(e) => {
            setFiltro({ ...filtro, categoria: e.target.value })
            filtrarPorCategoria(e.target.value)
          }}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '2px solid var(--border)',
            borderRadius: '8px',
            fontSize: '1rem',
            background: 'var(--panel)'
          }}
        >
          <option value="all">Todas las categorías</option>
          {categoryOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="field-label" style={{ opacity: 0 }}>Filtros</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button 
            variant={filtro.stockBajo ? 'primary' : 'ghost'} 
            small 
            onClick={() => setFiltro({ ...filtro, stockBajo: !filtro.stockBajo })}
          >
            <Warning sx={{ fontSize: 20 }} />
            Bajo Stock
          </Button>
          <Button variant="ghost" small onClick={cargarDatos}>
            <Refresh sx={{ fontSize: 20 }} />
            Actualizar
          </Button>
        </div>
      </div>
    </div>
  )
}