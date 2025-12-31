import React, { useState, useEffect, useMemo } from 'react'
import { api } from '../services/api/index.js'
import { 
  TrendingDown, 
  ShoppingCart, 
  Receipt,
  Analytics, 
  AttachMoney, 
  CalendarToday, 
  Description, 
  Inventory, 
  ArrowUpward, 
  ArrowDownward, 
  SwapVert,
  CheckCircle,
  ArrowForward,
  ArrowBack,
  Payment
} from '@mui/icons-material';

const esRegistroCompra = (registro) => typeof registro?.montoTotal !== 'undefined' && registro?.montoTotal !== null

const obtenerValorNumerico = (valor) => {
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return valor
  }

  if (typeof valor === 'string') {
    const normalizado = valor.replace(/[^0-9.-]/g, '')
    const numero = parseFloat(normalizado)
    return Number.isFinite(numero) ? numero : 0
  }

  return 0
}

const obtenerFechaValor = (registro) => {
  if (!registro?.fecha) return 0

  try {
    if (Array.isArray(registro.fecha)) {
      const [year, month, day] = registro.fecha
      return new Date(year || 0, (month || 1) - 1, day || 1).getTime()
    }

    const fecha = new Date(registro.fecha)
    return Number.isNaN(fecha.getTime()) ? 0 : fecha.getTime()
  } catch (error) {
    console.error('Error obteniendo fecha para ordenamiento:', error)
    return 0
  }
}

const obtenerDetalleTexto = (registro) => {
  if (esRegistroCompra(registro)) {
    const detalle = registro?.detalles?.[0]?.descripcion
    return detalle?.trim() || 'Compra'
  }
  return registro?.descripcion?.trim() || 'Gasto'
}

const obtenerMontoBruto = (registro) => {
  const valor = esRegistroCompra(registro) ? registro?.montoTotal : registro?.monto
  return obtenerValorNumerico(valor)
}

const obtenerMontoNeto = (registro) => {
  const bruto = obtenerMontoBruto(registro)
  if (esRegistroCompra(registro) && registro?.tipoDocumento === 'factura') {
    const iva = bruto - bruto / 1.19
    return bruto - iva
  }
  return bruto
}

const obtenerMetodoNombre = (registro) => {
  const nombre = registro?.metodoPago?.nombre
  return nombre ? String(nombre) : 'N/A'
}

const obtenerTipoEtiqueta = (registro) => (esRegistroCompra(registro) ? 'Compra' : 'Gasto')

export default function Egresos() {
  const [pasoActual, setPasoActual] = useState(1);
  const [compras, setCompras] = useState([])
  const [gastos, setGastos] = useState([])
  const [metodosPago, setMetodosPago] = useState([])
  const [materiales, setMateriales] = useState([])
  const [unidadesMedida, setUnidadesMedida] = useState([])
  const [loading, setLoading] = useState(true)
  const [tipoEgreso, setTipoEgreso] = useState('compra')
  const [observacionesModal, setObservacionesModal] = useState(null)
  const [movimientosSort, setMovimientosSort] = useState({ key: 'fecha', direction: 'desc' })
  
  const [formCompra, setFormCompra] = useState({
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0,
    idMetodoPago: '',
    tipoDocumento: 'boleta',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: ''
  })

  const [formCompraMaterial, setFormCompraMaterial] = useState({
    idMaterial: '',
    cantidad: 1,
    precioUnitario: 0,
    idMetodoPago: '',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: ''
  })

  const [resumen, setResumen] = useState([
    { 
      label: 'Compras del Mes', 
      value: '$ 0',
      icon: <ShoppingCart />,
      color: '#5D4037',
    },
    { 
      label: 'Gastos del Mes', 
      value: '$ 0',
      icon: <Receipt />,
      color: '#8D6E63',
    },
    { 
      label: 'Total Egresos', 
      value: '$ 0',
      icon: <TrendingDown />,
      color: '#F44336',
    },
  ])

  const pasos = [
    { numero: 1, titulo: 'Tipo', icono: <Analytics /> },
    { numero: 2, titulo: 'Detalles', icono: <Description /> },
    { numero: 3, titulo: 'Confirmar', icono: <CheckCircle /> }
  ];

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const now = new Date()
      const inicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const fin = now.toISOString()

      const [comps, gast, metodos, totalCompras, totalGastos, materialesData, unidadesData] = await Promise.all([
        api.compras.getAll().catch(() => []),
        api.gastos.getAll().catch(() => []),
        api.metodosPago.getAll().catch(() => []),
        api.compras.getTotalPorPeriodo(inicio, fin).catch(() => 0),
        api.gastos.getTotalPorPeriodo(inicio, fin).catch(() => 0),
        api.materiales.getAll().catch(() => []),
        api.unidadesMedida.getAll().catch(() => [])
      ])

      setCompras(comps || [])
      setGastos(gast || [])
      setMetodosPago(metodos || [])
      setMateriales(materialesData || [])
      setUnidadesMedida(unidadesData || [])

      const comprasMes = parseFloat(totalCompras) || 0
      const gastosMes = parseFloat(totalGastos) || 0
      const totalEgresos = comprasMes + gastosMes

      setResumen([
        { 
          label: 'Compras del Mes', 
          value: `$ ${Math.round(comprasMes).toLocaleString('es-CL')}`,
          icon: <ShoppingCart />,
          color: '#5D4037',
        },
        { 
          label: 'Gastos del Mes', 
          value: `$ ${Math.round(gastosMes).toLocaleString('es-CL')}`,
          icon: <Receipt />,
          color: '#8D6E63',
        },
        { 
          label: 'Total Egresos', 
          value: `$ ${Math.round(totalEgresos).toLocaleString('es-CL')}`,
          icon: <TrendingDown />,
          color: '#F44336',
        },
      ])
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularTotalCompra = () => {
    return (formCompra.precioUnitario || 0) * (formCompra.cantidad || 1)
  }

  const calcularTotalCompraMaterial = () => {
    return (formCompraMaterial.precioUnitario || 0) * (formCompraMaterial.cantidad || 1)
  }

  const calcularIVARecuperable = (total, tipoDocumento) => {
    if (tipoDocumento === 'factura') {
      const iva = total - (total / 1.19)
      return Math.round(iva * 100) / 100
    }
    return 0
  }

  const calcularCostoReal = (total, tipoDocumento) => {
    const ivaRecuperable = calcularIVARecuperable(total, tipoDocumento)
    return Math.round((total - ivaRecuperable) * 100) / 100
  }

  const validarPaso1 = () => {
    if (!tipoEgreso) {
      alert('⚠️ Seleccione un tipo de compra');
      return false;
    }
    return true;
  };

  const validarPaso2 = () => {
    if (tipoEgreso === 'compra') {
      if (!formCompra.descripcion?.trim()) {
        alert('⚠️ Ingrese una descripción');
        return false;
      }
      if (!formCompra.idMetodoPago) {
        alert('⚠️ Seleccione un método de pago');
        return false;
      }
      if (!formCompra.precioUnitario || formCompra.precioUnitario <= 0) {
        alert('⚠️ El precio unitario debe ser mayor a 0');
        return false;
      }
      if (!formCompra.cantidad || formCompra.cantidad <= 0) {
        alert('⚠️ La cantidad debe ser mayor a 0');
        return false;
      }
    } else if (tipoEgreso === 'material') {
      if (!formCompraMaterial.idMaterial) {
        alert('⚠️ Seleccione un material');
        return false;
      }
      if (!formCompraMaterial.idMetodoPago) {
        alert('⚠️ Seleccione un método de pago');
        return false;
      }
      if (!formCompraMaterial.precioUnitario || formCompraMaterial.precioUnitario <= 0) {
        alert('⚠️ El precio unitario debe ser mayor a 0');
        return false;
      }
      if (!formCompraMaterial.cantidad || formCompraMaterial.cantidad <= 0) {
        alert('⚠️ La cantidad debe ser mayor a 0');
        return false;
      }
    }
    return true;
  };

  const siguientePaso = () => {
    if (pasoActual === 1 && !validarPaso1()) return;
    if (pasoActual === 2 && !validarPaso2()) return;
    
    if (pasoActual === 3) {
      if (tipoEgreso === 'compra') {
        handleGuardarCompra();
      } else if (tipoEgreso === 'material') {
        handleGuardarCompraMaterial();
      }
    } else {
      setPasoActual(prev => Math.min(prev + 1, 3));
    }
  };

  const pasoAnterior = () => {
    setPasoActual(prev => Math.max(prev - 1, 1));
  };

  const handleGuardarCompra = async () => {
    try {
      const cantidad = parseInt(formCompra.cantidad)
      const precioUnitario = parseFloat(formCompra.precioUnitario)
      const subtotal = cantidad * precioUnitario
      
      const compraData = {
        fecha: new Date(formCompra.fecha).toISOString(),
        metodoPago: { 
          idMetodoPago: parseInt(formCompra.idMetodoPago)
        },
        tipoDocumento: formCompra.tipoDocumento || 'sin-documento',
        observaciones: (formCompra.observaciones || '').trim(),
        detalles: [
          {
            descripcion: formCompra.descripcion.trim(),
            cantidad: cantidad,
            precioUnitario: precioUnitario,
            subtotal: subtotal
          }
        ]
      }

      await api.compras.registrar(compraData)
      
      alert('✅ Compra registrada exitosamente')

      setFormCompra({
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        idMetodoPago: '',
        tipoDocumento: 'boleta',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: ''
      })

      setPasoActual(1);
      await cargarDatos()
      
    } catch (error) {
      console.error('❌ Error completo:', error)
      
      let mensaje = 'Error desconocido al registrar la compra'
      
      if (error.message) {
        mensaje = error.message
      } else if (error.response?.data) {
        mensaje = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data)
      }
      
      alert('❌ Error al registrar la compra:\n\n' + mensaje)
    }
  }

  const handleGuardarCompraMaterial = async () => {
    try {
      const materialSeleccionado = materiales.find(m => m.idMaterial === parseInt(formCompraMaterial.idMaterial))
      
      const compraData = {
        fecha: new Date(formCompraMaterial.fecha).toISOString(),
        metodoPago: { 
          idMetodoPago: parseInt(formCompraMaterial.idMetodoPago)
        },
        observaciones: (formCompraMaterial.observaciones || '').trim() || `Compra de material: ${materialSeleccionado?.nombre}`
      }

      const materialesData = [{
        material: { idMaterial: parseInt(formCompraMaterial.idMaterial) },
        cantidad: parseInt(formCompraMaterial.cantidad),
        precioUnitario: parseFloat(formCompraMaterial.precioUnitario)
      }]

      await api.compras.registrarCompraMaterial(compraData, materialesData)
      
      alert('✅ Compra de material registrada exitosamente')

      setFormCompraMaterial({
        idMaterial: '',
        cantidad: 1,
        precioUnitario: 0,
        idMetodoPago: '',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: ''
      })

      setPasoActual(1);
      await cargarDatos()
      
    } catch (error) {
      console.error('❌ Error compra material:', error)
      alert('❌ Error al registrar compra de material:\n\n' + (error.message || 'Error desconocido'))
    }
  }

  const handleCancelar = () => {
    if (window.confirm('¿Desea cancelar? Se perderán todos los datos')) {
      if (tipoEgreso === 'compra') {
        setFormCompra({
          descripcion: '',
          cantidad: 1,
          precioUnitario: 0,
          idMetodoPago: '',
          tipoDocumento: 'boleta',
          fecha: new Date().toISOString().split('T')[0],
          observaciones: ''
        })
      } else if (tipoEgreso === 'material') {
        setFormCompraMaterial({
          idMaterial: '',
          cantidad: 1,
          precioUnitario: 0,
          idMetodoPago: '',
          fecha: new Date().toISOString().split('T')[0],
          observaciones: ''
        })
      }
      setPasoActual(1);
    }
  }

  const incrementarCantidad = () => {
    if (tipoEgreso === 'compra') {
      setFormCompra({ ...formCompra, cantidad: formCompra.cantidad + 1 })
    } else if (tipoEgreso === 'material') {
      setFormCompraMaterial({ ...formCompraMaterial, cantidad: formCompraMaterial.cantidad + 1 })
    }
  }

  const decrementarCantidad = () => {
    if (tipoEgreso === 'compra' && formCompra.cantidad > 1) {
      setFormCompra({ ...formCompra, cantidad: formCompra.cantidad - 1 })
    } else if (tipoEgreso === 'material' && formCompraMaterial.cantidad > 1) {
      setFormCompraMaterial({ ...formCompraMaterial, cantidad: formCompraMaterial.cantidad - 1 })
    }
  }
  
  const formatearFecha = (fechaData) => {
    try {
      let fecha;
      
      if (Array.isArray(fechaData)) {
        fecha = new Date(fechaData[0], fechaData[1] - 1, fechaData[2]);
      } else if (typeof fechaData === 'string') {
        fecha = new Date(fechaData);
      } else if (fechaData instanceof Date) {
        fecha = fechaData;
      } else {
        return 'Fecha inválida';
      }

      if (isNaN(fecha.getTime())) {
        return 'Fecha inválida';
      }

      return fecha.toLocaleDateString('es-CL', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (e) {
      return 'Fecha inválida';
    }
  }

  const getMaterialInfo = (idMaterial) => {
    const material = materiales.find(m => m.idMaterial === parseInt(idMaterial))
    return material || null
  }

  const egresosCombinados = useMemo(() => {
    const registros = [...compras, ...gastos]

    const sorted = registros.sort((a, b) => {
      let result = 0

      switch (movimientosSort.key) {
        case 'tipo':
          result = obtenerTipoEtiqueta(a).localeCompare(
            obtenerTipoEtiqueta(b),
            'es',
            { sensitivity: 'base' }
          )
          break
        case 'detalle':
          result = obtenerDetalleTexto(a).localeCompare(
            obtenerDetalleTexto(b),
            'es',
            { sensitivity: 'base' }
          )
          break
        case 'bruto':
          result = obtenerMontoBruto(a) - obtenerMontoBruto(b)
          break
        case 'neto':
          result = obtenerMontoNeto(a) - obtenerMontoNeto(b)
          break
        case 'metodo':
          result = obtenerMetodoNombre(a).localeCompare(
            obtenerMetodoNombre(b),
            'es',
            { sensitivity: 'base' }
          )
          break
        case 'fecha':
        default:
          result = obtenerFechaValor(a) - obtenerFechaValor(b)
          break
      }

      return movimientosSort.direction === 'asc' ? result : -result
    })

    return sorted.slice(0, 10)
  }, [compras, gastos, movimientosSort])

  const handleSortMovimientos = (columnKey) => {
    setMovimientosSort((prev) => {
      if (prev.key === columnKey) {
        return {
          key: columnKey,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        }
      }

      return {
        key: columnKey,
        direction: columnKey === 'fecha' ? 'desc' : 'asc'
      }
    })
  }

  const SortHeaderButton = ({ label, columnKey }) => {
    const isActive = movimientosSort.key === columnKey
    const IconComponent = !isActive
      ? SwapVert
      : movimientosSort.direction === 'asc'
        ? ArrowUpward
        : ArrowDownward

    return (
      <button
        type="button"
        className="tabla-sort-button"
        onClick={() => handleSortMovimientos(columnKey)}
      >
        <span>{label}</span>
        <IconComponent sx={{ fontSize: '0.9rem' }} />
      </button>
    )
  }

  if (loading && compras.length === 0 && gastos.length === 0) {
    return (
      <div className="egresos-container">
        <div className="egresos-card">
          <div className="egresos-loading">
            <p>Cargando datos...</p>
          </div>
        </div>
      </div>
    )
  }

  const getContenidoPaso = () => {
    switch (pasoActual) {
      case 1:
        return (
          <div className="form-field">
            <label className="field-label">
              <Analytics sx={{ fontSize: 18 }} />
              Tipo de Compra
            </label>
            <select 
              value={tipoEgreso} 
              onChange={(e) => setTipoEgreso(e.target.value)}
            >
              <option value="compra">🛒 Compra General</option>
              <option value="material">📦 Compra de Materiales</option>
            </select>
            
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: tipoEgreso === 'compra' ? '#E8F5E8' : '#E3F2FD',
              border: `2px solid ${tipoEgreso === 'compra' ? '#4CAF50' : '#2196F3'}`,
              borderRadius: '8px'
            }}>
              <h4 style={{ 
                margin: '0 0 0.25rem 0',
                fontSize: '0.95rem',
                color: tipoEgreso === 'compra' ? '#2E7D32' : '#1565C0'
              }}>
                {tipoEgreso === 'compra' ? '🛒 Compra General' : '📦 Compra de Materiales'}
              </h4>
              <p style={{ 
                margin: 0, 
                fontSize: '0.85rem',
                color: tipoEgreso === 'compra' ? '#388E3C' : '#1976D2'
              }}>
                {tipoEgreso === 'compra' 
                  ? 'Registro de compras de insumos y materiales'
                  : 'Registro de materiales para inventario'
                }
              </p>
            </div>
          </div>
        );
      
      case 2:
        if (tipoEgreso === 'compra') {
          return (
            <div className="form-grid">
              <div className="form-field col-6">
                <label className="field-label">
                  <Description sx={{ fontSize: 16 }} />
                  Descripción
                </label>
                <input 
                  type="text" 
                  placeholder='Ej: Cuero, hilos, hebillas...' 
                  value={formCompra.descripcion}
                  onChange={(e) => setFormCompra({ ...formCompra, descripcion: e.target.value })}
                />
              </div>

              <div className="form-field col-6">
                <label className="field-label">
                  <AttachMoney sx={{ fontSize: 16 }} />
                  Precio Unitario
                </label>
                <input 
                  type="number" 
                  placeholder="0" 
                  min={0} 
                  step={100} 
                  value={formCompra.precioUnitario || ''}
                  onChange={(e) => setFormCompra({ ...formCompra, precioUnitario: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-field col-6">
                <label className="field-label">Cantidad</label>
                <div className="quantity-control">
                  <button className="btn ghost small" onClick={decrementarCantidad}>−</button>
                  <input 
                    type="number" 
                    value={formCompra.cantidad} 
                    onChange={(e) => setFormCompra({ ...formCompra, cantidad: parseInt(e.target.value) || 1 })}
                    min={1} 
                    step={1}
                  />
                  <button className="btn ghost small" onClick={incrementarCantidad}>+</button>
                </div>
              </div>

              <div className="form-field col-6">
                <label className="field-label">Total</label>
                <input 
                  type="text" 
                  value={`$ ${Math.round(calcularTotalCompra()).toLocaleString('es-CL')}`}
                  disabled 
                  style={{ 
                    fontWeight: '600',
                    color: '#5D4037',
                    background: '#F5F3F0'
                  }}
                />
              </div>

              <div className="form-field col-12">
                <div className="resumen-financiero">
                  <div className="resumen-item resumen-iva">
                    <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>IVA Recuperable</div>
                    <div style={{ fontSize: '0.95rem' }}>
                      $ {Math.round(calcularIVARecuperable(calcularTotalCompra(), formCompra.tipoDocumento)).toLocaleString('es-CL')}
                    </div>
                  </div>
                  
                  <div className="resumen-item resumen-costo">
                    <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Costo Real</div>
                    <div style={{ fontSize: '0.95rem' }}>
                      $ {Math.round(calcularCostoReal(calcularTotalCompra(), formCompra.tipoDocumento)).toLocaleString('es-CL')}
                    </div>
                  </div>
                  
                  <div className="resumen-item resumen-total">
                    <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Total Bruto</div>
                    <div style={{ fontSize: '0.95rem' }}>
                      $ {Math.round(calcularTotalCompra()).toLocaleString('es-CL')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-field col-6">
                <label className="field-label">
                  <CalendarToday sx={{ fontSize: 16 }} />
                  Fecha
                </label>
                <input 
                  type="date" 
                  value={formCompra.fecha}
                  onChange={(e) => setFormCompra({ ...formCompra, fecha: e.target.value })}
                />
              </div>

              <div className="form-field col-6">
                <label className="field-label">
                  <Payment sx={{ fontSize: 16 }} />
                  Método de Pago
                </label>
                <select 
                  value={formCompra.idMetodoPago}
                  onChange={(e) => setFormCompra({ ...formCompra, idMetodoPago: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {metodosPago.map(m => (
                    <option key={m.idMetodoPago} value={m.idMetodoPago}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field col-6">
                <label className="field-label">Tipo de Documento</label>
                <select 
                  value={formCompra.tipoDocumento}
                  onChange={(e) => setFormCompra({ ...formCompra, tipoDocumento: e.target.value })}
                >
                  <option value="boleta">🧾 Boleta</option>
                  <option value="factura">📄 Factura</option>
                  <option value="sin-documento">📝 Sin documento</option>
                </select>
              </div>

              <div className="form-field col-12">
                <label className="field-label">
                  <Description sx={{ fontSize: 16 }} />
                  Observaciones (opcional)
                </label>
                <textarea 
                  placeholder="Notas..." 
                  rows={2}
                  value={formCompra.observaciones}
                  onChange={(e) => setFormCompra({ ...formCompra, observaciones: e.target.value })}
                />
              </div>
            </div>
          );
        } else if (tipoEgreso === 'material') {
          return (
            <div className="form-grid">
              <div className="form-field col-6">
                <label className="field-label">
                  <Inventory sx={{ fontSize: 16 }} />
                  Material
                </label>
                <select 
                  value={formCompraMaterial.idMaterial}
                  onChange={(e) => setFormCompraMaterial({ ...formCompraMaterial, idMaterial: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {materiales.map(m => (
                    <option key={m.idMaterial} value={m.idMaterial}>
                      {m.nombre} ({m.unidadMedida?.abreviatura || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              {formCompraMaterial.idMaterial && (
                <div className="form-field col-6">
                  <label className="field-label">Información</label>
                  <div className="material-info">
                    {(() => {
                      const material = getMaterialInfo(formCompraMaterial.idMaterial)
                      return material ? (
                        <>
                          <p><strong>Stock:</strong> {material.stockActual || 0} {material.unidadMedida?.abreviatura}</p>
                          <p><strong>Mínimo:</strong> {material.stockMinimo || 0}</p>
                        </>
                      ) : null
                    })()}
                  </div>
                </div>
              )}

              <div className="form-field col-6">
                <label className="field-label">
                  <AttachMoney sx={{ fontSize: 16 }} />
                  Precio Unitario
                </label>
                <input 
                  type="number" 
                  placeholder="0" 
                  min={0} 
                  step={0.01} 
                  value={formCompraMaterial.precioUnitario || ''}
                  onChange={(e) => setFormCompraMaterial({ ...formCompraMaterial, precioUnitario: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-field col-6">
                <label className="field-label">Cantidad</label>
                <div className="quantity-control">
                  <button className="btn ghost small" onClick={decrementarCantidad}>−</button>
                  <input 
                    type="number" 
                    value={formCompraMaterial.cantidad} 
                    onChange={(e) => setFormCompraMaterial({ ...formCompraMaterial, cantidad: parseInt(e.target.value) || 1 })}
                    min={1} 
                    step={1}
                  />
                  <button className="btn ghost small" onClick={incrementarCantidad}>+</button>
                </div>
              </div>

              <div className="form-field col-6">
                <label className="field-label">
                  <CalendarToday sx={{ fontSize: 16 }} />
                  Fecha
                </label>
                <input 
                  type="date" 
                  value={formCompraMaterial.fecha}
                  onChange={(e) => setFormCompraMaterial({ ...formCompraMaterial, fecha: e.target.value })}
                />
              </div>

              <div className="form-field col-6">
                <label className="field-label">
                  <Payment sx={{ fontSize: 16 }} />
                  Método de Pago
                </label>
                <select 
                  value={formCompraMaterial.idMetodoPago}
                  onChange={(e) => setFormCompraMaterial({ ...formCompraMaterial, idMetodoPago: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {metodosPago.map(m => (
                    <option key={m.idMetodoPago} value={m.idMetodoPago}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field col-12">
                <label className="field-label">
                  <Description sx={{ fontSize: 16 }} />
                  Observaciones (opcional)
                </label>
                <textarea 
                  placeholder="Notas..." 
                  rows={2}
                  value={formCompraMaterial.observaciones}
                  onChange={(e) => setFormCompraMaterial({ ...formCompraMaterial, observaciones: e.target.value })}
                />
              </div>
            </div>
          );
        }
        break;
      
      case 3:
        return (
          <div style={{ padding: '0.5rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #E8F5E8, #C8E6C9)',
              border: '2px solid #4CAF50',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#2E7D32', marginBottom: '0.25rem' }}>
                Total
              </div>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                color: '#2E7D32'
              }}>
                ${Math.round(
                  tipoEgreso === 'compra' ? calcularTotalCompra() :
                  calcularTotalCompraMaterial()
                ).toLocaleString('es-CL')}
              </div>
            </div>

            <div style={{
              background: '#FAF9F7',
              border: '2px solid #D7CCC8',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <h3 style={{ 
                margin: '0 0 0.75rem 0',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#5D4037'
              }}>
                <Description sx={{ fontSize: 16 }} />
                Detalles
              </h3>
              
              {tipoEgreso === 'compra' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div><strong>Descripción:</strong> {formCompra.descripcion}</div>
                  <div><strong>Cantidad:</strong> {formCompra.cantidad}</div>
                  <div><strong>Precio:</strong> ${formCompra.precioUnitario.toLocaleString('es-CL')}</div>
                  <div><strong>Fecha:</strong> {formatearFecha(formCompra.fecha)}</div>
                  <div><strong>Pago:</strong> {metodosPago.find(m => m.idMetodoPago === parseInt(formCompra.idMetodoPago))?.nombre}</div>
                  <div><strong>Doc:</strong> {formCompra.tipoDocumento === 'boleta' ? 'Boleta' : formCompra.tipoDocumento === 'factura' ? 'Factura' : 'Sin documento'}</div>
                </div>
              )}

              {tipoEgreso === 'material' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div><strong>Material:</strong> {getMaterialInfo(formCompraMaterial.idMaterial)?.nombre}</div>
                  <div><strong>Cantidad:</strong> {formCompraMaterial.cantidad} {getMaterialInfo(formCompraMaterial.idMaterial)?.unidadMedida?.abreviatura}</div>
                  <div><strong>Precio:</strong> ${formCompraMaterial.precioUnitario.toLocaleString('es-CL')}</div>
                  <div><strong>Fecha:</strong> {formatearFecha(formCompraMaterial.fecha)}</div>
                  <div><strong>Pago:</strong> {metodosPago.find(m => m.idMetodoPago === parseInt(formCompraMaterial.idMetodoPago))?.nombre}</div>
                </div>
              )}
            </div>

            <div style={{
              background: '#E3F2FD',
              border: '2px solid #2196F3',
              borderRadius: '8px',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.85rem'
            }}>
              <CheckCircle sx={{ fontSize: 24, color: '#1565C0' }} />
              <div>
                <div style={{ fontWeight: '600', color: '#1565C0' }}>Todo listo</div>
                <div style={{ color: '#1976D2' }}>Presiona "Registrar" para confirmar</div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const tablaEgresos = egresosCombinados.map((item, idx) => {
    const esCompra = esRegistroCompra(item)
    const detalle = obtenerDetalleTexto(item)
    const montoTotal = obtenerMontoBruto(item)
    const montoNeto = obtenerMontoNeto(item)
    const ivaValor = esCompra && item.tipoDocumento === 'factura'
      ? montoTotal - montoNeto
      : 0
    const metodoPagoNombre = obtenerMetodoNombre(item)
    
    let fechaFormateada = 'N/A'
    if (item.fecha) {
      try {
        fechaFormateada = formatearFecha(item.fecha)
      } catch (e) {
        console.error('Error formateando fecha:', e)
      }
    }

    return [
      <div key={`fecha-${idx}`} className="tabla-fecha">{fechaFormateada}</div>,
      <span 
        key={`tipo-${idx}`}
        className={`tipo-badge ${esCompra ? 'tipo-compra' : 'tipo-gasto'}`}
      >
        {esCompra ? '🛒 Compra' : '💸 Gasto'}
      </span>,
      <div key={`detalle-${idx}`} className="tabla-detalle">{detalle}</div>,
      <div key={`bruto-${idx}`} className="tabla-monto">
        {`$${Math.round(montoTotal).toLocaleString('es-CL')}`}
      </div>,
      <div key={`neto-${idx}`} className="tabla-monto" style={{ 
        color: ivaValor > 0 ? '#2E7D32' : '#5D4037',
        fontWeight: ivaValor > 0 ? '700' : '600'
      }}>
        {`$${Math.round(montoNeto).toLocaleString('es-CL')}`}
      </div>,
      <div key={`metodo-${idx}`} className="tabla-metodo">
        {metodoPagoNombre}
      </div>,
      esCompra && item.observaciones && item.observaciones.trim() !== '' ? (
        <button 
          key={`obs-${idx}`}
          className="btn-observaciones"
          onClick={() => setObservacionesModal(item.observaciones)}
        >
          📝
        </button>
      ) : (
        <span key={`obs-${idx}`} className="sin-observaciones">—</span>
      )
    ]
  })

  return (
    <div className="egresos-container">
      <style>{`
        .egresos-container {
          padding: 0.75rem;
          background: #EFEBE9;
          min-height: 100vh;
          max-width: 1400px;
          margin: 0 auto;
        }

        .egresos-header {
          background: linear-gradient(135deg, #5D4037, #8D6E63);
          color: white;
          border-radius: 12px;
          margin-bottom: 1rem;
          box-shadow: 0 4px 12px rgba(93, 64, 55, 0.15);
        }

        .egresos-card {
          background: #FAF9F7;
          border: 1px solid #D7CCC8;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(93, 64, 55, 0.08);
          margin-bottom: 1rem;
          position: relative;
        }

        .egresos-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #5D4037, #8D6E63);
        }

        .card-header {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #D7CCC8;
        }

        .card-title {
          font-size: 1.1rem;
          margin: 0 0 0.25rem 0;
          color: #3E2723;
          font-weight: 600;
        }

        .card-subtitle {
          color: #8D6E63;
          font-size: 0.8rem;
          margin: 0;
        }

        .card-body {
          padding: 1rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        .stat-card {
          background: #FAF9F7;
          border: 1px solid #D7CCC8;
          padding: 0.75rem;
          border-radius: 8px;
          text-align: center;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #5D4037, #8D6E63);
        }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin: 0 auto 0.5rem;
          font-size: 20px;
        }

        .stat-label {
          color: #8D6E63;
          font-size: 0.8rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
          display: block;
        }

        .stat-value {
          font-size: 1.3rem;
          font-weight: 700;
          color: #3E2723;
          display: block;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 0.75rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          grid-column: span 12;
        }

        .form-field.col-6 {
          grid-column: span 6;
        }

        .field-label {
          font-size: 0.85rem;
          color: #3E2723;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        input, select, textarea {
          background: #FAF9F7;
          border: 2px solid #D7CCC8;
          color: #3E2723;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          outline: none;
          font-size: 0.9rem;
          height: 38px;
          width: 100%;
          font-family: inherit;
        }

        input:focus, select:focus, textarea:focus {
          border-color: #5D4037;
          box-shadow: 0 0 0 2px rgba(93, 64, 55, 0.1);
        }

        textarea {
          min-height: 60px;
          padding: 0.5rem 0.75rem;
          height: auto;
        }

        .btn {
          height: 38px;
          min-height: 38px;
          padding: 0 1rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          border: 2px solid transparent;
          background: #5D4037;
          color: #fff;
          cursor: pointer;
          gap: 0.35rem;
          font-family: inherit;
        }

        .btn:hover {
          background: #8D6E63;
        }

        .btn.ghost {
          background: transparent;
          border: 2px solid #D7CCC8;
          color: #3E2723;
        }

        .btn.ghost:hover {
          background: #D7CCC8;
        }

        .btn.small {
          height: 32px;
          min-height: 32px;
          padding: 0 0.75rem;
          font-size: 0.85rem;
        }

        .quantity-control {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .quantity-control input {
          text-align: center;
          flex: 1;
        }

        .resumen-financiero {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }

        .resumen-item {
          padding: 0.75rem;
          border-radius: 8px;
          text-align: center;
          font-weight: 600;
        }

        .resumen-iva {
          background: #E8F5E8;
          border: 2px solid #4CAF50;
          color: #2E7D32;
        }

        .resumen-costo {
          background: #FFF3E0;
          border: 2px solid #FF9800;
          color: #EF6C00;
        }

        .resumen-total {
          background: linear-gradient(135deg, #5D4037, #8D6E63);
          border: 2px solid #5D4037;
          color: white;
        }

        .tabla-container {
          overflow: auto;
          border: 1px solid #D7CCC8;
          border-radius: 8px;
          background: #FAF9F7;
        }

        .tabla {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .tabla thead th {
          font-size: 0.85rem;
          position: sticky;
          top: 0;
          background: linear-gradient(135deg, #5D4037, #8D6E63);
          text-align: left;
          padding: 0.75rem;
          font-weight: 600;
          color: #FFF;
        }

        .tabla-sort-button {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background: transparent;
          border: none;
          color: inherit;
          font: inherit;
          cursor: pointer;
          padding: 0;
        }

        .tabla td {
          font-size: 0.85rem;
          padding: 0.75rem;
          border-bottom: 1px solid #D7CCC8;
          color: #3E2723;
        }

        .tabla tbody tr:hover {
          background: #F5F3F0;
        }

        .tipo-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          display: inline-block;
          min-width: 80px;
          text-align: center;
        }

        .tipo-compra {
          background: #E8F5E8;
          color: #2E7D32;
        }

        .tipo-gasto {
          background: #FFEBEE;
          color: #C62828;
        }

        .tabla-monto {
          text-align: right;
          font-weight: 600;
          color: #5D4037;
        }
        
        .btn-observaciones {
          background: transparent;
          border: 2px solid #D7CCC8;
          color: #3E2723;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .btn-observaciones:hover {
          background: #D7CCC8;
        }

        .sin-observaciones {
          color: #8D6E63;
        }

        .egresos-loading {
          padding: 2rem;
          text-align: center;
          color: #8D6E63;
        }

        .material-info {
          background: #E8F5E8;
          padding: 0.5rem;
          border-radius: 6px;
          border-left: 3px solid #4CAF50;
        }

        .material-info p {
          margin: 0.15rem 0;
          font-size: 0.8rem;
          color: #2E7D32;
        }

        @media (max-width: 768px) {
          .form-field.col-6 {
            grid-column: span 12;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .resumen-financiero {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Formulario compacto */}
      <div className="egresos-card">
        <div className="card-header">
          <h2 className="card-title">Registrar Compra</h2>
        </div>
        <div className="card-body">
          {/* Indicador de pasos */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '10%',
              right: '10%',
              height: '2px',
              background: '#D7CCC8',
              zIndex: 0
            }}>
              <div style={{
                height: '100%',
                background: '#5D4037',
                width: `${((pasoActual - 1) / 2) * 100}%`,
                transition: 'width 0.3s'
              }} />
            </div>

            {pasos.map((paso) => (
              <div key={paso.numero} style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: pasoActual >= paso.numero ? '#5D4037' : '#FAF9F7',
                  border: `2px solid ${pasoActual >= paso.numero ? '#5D4037' : '#D7CCC8'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: pasoActual >= paso.numero ? 'white' : '#8D6E63',
                  marginBottom: '0.35rem'
                }}>
                  {React.cloneElement(paso.icono, { sx: { fontSize: 16 } })}
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: pasoActual === paso.numero ? '600' : '400',
                  color: pasoActual >= paso.numero ? '#5D4037' : '#8D6E63',
                  textAlign: 'center'
                }}>
                  {paso.titulo}
                </span>
              </div>
            ))}
          </div>

          {/* Contenido */}
          <div style={{ minHeight: '280px' }}>
            {getContenidoPaso()}
          </div>

          {/* Botones */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '2px solid #D7CCC8'
          }}>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {pasoActual > 1 && (
                <button className="btn ghost" onClick={pasoAnterior}>
                  <ArrowBack sx={{ fontSize: 16 }} />
                  Anterior
                </button>
              )}
              <button className="btn ghost" onClick={handleCancelar}>
                Cancelar
              </button>
            </div>

            <div>
              {pasoActual < 3 ? (
                <button className="btn" onClick={siguientePaso}>
                  Siguiente
                  <ArrowForward sx={{ fontSize: 16 }} />
                </button>
              ) : (
                <button className="btn" onClick={siguientePaso}>
                  <CheckCircle sx={{ fontSize: 16 }} />
                  Registrar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Header compacto */}
      <div className="egresos-card egresos-header">
        <div className="card-header">
          <h1 className="card-title">Compras</h1>
          <p className="card-subtitle">Control de compras y gastos operativos</p>
        </div>
        <div className="card-body">
          <div className="stats-grid">
            {resumen.map((r) => (
              <div key={r.label} className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: `${r.color}20`, color: r.color }}>
                  {React.cloneElement(r.icon, { sx: { fontSize: 20 } })}
                </div>
                <span className="stat-label">{r.label}</span>
                <span className="stat-value">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla compacta */}
      <div className="egresos-card">
        <div className="card-header">
          <h2 className="card-title">Movimientos Recientes</h2>
          <p className="card-subtitle">Compras y gastos operativos del mes</p>
        </div>
        <div className="card-body">
          <div className="tabla-container">
            <table className="tabla">
              <thead>
                <tr>
                  <th><SortHeaderButton label="Fecha" columnKey="fecha" /></th>
                  <th><SortHeaderButton label="Tipo" columnKey="tipo" /></th>
                  <th><SortHeaderButton label="Detalle" columnKey="detalle" /></th>
                  <th><SortHeaderButton label="Bruto" columnKey="bruto" /></th>
                  <th><SortHeaderButton label="Neto" columnKey="neto" /></th>
                  <th><SortHeaderButton label="Pago" columnKey="metodo" /></th>
                  <th>Obs</th>
                </tr>
              </thead>
              <tbody>
                {tablaEgresos.map((fila, index) => (
                  <tr key={index}>
                    {fila.map((celda, celdaIndex) => (
                      <td key={celdaIndex}>{celda}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {observacionesModal && (
        <div 
          style={{
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
          }}
          onClick={() => setObservacionesModal(null)}
        >
          <div 
            style={{
              background: '#FAF9F7',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1.1rem',
              color: '#3E2723'
            }}>
              Observaciones
            </h3>
            <div style={{
              background: '#D7CCC8',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#3E2723' }}>
                {observacionesModal}
              </p>
            </div>
            <button className="btn" onClick={() => setObservacionesModal(null)} style={{ width: '100%' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}