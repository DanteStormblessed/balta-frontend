// Inventario.jsx - VERSIÓN FINAL CON TOOLBARS IGUALES
import React, { useState, useMemo } from 'react'
import { Card, Toolbar, Button } from '../../components/UI.jsx'
import { Add, TrendingDown } from '@mui/icons-material'
import { api } from '../../services/api/index.js'
 
// Importar componentes modulares
import { useInventario } from './hooks/useInventario'
import TablaInventario from './components/TablaInventario'
import TablaMateriales from './components/TablaMateriales'
import ModalProducto from './components/modals/ModalProducto'
import ModalAjusteStock from './components/modals/ModalAjusteStock'
import ModalDetalles from './components/modals/ModalDetalles'
import ModalConfirmacion from './components/modals/ModalConfirmacion'
import { 
  ModalMovimiento,
  ModalDetallesMaterial,
  ModalMaterial,
  ModalConfirmarEliminarMaterial
} from './components/modals/ModalesMateriales'
import { useInventarioMateriales } from './hooks/useInventarioMateriales'

export default function Inventario() {
  const {
    inventario,
    productos,
    categorias,
    loading,
    bajoStock,
    filtro,
    setFiltro,
    cargarDatos,
    buscarProductos,
    filtrarPorCategoria,
    ajustarStock,
    actualizarPrecio,
    actualizarCategoria,
    eliminarProducto
  } = useInventario()

  // Hook para materiales
  const {
    materiales: materialesInventario,
    loading: loadingMateriales,
    cargarDatos: cargarDatosMateriales
  } = useInventarioMateriales()

  // Estados de inventario
  const [showForm, setShowForm] = useState(false)
  const [showAjuste, setShowAjuste] = useState(false)
  const [showDetalles, setShowDetalles] = useState(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(null)
  const [productoEdit, setProductoEdit] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    idCategoria: '',
    cantidad: 0
  })
  const [ajusteData, setAjusteData] = useState({
    idProducto: '',
    cantidad: 0
  })

  // Estados
  const [vistaActual, setVistaActual] = useState('inventario')
  const [filtroMateriales, setFiltroMateriales] = useState({ buscar: '', stockBajo: false })

  // Estados para modales de materiales
  const [showMovimientoModal, setShowMovimientoModal] = useState(null)
  const [showAjusteMaterial, setShowAjusteMaterial] = useState(false)
  const [showDetallesMaterial, setShowDetallesMaterial] = useState(null)
  const [formMovimiento, setFormMovimiento] = useState({ cantidad: '' })
  const [ajusteMaterialData, setAjusteMaterialData] = useState({
    idProducto: '',
    cantidad: 0
  })

  // Estados para crear/editar materiales
  const [showFormMaterial, setShowFormMaterial] = useState(false)
  const [materialEdit, setMaterialEdit] = useState(null)
  const [formDataMaterial, setFormDataMaterial] = useState({
    nombre: '',
    descripcion: '',
    idUnidadMedida: '',
    stockMinimo: 10
  })
  const [unidadesMedida, setUnidadesMedida] = useState([])
  const [showConfirmDeleteMaterial, setShowConfirmDeleteMaterial] = useState(null)

  // Recargar datos cuando se cierre el modal de producto
  React.useEffect(() => {
    if (!showForm) {
      cargarDatos()
    }
  }, [showForm])

  // Cargar materiales al iniciar
  React.useEffect(() => {
    if (vistaActual === 'materiales' && materialesInventario.length === 0) {
      cargarDatosMateriales()
    }
  }, [vistaActual])

  // Cargar unidades de medida al iniciar
  React.useEffect(() => {
    const cargarUnidades = async () => {
      try {
        const unidades = await api.unidadesMedida.getAll()
        setUnidadesMedida(unidades)
      } catch (err) {
        console.error('Error cargando unidades:', err)
        setUnidadesMedida([])
      }
    }
    cargarUnidades()
  }, [])

  const inventarioFiltrado = useMemo(() => 
    inventario.filter(item => {
      const producto = item.producto || {}
      const nombreMatch = filtro.buscar === '' || 
        producto.nombre?.toLowerCase().includes(filtro.buscar.toLowerCase())
      const categoriaMatch = filtro.categoria === 'all' || 
        producto.categoria?.idCategoria === parseInt(filtro.categoria)
      const stockBajoMatch = !filtro.stockBajo || item.cantidadProducto <= 10
      
      return nombreMatch && categoriaMatch && stockBajoMatch
    }), [inventario, filtro]
  )

  const materialesFiltrados = useMemo(() =>
    materialesInventario.filter(material => {
      const nombreMatch = filtroMateriales.buscar === '' ||
        material.nombre?.toLowerCase().includes(filtroMateriales.buscar.toLowerCase())
      const stockBajoMatch = !filtroMateriales.stockBajo ||
        (material.stockActual || 0) < (material.stockMinimo || 10)
      
      return nombreMatch && stockBajoMatch
    }), [materialesInventario, filtroMateriales]
  )

  // ========== FUNCIONES DE INVENTARIO ==========
  
  const handleCrearProducto = async (e) => {
    e.preventDefault()
    try {
      const productoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        categoria: { idCategoria: parseInt(formData.idCategoria) }
      }

      const nuevoProducto = await api.productos.create(productoData)
      
      const inventarioData = {
        producto: { idProducto: nuevoProducto.idProducto },
        cantidadProducto: parseInt(formData.cantidad)
      }

      await api.inventario.registrar(inventarioData)
      
      setShowForm(false)
      setFormData({ nombre: '', descripcion: '', precio: 0, idCategoria: '', cantidad: 0 })
      await cargarDatos()
      alert('✅ Producto creado')
    } catch (error) {
      console.error('Error al crear producto:', error)
      alert('❌ Error al crear el producto')
    }
  }

  const handleAjusteStock = async (e) => {
    e.preventDefault()
    
    const delta = parseInt(ajusteData.cantidad)
    const idProducto = parseInt(ajusteData.idProducto)
    
    try {
      await ajustarStock(idProducto, delta)
      
      // ✅ RECARGAR MATERIALES TAMBIÉN
      await cargarDatosMateriales()
      
      setShowAjuste(false)
      setAjusteData({ idProducto: '', cantidad: 0 })
    } catch (error) {
      console.error('Error al ajustar stock:', error)
    }
  }

  const handleEditarProducto = (producto) => {
    setProductoEdit(producto)
    setFormData({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: producto.precio || 0,
      idCategoria: producto.categoria?.idCategoria || '',
      cantidad: inventario.find(i => i.producto?.idProducto === producto.idProducto)?.cantidadProducto || 0
    })
    setShowForm(true)
  }

  const handleActualizarProducto = async (e) => {
    e.preventDefault()
    try {
      await api.productos.update(productoEdit.idProducto, {
        ...productoEdit,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        categoria: { idCategoria: parseInt(formData.idCategoria) }
      })

      setShowForm(false)
      setProductoEdit(null)
      setFormData({ nombre: '', descripcion: '', precio: 0, idCategoria: '', cantidad: 0 })
      await cargarDatos()
      alert('✅ Producto actualizado')
    } catch (error) {
      console.error('Error al actualizar producto:', error)
      alert('❌ Error al actualizar el producto')
    }
  }

  const handleVerDetalles = (producto) => {
    const inventarioItem = inventario.find(i => i.producto?.idProducto === producto.idProducto)
    setShowDetalles({
      producto,
      inventario: inventarioItem
    })
  }

  const handleEliminarProducto = async (producto) => {
    const success = await eliminarProducto(producto)
    if (success) {
      setShowConfirmDelete(null)
    }
  }

  // ========== FUNCIONES DE MATERIALES ==========

  const handleRegistrarMovimiento = async (e) => {
    e.preventDefault()
    
    try {
      const cantidad = parseInt(formMovimiento.cantidad)
      
      if (cantidad === 0) {
        alert('⚠️ La cantidad no puede ser 0')
        return
      }

      if (cantidad > 0) {
        await api.inventarioMateriales.registrarEntrada(
          showMovimientoModal.idMaterial,
          cantidad,
          0,
          ''
        )
        alert('✅ Stock aumentado')
      } else {
        const stockActual = showMovimientoModal.stockActual || 0
        const cantidadSalida = Math.abs(cantidad)
        
        if (cantidadSalida > stockActual) {
          alert(`❌ Stock insuficiente. Stock actual: ${stockActual}`)
          return
        }
        
        await api.inventarioMateriales.registrarSalida(
          showMovimientoModal.idMaterial,
          cantidadSalida,
          ''
        )
        alert('✅ Stock reducido')
      }
      
      // ✅ RECARGAR DATOS EN LUGAR DE RELOAD
      await cargarDatosMateriales()
      setShowMovimientoModal(null)
      setFormMovimiento({ cantidad: '' })
      
    } catch (err) {
      console.error('Error al registrar movimiento:', err)
      alert('❌ Error al ajustar stock')
    }
  }

  const handleAjusteStockMaterial = async (e) => {
    e.preventDefault()
    
    try {
      const cantidad = parseInt(ajusteMaterialData.cantidad)
      const idMaterial = parseInt(ajusteMaterialData.idProducto)  // ✅ Leer de idProducto
      
      if (!idMaterial || isNaN(idMaterial)) {
        alert('⚠️ Debe seleccionar un material')
        return
      }
      
      if (cantidad === 0) {
        alert('⚠️ La cantidad no puede ser 0')
        return
      }

      if (cantidad > 0) {
        await api.inventarioMateriales.registrarEntrada(idMaterial, cantidad, 0, '')
      } else {
        const material = materialesInventario.find(m => m.idMaterial === idMaterial)
        const stockActual = material?.stockActual || 0
        const cantidadSalida = Math.abs(cantidad)
        
        if (cantidadSalida > stockActual) {
          alert(`❌ Stock insuficiente. Stock actual: ${stockActual}`)
          return
        }
        
        await api.inventarioMateriales.registrarSalida(idMaterial, cantidadSalida, '')
      }
      
      await cargarDatosMateriales()
      setShowAjusteMaterial(false)
      setAjusteMaterialData({ idProducto: '', cantidad: 0 })  // ✅ Reset con idProducto
      alert('✅ Stock ajustado')
      
    } catch (err) {
      console.error('Error al ajustar stock:', err)
      alert('❌ Error al ajustar stock')
    }
  }
  // ========== FUNCIONES DE GESTIÓN DE MATERIALES ==========

  const handleCrearMaterial = async (e) => {
    e.preventDefault()
    try {
      await api.materiales.create({
        nombre: formDataMaterial.nombre,
        descripcion: formDataMaterial.descripcion,
        unidadMedida: { idUnidadMedida: parseInt(formDataMaterial.idUnidadMedida) },
        stockMinimo: parseInt(formDataMaterial.stockMinimo) || 10
      })

      setShowFormMaterial(false)
      setFormDataMaterial({ nombre: '', descripcion: '', idUnidadMedida: '', stockMinimo: 10 })
      await cargarDatosMateriales()
      alert('✅ Material creado exitosamente')
    } catch (err) {
      console.error('Error al crear material:', err)
      alert('❌ Error al crear material')
    }
  }

  const handleEditarMaterial = (material) => {
    setMaterialEdit(material)
    setFormDataMaterial({
      nombre: material.nombre || '',
      descripcion: material.descripcion || '',
      idUnidadMedida: material.unidadMedida?.idUnidadMedida || '',
      stockMinimo: material.stockMinimo || 10
    })
    setShowFormMaterial(true)
  }

  const handleActualizarMaterial = async (e) => {
    e.preventDefault()
    try {
      await api.materiales.update(materialEdit.idMaterial, {
        nombre: formDataMaterial.nombre,
        descripcion: formDataMaterial.descripcion,
        unidadMedida: { idUnidadMedida: parseInt(formDataMaterial.idUnidadMedida) },
        stockMinimo: parseInt(formDataMaterial.stockMinimo) || 10
      })

      setShowFormMaterial(false)
      setMaterialEdit(null)
      setFormDataMaterial({ nombre: '', descripcion: '', idUnidadMedida: '', stockMinimo: 10 })
      await cargarDatosMateriales()
      alert('✅ Material actualizado exitosamente')
    } catch (err) {
      console.error('Error al actualizar material:', err)
      alert('❌ Error al actualizar material')
    }
  }

  const handleEliminarMaterial = async () => {
    if (!showConfirmDeleteMaterial) return

    try {
      await api.materiales.delete(showConfirmDeleteMaterial.idMaterial)
      await cargarDatosMateriales()
      setShowConfirmDeleteMaterial(null)
      alert('✅ Material eliminado')
    } catch (err) {
      console.error('Error al eliminar material:', err)
      alert('❌ Error al eliminar material')
    }
  }

  if (loading || loadingMateriales) {
    return <div className="stack inventario-page"><Card contentSx={{ p: { xs: 1.5, sm: 2.5, md: 3 } }}><p>Cargando...</p></Card></div>
  }

  return (
    <div className="stack inventario-page">
      <Card className="inventario-card" contentSx={{ p: { xs: 1.5, sm: 2.5, md: 3 } }}>
        {/* Tabs para cambiar entre vistas */}
        <div className="inventario-tabs" style={{ 
          display: 'flex', 
          gap: '0.5rem',
          borderBottom: '2px solid var(--border)',
          marginBottom: '1.25rem'
        }}>
          <Button
            variant={vistaActual === 'inventario' ? 'primary' : 'ghost'}
            onClick={() => setVistaActual('inventario')}
            style={{
              borderRadius: '8px 8px 0 0',
              borderBottom: vistaActual === 'inventario' ? '3px solid var(--brand)' : 'none'
            }}
          >
            📦 Productos
          </Button>
          <Button
            variant={vistaActual === 'materiales' ? 'primary' : 'ghost'}
            onClick={() => setVistaActual('materiales')}
            style={{
              borderRadius: '8px 8px 0 0',
              borderBottom: vistaActual === 'materiales' ? '3px solid var(--brand)' : 'none'
            }}
          >
            🧵 Materiales
          </Button>
        </div>

        {/* VISTA DE INVENTARIO */}
        {vistaActual === 'inventario' && (
          <>
            {/* Barra de búsqueda y filtros directos */}
            <div className="inventario-filtros" style={{ 
              display: 'grid',
              gridTemplateColumns: '2fr 1fr auto',
              gap: '0.75rem',
              marginBottom: '1.25rem'
            }}>
              <input
                type="text"
                placeholder="🔍 Buscar producto por nombre..."
                value={filtro.buscar}
                onChange={(e) => {
                  setFiltro(prev => ({ ...prev, buscar: e.target.value }))
                  buscarProductos(e.target.value)
                }}
                style={{
                  padding: 'clamp(0.55rem, 2vw, 0.75rem)',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: 'clamp(0.9rem, 2.6vw, 1rem)'
                }}
              />

              <select
                value={filtro.categoria}
                onChange={(e) => {
                  setFiltro(prev => ({ ...prev, categoria: e.target.value }))
                  filtrarPorCategoria(e.target.value)
                }}
                style={{
                  padding: 'clamp(0.55rem, 2vw, 0.75rem)',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: 'clamp(0.9rem, 2.6vw, 1rem)'
                }}
              >
                <option value="all">📂 Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat.idCategoria} value={cat.idCategoria}>
                    {cat.nombre}
                  </option>
                ))}
              </select>

              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                fontSize: 'clamp(0.85rem, 2.4vw, 0.95rem)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                padding: '0 0.5rem'
              }}>
                <input
                  type="checkbox"
                  checked={filtro.stockBajo}
                  onChange={(e) => setFiltro(prev => ({ ...prev, stockBajo: e.target.checked }))}
                />
                ⚠️ Stock bajo
              </label>
            </div>

            {/* Toolbar con botones de acción - SIN ACTUALIZAR */}
            <Toolbar className="inventario-toolbar" style={{ marginBottom: '1.25rem' }}>
              <Button onClick={() => { setProductoEdit(null); setShowForm(true); }}>
                <Add sx={{ fontSize: { xs: 18, sm: 20 } }} />
                Agregar producto
              </Button>
              <Button variant="ghost" onClick={() => setShowAjuste(true)}>
                <TrendingDown sx={{ fontSize: { xs: 18, sm: 20 } }} />
                Ajustar stock
              </Button>
              <div style={{ flex: 1 }} />
              <span className="inventario-contador" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                Mostrando {inventarioFiltrado.length} de {inventario.length} productos
              </span>
            </Toolbar>
            
            <TablaInventario
              inventarioFiltrado={inventarioFiltrado}
              categorias={categorias}
              ajustarStock={ajustarStock}
              actualizarPrecio={actualizarPrecio}
              actualizarCategoria={actualizarCategoria}
              handleVerDetalles={handleVerDetalles}
              handleEditarProducto={handleEditarProducto}
              setShowConfirmDelete={setShowConfirmDelete}
            />
          </>
        )}

        {/* VISTA DE MATERIALES */}
        {vistaActual === 'materiales' && (
          <>
            <div className="inventario-filtros" style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr auto', 
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <input
                type="text"
                placeholder="🔍 Buscar material..."
                value={filtroMateriales.buscar}
                onChange={(e) => setFiltroMateriales(prev => ({ ...prev, buscar: e.target.value }))}
                style={{
                  padding: 'clamp(0.55rem, 2vw, 0.75rem)',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: 'clamp(0.9rem, 2.6vw, 1rem)'
                }}
              />

              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                fontSize: 'clamp(0.85rem, 2.4vw, 0.9rem)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}>
                <input
                  type="checkbox"
                  checked={filtroMateriales.stockBajo}
                  onChange={(e) => setFiltroMateriales(prev => ({ ...prev, stockBajo: e.target.checked }))}
                />
                ⚠️ Bajo stock
              </label>
            </div>

            {/* Toolbar igual que productos */}
            <Toolbar className="inventario-toolbar" style={{ marginBottom: '1.25rem' }}>
              <Button onClick={() => { setMaterialEdit(null); setShowFormMaterial(true); }}>
                <Add sx={{ fontSize: { xs: 18, sm: 20 } }} />
                Agregar material
              </Button>
              <Button variant="ghost" onClick={() => setShowAjusteMaterial(true)}>
                <TrendingDown sx={{ fontSize: { xs: 18, sm: 20 } }} />
                Ajustar stock
              </Button>
              <div style={{ flex: 1 }} />
              <span className="inventario-contador" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                Mostrando {materialesFiltrados.length} de {materialesInventario.length} materiales
              </span>
            </Toolbar>

            <TablaMateriales
              materialesFiltrados={materialesFiltrados}
              setShowDetallesMaterial={setShowDetallesMaterial}
              handleEditarMaterial={handleEditarMaterial}
              setShowConfirmDeleteMaterial={setShowConfirmDeleteMaterial}
            />
          </>
        )}
      </Card>

      {/* MODALES DE INVENTARIO */}
      <ModalProducto
        showForm={showForm}
        setShowForm={setShowForm}
        productoEdit={productoEdit}
        setProductoEdit={setProductoEdit}
        formData={formData}
        setFormData={setFormData}
        categorias={categorias}
        handleCrearProducto={handleCrearProducto}
        handleActualizarProducto={handleActualizarProducto}
      />

      <ModalAjusteStock
        showAjuste={showAjuste}
        setShowAjuste={setShowAjuste}
        ajusteData={ajusteData}
        setAjusteData={setAjusteData}
        productos={productos}
        handleAjusteStock={handleAjusteStock}
      />

      <ModalDetalles
        showDetalles={showDetalles}
        setShowDetalles={setShowDetalles}
        handleEditarProducto={handleEditarProducto}
      />

      <ModalConfirmacion
        showConfirmDelete={showConfirmDelete}
        setShowConfirmDelete={setShowConfirmDelete}
        handleEliminarProducto={handleEliminarProducto}
      />

      {/* MODALES DE MATERIALES */}
      <ModalAjusteStock
        showAjuste={showAjusteMaterial}
        setShowAjuste={setShowAjusteMaterial}
        ajusteData={ajusteMaterialData}
        setAjusteData={setAjusteMaterialData}
        productos={materialesInventario.map(m => ({
          idProducto: m.idMaterial,  // ✅ Mapear idMaterial a idProducto
          nombre: m.nombre
        }))}
        handleAjusteStock={handleAjusteStockMaterial}
      />

      <ModalDetallesMaterial
        showDetallesMaterial={showDetallesMaterial}
        setShowDetallesMaterial={setShowDetallesMaterial}
      />

      <ModalMaterial
        showForm={showFormMaterial}
        setShowForm={setShowFormMaterial}
        materialEdit={materialEdit}
        setMaterialEdit={setMaterialEdit}
        formData={formDataMaterial}
        setFormData={setFormDataMaterial}
        unidadesMedida={unidadesMedida}
        handleSubmit={materialEdit ? handleActualizarMaterial : handleCrearMaterial}
      />

      <ModalConfirmarEliminarMaterial
        showConfirmDelete={showConfirmDeleteMaterial}
        setShowConfirmDelete={setShowConfirmDeleteMaterial}
        handleEliminarMaterial={handleEliminarMaterial}
      />
    </div>
  )
}