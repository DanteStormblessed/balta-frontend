// components/modals/ModalProducto.jsx - VERSIÓN SIMPLIFICADA SIN BOTÓN EDITAR
import React, { useState, useEffect } from 'react'
import { Button } from '../../../../components/UI'
import { Add, Delete, ShoppingCart } from '@mui/icons-material'
import { api } from '../../../../services/api'

export default function ModalProducto({
  showForm,
  setShowForm,
  productoEdit,
  setProductoEdit,
  formData,
  setFormData,
  categorias,
  handleCrearProducto,
  handleActualizarProducto
}) {
  const [receta, setReceta] = useState([])
  const [materiales, setMateriales] = useState([])

  // Cargar materiales y receta cuando se abre el modal
  useEffect(() => {
    if (showForm) {
      cargarMateriales()
      if (productoEdit) {
        cargarReceta()
      }
    }
  }, [showForm, productoEdit])

  const cargarMateriales = async () => {
    try {
      const materialesData = await api.materiales.getAll()
      setMateriales(materialesData)
    } catch (err) {
      console.error('Error cargando materiales:', err)
    }
  }

  const cargarReceta = async () => {
    if (!productoEdit?.idProducto) return
    
    try {
      const recetaData = await api.recetas.getMaterialesPorProducto(productoEdit.idProducto)
      setReceta(recetaData || [])
    } catch (err) {
      console.error('Error cargando receta:', err)
      setReceta([])
    }
  }

  const agregarMaterial = () => {
    setReceta([...receta, { idMaterial: '', cantidad: 1 }])
  }

  const actualizarMaterial = (index, campo, valor) => {
    const nuevaReceta = [...receta]
    nuevaReceta[index][campo] = valor
    setReceta(nuevaReceta)
  }

  const eliminarMaterial = async (index) => {
    const item = receta[index]
    
    // Si es un material existente (tiene idMaterialProducto), eliminarlo de la BD
    if (item.idMaterialProducto) {
      try {
        await api.recetas.eliminarMaterial(item.idMaterialProducto)
        alert('✅ Material eliminado de la receta')
      } catch (err) {
        console.error('Error al eliminar material:', err)
        alert('❌ Error al eliminar material')
        return
      }
    }
    
    // Eliminar del estado local
    const nuevaReceta = receta.filter((_, i) => i !== index)
    setReceta(nuevaReceta)
  }

  const validarStock = () => {
    for (const item of receta) {
      if (!item.idMaterial && !item.material?.idMaterial) continue
      
      const idMaterial = item.material?.idMaterial || item.idMaterial
      const material = materiales.find(m => m.idMaterial === parseInt(idMaterial))
      
      if (!material) continue
      
      const cantidadNecesaria = item.cantidad * (formData.cantidad || 1)
      const stockActual = material.stockActual || 0
      
      if (cantidadNecesaria > stockActual) {
        return {
          valido: false,
          mensaje: `❌ Stock insuficiente de ${material.nombre}. Necesitas ${cantidadNecesaria} ${material.unidadMedida?.abreviatura}, disponible: ${stockActual}`
        }
      }
    }
    
    return { valido: true }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar stock solo si hay receta y es creación de producto
    if (receta.length > 0 && !productoEdit) {
      const validacionStock = validarStock()
      if (!validacionStock.valido) {
        alert(validacionStock.mensaje)
        return
      }
    }

    // Preparar datos del producto
    const productoData = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio: parseFloat(formData.precio),
      categoria: formData.idCategoria ? { idCategoria: parseInt(formData.idCategoria) } : null
    }

    try {
      let productoGuardado
      if (productoEdit) {
        // Editar producto existente
        productoGuardado = await api.productos.update(productoEdit.idProducto, productoData)
        
        // Actualizar cantidades de materiales existentes
        for (const item of receta) {
          if (item.idMaterialProducto) {
            // Es un material existente - eliminar y volver a agregar con nueva cantidad
            const idMaterial = item.material?.idMaterial || item.idMaterial
            
            if (idMaterial) {
              try {
                // Eliminar el material viejo
                await api.recetas.eliminarMaterial(item.idMaterialProducto)
                
                // Agregar con la nueva cantidad
                await api.recetas.agregarMaterial({
                  producto: { idProducto: parseInt(productoEdit.idProducto) },
                  material: { idMaterial: parseInt(idMaterial) },
                  cantidad: parseInt(item.cantidad)
                })
              } catch (error) {
                console.error('Error actualizando material:', error)
              }
            }
          } else if (item.idMaterial) {
            // Es un material nuevo - agregarlo
            await api.recetas.agregarMaterial({
              producto: { idProducto: productoEdit.idProducto },
              material: { idMaterial: parseInt(item.idMaterial) },
              cantidad: parseInt(item.cantidad)
            })
          }
        }
        
      } else {
        // Crear nuevo producto
        productoGuardado = await api.productos.create(productoData)
        
        // Crear inventario inicial
        if (formData.cantidad > 0) {
          const inventarioData = {
            producto: { idProducto: productoGuardado.idProducto },
            cantidadProducto: parseInt(formData.cantidad)
          }
          await api.inventario.registrar(inventarioData)
        }

        // Crear receta si hay materiales
        if (receta.length > 0) {
          for (const item of receta) {
            if (item.idMaterial) {
              await api.recetas.agregarMaterial({
                producto: { idProducto: productoGuardado.idProducto },
                material: { idMaterial: parseInt(item.idMaterial) },
                cantidad: parseInt(item.cantidad)
              })
            }
          }

          // Consumir materiales del inventario
          for (const item of receta) {
            if (item.idMaterial && item.cantidad) {
              const cantidadTotal = item.cantidad * (formData.cantidad || 1)
              try {
                await api.inventarioMateriales.registrarSalida(
                  parseInt(item.idMaterial),
                  cantidadTotal,
                  `Producción de producto: ${formData.nombre}`
                )
              } catch (consumoError) {
                console.warn(`Error al consumir material ${item.idMaterial}:`, consumoError)
                alert(`Advertencia: No se pudo consumir el material. Verifique el stock disponible.`)
              }
            }
          }
        }
      }

      // Éxito - limpiar y cerrar
      setShowForm(false)
      setProductoEdit(null)
      setFormData({ nombre: '', descripcion: '', precio: 0, idCategoria: '', cantidad: 0 })
      setReceta([])
      
      alert('✅ Producto guardado exitosamente')
      
    } catch (error) {
      console.error('Error al guardar producto:', error)
      alert('❌ Error al guardar el producto: ' + (error.message || 'Error desconocido'))
    }
  }

  if (!showForm) return null

  const esEdicion = !!productoEdit

  return (
    <div className="inventario-modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '1rem',
      backdropFilter: 'blur(4px)'
    }}>
      <div className="inventario-modal" style={{
        background: 'var(--panel)',
        padding: '2rem',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: '2px solid var(--border)'
      }}>
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
            <ShoppingCart />
          </div>
          <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.5rem' }}>
            {esEdicion ? 'Editar Producto' : 'Nuevo Producto'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Información del Producto */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Nombre <span style={{ color: '#f97066' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              required
              placeholder="Nombre del producto"
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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              rows={3}
              placeholder="Descripción del producto..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border)',
                borderRadius: '8px',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Precio <span style={{ color: '#f97066' }}>*</span>
              </label>
              <input
                type="number"
                value={formData.precio}
                onChange={(e) => setFormData(prev => ({ ...prev, precio: e.target.value }))}
                required
                min="0"
                step="1"
                placeholder="0"
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Categoría <span style={{ color: '#f97066' }}>*</span>
              </label>
              <select
                value={formData.idCategoria}
                onChange={(e) => setFormData(prev => ({ ...prev, idCategoria: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map(cat => (
                  <option key={cat.idCategoria} value={cat.idCategoria}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!esEdicion && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Cantidad Inicial
              </label>
              <input
                type="number"
                value={formData.cantidad}
                onChange={(e) => setFormData(prev => ({ ...prev, cantidad: e.target.value }))}
                min="0"
                step="1"
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
          )}

          {/* Receta del Producto */}
          <div style={{
            padding: '1.5rem',
            background: 'var(--bg)',
            borderRadius: '12px',
            border: '2px solid var(--border)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                Receta del Producto
              </h4>
              <Button
                type="button"
                variant="ghost"
                small
                onClick={agregarMaterial}
              >
                <Add sx={{ fontSize: 16 }} />
                Agregar Material
              </Button>
            </div>

            {/* Lista de materiales en la receta */}
            {receta.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                {receta.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr auto',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: 'var(--panel)',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                      alignItems: 'center'
                    }}
                  >
                    {/* Material */}
                    <div>
                      <span style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text)' }}>
                        Material
                      </span>
                      <select
                        value={item.material?.idMaterial || item.idMaterial || ''}
                        onChange={(e) => actualizarMaterial(index, 'idMaterial', e.target.value)}
                        disabled={!!item.idMaterialProducto}
                        required
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          fontSize: '0.9rem',
                          background: item.idMaterialProducto ? '#f5f5f5' : 'white',
                          cursor: item.idMaterialProducto ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <option value="">Seleccionar material</option>
                        {materiales.map(material => (
                          <option key={material.idMaterial} value={material.idMaterial}>
                            {material.nombre} ({material.unidadMedida?.abreviatura}) - Stock: {material.stockActual}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Cantidad (siempre editable) */}
                    <div>
                      <span style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text)' }}>
                        Cantidad
                      </span>
                      <input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => {
                          const valor = e.target.value
                          actualizarMaterial(index, 'cantidad', valor === '' ? 0 : parseInt(valor))
                        }}
                        min="1"
                        step="1"
                        required
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          fontSize: '0.9rem',
                          background: 'white',
                          cursor: 'text'
                        }}
                      />
                    </div>

                    {/* Botón eliminar */}
                    <Button
                      type="button"
                      variant="ghost"
                      small
                      onClick={() => eliminarMaterial(index)}
                      style={{ background: 'var(--error)', color: 'white', marginTop: '1.5rem' }}
                    >
                      <Delete sx={{ fontSize: 16 }} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {receta.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: 'var(--muted)',
                fontSize: '0.9rem'
              }}>
                No hay materiales en la receta. Haz click en "Agregar Material" para comenzar.
              </div>
            )}
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
                setShowForm(false)
                setProductoEdit(null)
                setFormData({ nombre: '', descripcion: '', precio: 0, idCategoria: '', cantidad: 0 })
                setReceta([])
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {esEdicion ? 'Actualizar' : 'Crear'} Producto
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}