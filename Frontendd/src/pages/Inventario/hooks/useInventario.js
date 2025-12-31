// hooks/useInventario.js
import { useState, useEffect } from 'react'
import { api } from '../../../services/api/index'

export function useInventario() {
  const [inventario, setInventario] = useState([])
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [bajoStock, setBajoStock] = useState([])
  const [filtro, setFiltro] = useState({ 
    buscar: '', 
    categoria: 'all',
    stockBajo: false 
  })

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [inv, prods, cats, bajoStockData] = await Promise.all([
        api.inventario.getAll().catch(() => []),
        api.productos.getAll().catch(() => []),
        api.categorias.getAll().catch(() => []),
        api.inventario.getBajoStock(10).catch(() => [])
      ])
      
      setInventario(inv)
      setProductos(prods)
      setCategorias(cats)
      setBajoStock(bajoStockData)
    } catch (error) {
      console.error('Error al cargar inventario:', error)
    } finally {
      setLoading(false)
    }
  }

  const buscarProductos = async (termino) => {
    if (!termino.trim()) {
      cargarDatos()
      return
    }
    
    try {
      const resultados = await api.productos.buscar(termino)
      setProductos(resultados)
      
      const inventarioFiltrado = await Promise.all(
        resultados.map(async (producto) => {
          try {
            const inventarioItem = await api.inventario.getPorProducto(producto.idProducto)
            return inventarioItem
          } catch {
            return null
          }
        })
      )
      
      setInventario(inventarioFiltrado.filter(item => item !== null))
    } catch (error) {
      console.error('Error en búsqueda:', error)
    }
  }

  const filtrarPorCategoria = async (idCategoria) => {
    if (idCategoria === 'all') {
      cargarDatos()
      return
    }
    
    try {
      const productosFiltrados = await api.productos.getPorCategoria(idCategoria)
      setProductos(productosFiltrados)
      
      const inventarioFiltrado = await Promise.all(
        productosFiltrados.map(async (producto) => {
          try {
            const inventarioItem = await api.inventario.getPorProducto(producto.idProducto)
            return inventarioItem
          } catch {
            return null
          }
        })
      )
      
      setInventario(inventarioFiltrado.filter(item => item !== null))
    } catch (error) {
      console.error('Error al filtrar por categoría:', error)
    }
  }

  const consumirMaterialesParaProducto = async (idProducto, cantidad) => {
    try {
      console.log('🔧 Iniciando consumo de materiales...')
      console.log('📦 Producto ID:', idProducto)
      console.log('📊 Cantidad a producir:', cantidad)

      // Obtener la receta del producto
      const receta = await api.recetas.getMaterialesPorProducto(idProducto)
      
      console.log('📋 Receta obtenida:', receta)

      if (!receta || receta.length === 0) {
        throw new Error('El producto no tiene receta definida. No se puede producir.')
      }
      
      // Verificar stock ANTES de consumir
      const materialesInsuficientes = []
      
      for (const item of receta) {
        if (item.material && item.cantidad) {
          const cantidadNecesaria = parseFloat(item.cantidad) * cantidad
          const stockActual = item.material.stockActual || 0
          
          console.log(`📌 Material: ${item.material.nombre}`)
          console.log(`   Stock actual: ${stockActual}`)
          console.log(`   Cantidad necesaria: ${cantidadNecesaria}`)
          
          if (stockActual < cantidadNecesaria) {
            materialesInsuficientes.push({
              nombre: item.material.nombre,
              necesario: cantidadNecesaria,
              disponible: stockActual,
              faltante: cantidadNecesaria - stockActual
            })
          }
        }
      }
      
      // Si hay materiales insuficientes, mostrar error detallado
      if (materialesInsuficientes.length > 0) {
        let mensaje = '❌ Stock insuficiente de materiales:\n\n'
        materialesInsuficientes.forEach(mat => {
          mensaje += `• ${mat.nombre}:\n`
          mensaje += `  Necesario: ${mat.necesario}\n`
          mensaje += `  Disponible: ${mat.disponible}\n`
          mensaje += `  Faltante: ${mat.faltante}\n\n`
        })
        throw new Error(mensaje)
      }
      
      // Si hay suficiente stock, consumir materiales
      console.log('✅ Stock suficiente, procediendo a consumir materiales...')
      
      for (const item of receta) {
        if (item.material && item.cantidad) {
          const cantidadTotal = parseFloat(item.cantidad) * cantidad
          
          console.log(`🔻 Registrando salida:`)
          console.log(`   Material ID: ${item.material.idMaterial}`)
          console.log(`   Cantidad: ${cantidadTotal}`)
          
          await api.inventarioMateriales.registrarSalida(
            item.material.idMaterial,
            cantidadTotal,
            `Producción de ${cantidad} unidad(es) del producto`
          )
          
          console.log(`✅ Salida registrada para ${item.material.nombre}`)
        }
      }
      
      console.log('✅ Todos los materiales consumidos correctamente')
      
      // ✅ IMPORTANTE: Notificar que se deben recargar los materiales
      // Esto se hará desde Inventario.jsx después de llamar a ajustarStock
      
    } catch (error) {
      console.error('❌ Error al consumir materiales:', error)
      throw error
    }
  }

  const ajustarStock = async (idProducto, delta) => {
    try {
      // 1. Ajustar el stock en el inventario
      await api.inventario.ajustarCantidad(idProducto, delta)
      
      // 2. Si es un aumento de stock (delta > 0), intentar consumir materiales
      if (delta > 0) {
        try {
          await consumirMaterialesParaProducto(idProducto, delta)
          console.log('✅ Materiales consumidos correctamente')
        } catch (materialError) {
          console.warn('⚠️ No se pudieron consumir materiales:', materialError.message)
          
          if (materialError.message.includes('Stock insuficiente')) {
            await api.inventario.ajustarCantidad(idProducto, -delta)
            throw materialError
          }
          
          if (materialError.message.includes('no tiene receta')) {
            console.log('ℹ️ Producto sin receta, stock ajustado sin consumir materiales')
          }
        }
      }
      
      // ✅ SOLO RECARGAR DATOS, NO RELOAD
      await cargarDatos()
      alert('✅ Stock ajustado correctamente')
      
    } catch (error) {
      console.error('Error al ajustar stock:', error)
      alert('❌ Error al ajustar stock: ' + (error.message || 'Error desconocido'))
      throw error
    }
  }

  const actualizarPrecio = async (idProducto, delta) => {
    try {
      const producto = productos.find(p => p.idProducto === idProducto)
      if (!producto) return
      
      const nuevoPrecio = Math.max(0, (producto.precio || 0) + delta)
      
      // 1. Actualizar en el backend
      await api.productos.update(idProducto, {
        ...producto,
        precio: nuevoPrecio
      })
      
      // 2. Actualizar el estado de 'productos' localmente
      setProductos(prev => prev.map(p => 
        p.idProducto === idProducto ? { ...p, precio: nuevoPrecio } : p
      ))

      // 3. Actualizar el estado de 'inventario' localmente para reflejar el cambio en la tabla
      setInventario(prev => prev.map(item => 
        item.producto?.idProducto === idProducto 
          ? { ...item, producto: { ...item.producto, precio: nuevoPrecio } } 
          : item
      ))
      
      // 4. ELIMINAR la recarga completa de datos
      // await cargarDatos() // <--- ESTA LÍNEA SE ELIMINA

    } catch (error) {
      console.error('Error al actualizar precio:', error)
      alert('Error al actualizar el precio')
      // Opcional: si falla, recargar para asegurar consistencia
      await cargarDatos()
    }
  }

  const actualizarCategoria = async (idProducto, nuevaCategoriaId) => {
    try {
      const producto = productos.find(p => p.idProducto === idProducto)
      if (!producto) return
      
      await api.productos.update(idProducto, {
        ...producto,
        categoria: { idCategoria: parseInt(nuevaCategoriaId) }
      })
      await cargarDatos()
    } catch (error) {
      console.error('Error al actualizar categoría:', error)
      alert('Error al actualizar la categoría')
    }
  }

  const eliminarProducto = async (producto) => {
    try {
      const inventarioItem = inventario.find(i => i.producto?.idProducto === producto.idProducto)
      if (inventarioItem) {
        await api.inventario.delete(inventarioItem.idInventario)
      }
      
      await api.productos.delete(producto.idProducto)
      
      await cargarDatos()
      alert('Producto eliminado exitosamente')
      return true
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      alert('Error al eliminar el producto: ' + (error.message || 'Error desconocido'))
      return false
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  return {
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
  }
}