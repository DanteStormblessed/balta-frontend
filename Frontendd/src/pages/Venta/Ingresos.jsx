// src/pages/Venta/Ingresos.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api/index.js';
import { 
  ShoppingCart, 
  Payment, 
  CheckCircle, 
  ArrowForward, 
  ArrowBack,
  TrendingUp,
  AttachMoney,
  Inventory,
  ArrowUpward,
  ArrowDownward,
  SwapVert
} from '@mui/icons-material';
import ProductosVenta from './ProductosVenta.jsx';
import MetodosPagoVenta from './MetodosPagoVenta.jsx';
import ObservacionesModal from './ventanas-modales/ObservacionesModal.jsx';
import DetallesProductosModal from './ventanas-modales/DetallesProductosModal.jsx';

export default function Ingresos() {
  const [pasoActual, setPasoActual] = useState(1);
  const [productos, setProductos] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [observacionesModal, setObservacionesModal] = useState(null);
  const [detallesModal, setDetallesModal] = useState(null);
  const [movimientosSort, setMovimientosSort] = useState({ key: 'fecha', direction: 'desc' });
  
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [metodosPagoSeleccionados, setMetodosPagoSeleccionados] = useState([]);
  const [montoRestante, setMontoRestante] = useState(0);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    observaciones: ''
  });

  const [resumen, setResumen] = useState([
    { label: 'Ventas del Mes', value: '$ 0', color: '#5D4037' },
    { label: 'Productos Vendidos', value: '0', color: '#8D6E63' },
    { label: 'Total Ingresos', value: '$ 0', color: '#4CAF50' },
  ]);

  const pasos = [
    { numero: 1, titulo: 'Productos', icono: <ShoppingCart /> },
    { numero: 2, titulo: 'Pago', icono: <Payment /> },
    { numero: 3, titulo: 'Confirmar', icono: <CheckCircle /> }
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    const total = calcularTotal();
    const totalAsignado = metodosPagoSeleccionados.reduce((sum, metodo) => 
      sum + (parseFloat(metodo.montoAsignado) || 0), 0
    );
    setMontoRestante(total - totalAsignado);
  }, [productosSeleccionados, metodosPagoSeleccionados]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
      const finMes = now;

      const [prods, metodos, vents, totalVentas] = await Promise.all([
        api.productos.getAll().catch(() => []),
        api.metodosPago.getAll().catch(() => []),
        api.ventas.getAll().catch(() => []),
        api.ventas.getTotalPorPeriodo(inicioMes.toISOString(), finMes.toISOString()).catch(() => 0)
      ]);
      
      setProductos(prods);
      setMetodosPago(metodos);
      setVentas(vents);

      const ventasMes = parseFloat(totalVentas) || 0;
      const ventasArray = Array.isArray(vents) ? vents : [];
      
      // ⭐ FIX: Mejorar el cálculo de productos vendidos
      const productosVendidos = ventasArray.reduce((total, venta) => {
        // Normalizar fecha para comparación
        let fechaVenta;
        if (Array.isArray(venta.fecha)) {
          fechaVenta = new Date(venta.fecha[0], venta.fecha[1] - 1, venta.fecha[2]);
        } else {
          fechaVenta = new Date(venta.fecha);
        }
        
        // Verificar si está en el mes actual
        if (fechaVenta >= inicioMes && fechaVenta <= finMes) {
          // Sumar cantidades de todos los detalles
          const cantidadVenta = venta?.detalles?.reduce((sum, detalle) => {
            return sum + (parseInt(detalle?.cantidad) || 0);
          }, 0) || 0;
          return total + cantidadVenta;
        }
        
        return total;
      }, 0);

      console.log('📊 Debug:', {
        totalVentas: ventasArray.length,
        ventasDelMes: ventasArray.filter(v => {
          let fechaVenta;
          if (Array.isArray(v.fecha)) {
            fechaVenta = new Date(v.fecha[0], v.fecha[1] - 1, v.fecha[2]);
          } else {
            fechaVenta = new Date(v.fecha);
          }
          return fechaVenta >= inicioMes && fechaVenta <= finMes;
        }).length,
        productosVendidos,
        inicioMes: inicioMes.toLocaleDateString(),
        finMes: finMes.toLocaleDateString()
      });

      setResumen([
        { label: 'Ventas del Mes', value: `$ ${Math.round(ventasMes).toLocaleString('es-CL')}`, color: '#5D4037' },
        { label: 'Productos Vendidos', value: productosVendidos.toString(), color: '#8D6E63' },
        { label: 'Total Ingresos', value: `$ ${Math.round(ventasMes).toLocaleString('es-CL')}`, color: '#4CAF50' },
      ]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarProducto = () => {
    setProductosSeleccionados(prev => [
      ...prev,
      { idProducto: '', cantidad: 1, precioUnitario: 0, producto: null }
    ]);
  };

  const actualizarProducto = (index, campo, valor) => {
    setProductosSeleccionados(prev => 
      prev.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [campo]: valor };
          if (campo === 'idProducto' && valor) {
            const productoSeleccionado = productos.find(p => p.idProducto === parseInt(valor));
            if (productoSeleccionado) {
              updatedItem.precioUnitario = productoSeleccionado.precio;
              updatedItem.producto = productoSeleccionado;
            }
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const eliminarProducto = (index) => {
    setProductosSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  const incrementarCantidad = (index) => {
    setProductosSeleccionados(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, cantidad: (item.cantidad || 0) + 1 } : item
      )
    );
  };

  const decrementarCantidad = (index) => {
    setProductosSeleccionados(prev => 
      prev.map((item, i) => 
        i === index && item.cantidad > 1 ? { ...item, cantidad: item.cantidad - 1 } : item
      )
    );
  };

  const agregarMetodoPago = () => {
    setMetodosPagoSeleccionados(prev => [
      ...prev,
      { idMetodoPago: '', montoAsignado: 0 }
    ]);
  };

  const actualizarMetodoPago = (index, campo, valor) => {
    setMetodosPagoSeleccionados(prev => 
      prev.map((metodo, i) => 
        i === index ? { ...metodo, [campo]: valor } : metodo
      )
    );
  };

  const eliminarMetodoPago = (index) => {
    setMetodosPagoSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  const distribuirMontos = () => {
    const total = calcularTotal();
    if (metodosPagoSeleccionados.length === 0) return;
    const montoPorMetodo = total / metodosPagoSeleccionados.length;
    setMetodosPagoSeleccionados(prev =>
      prev.map(metodo => ({
        ...metodo,
        montoAsignado: Math.round(montoPorMetodo * 100) / 100
      }))
    );
  };

  const calcularTotal = () => {
    return productosSeleccionados.reduce((total, item) => {
      const subtotal = (item.precioUnitario || 0) * (item.cantidad || 0);
      return total + subtotal;
    }, 0);
  };

  const calcularSubtotalProducto = (producto) => {
    return (producto.precioUnitario || 0) * (producto.cantidad || 0);
  };

  const validarStock = async (idProducto, cantidadRequerida) => {
    try {
      const inventario = await api.inventario.getPorProducto(idProducto);
      const stockDisponible = inventario?.cantidadProducto || 0;
      return stockDisponible >= cantidadRequerida;
    } catch (error) {
      console.error('Error al validar stock:', error);
      return false;
    }
  };

  const validarPaso1 = () => {
    if (productosSeleccionados.length === 0) {
      alert('⚠️ Agregue al menos un producto');
      return false;
    }
    if (productosSeleccionados.find(p => !p.idProducto)) {
      alert('⚠️ Seleccione todos los productos');
      return false;
    }
    if (productosSeleccionados.find(p => !p.cantidad || p.cantidad <= 0)) {
      alert('⚠️ Cantidad debe ser mayor a 0');
      return false;
    }
    return true;
  };

  const validarPaso2 = () => {
    if (metodosPagoSeleccionados.length === 0) {
      alert('⚠️ Agregue al menos un método de pago');
      return false;
    }
    if (metodosPagoSeleccionados.find(m => !m.idMetodoPago)) {
      alert('⚠️ Seleccione todos los métodos');
      return false;
    }
    const totalAsignado = metodosPagoSeleccionados.reduce((sum, metodo) => 
      sum + (parseFloat(metodo.montoAsignado) || 0), 0
    );
    const total = calcularTotal();
    if (Math.abs(totalAsignado - total) > 0.01) {
      alert('⚠️ La suma debe ser igual al total');
      return false;
    }
    return true;
  };

  const siguientePaso = async () => {
    if (pasoActual === 1 && !validarPaso1()) return;
    if (pasoActual === 2 && !validarPaso2()) return;
    
    if (pasoActual === 1) {
      for (const item of productosSeleccionados) {
        const stockValido = await validarStock(item.idProducto, item.cantidad);
        if (!stockValido) {
          const producto = productos.find(p => p.idProducto === parseInt(item.idProducto));
          alert(`❌ Stock insuficiente: ${producto?.nombre}`);
          return;
        }
      }
    }
    
    if (pasoActual === 3) {
      handleGuardar();
    } else {
      setPasoActual(prev => Math.min(prev + 1, 3));
    }
  };

  const pasoAnterior = () => {
    setPasoActual(prev => Math.max(prev - 1, 1));
  };

  const handleGuardar = async () => {
    try {
      const ventaData = {
        fecha: new Date(formData.fecha).toISOString(),
        observaciones: formData.observaciones || "",
        detalles: productosSeleccionados.map(item => ({
          producto: { idProducto: parseInt(item.idProducto) },
          cantidad: parseInt(item.cantidad),
          precioUnitario: parseFloat(item.precioUnitario),
          subtotal: calcularSubtotalProducto(item)
        })),
        metodosPago: metodosPagoSeleccionados.map(metodo => ({
          metodoPago: { idMetodoPago: parseInt(metodo.idMetodoPago) },
          montoAsignado: parseFloat(metodo.montoAsignado)
        }))
      };

      await api.ventas.registrar(ventaData);
      alert('✅ Venta registrada');
      
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        observaciones: ''
      });
      setProductosSeleccionados([]);
      setMetodosPagoSeleccionados([]);
      setPasoActual(1);
      
      await cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al registrar');
    }
  };

  const handleCancelar = () => {
    if (window.confirm('¿Cancelar? Se perderán los datos')) {
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        observaciones: ''
      });
      setProductosSeleccionados([]);
      setMetodosPagoSeleccionados([]);
      setPasoActual(1);
    }
  };

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
      if (isNaN(fecha.getTime())) return 'Fecha inválida';
      return fecha.toLocaleDateString('es-CL', { 
        day: '2-digit', month: 'short', year: 'numeric' 
      });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  const ventasRecientes = useMemo(() => {
    return ventas.slice(-10).reverse();
  }, [ventas]);

  const handleSortMovimientos = (columnKey) => {
    setMovimientosSort((prev) => {
      if (prev.key === columnKey) {
        return { key: columnKey, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key: columnKey, direction: columnKey === 'fecha' ? 'desc' : 'asc' };
    });
  };

  const SortHeaderButton = ({ label, columnKey }) => {
    const isActive = movimientosSort.key === columnKey;
    const IconComponent = !isActive ? SwapVert : movimientosSort.direction === 'asc' ? ArrowUpward : ArrowDownward;

    return (
      <button
        type="button"
        className="tabla-sort-button"
        onClick={() => handleSortMovimientos(columnKey)}
      >
        <span>{label}</span>
        <IconComponent sx={{ fontSize: '0.9rem' }} />
      </button>
    );
  };

  const ventasOrdenadas = useMemo(() => {
    const sorted = [...ventasRecientes].sort((a, b) => {
      let result = 0;
      switch (movimientosSort.key) {
        case 'fecha':
          const fechaA = Array.isArray(a.fecha) ? new Date(a.fecha[0], a.fecha[1] - 1, a.fecha[2]).getTime() : new Date(a.fecha).getTime();
          const fechaB = Array.isArray(b.fecha) ? new Date(b.fecha[0], b.fecha[1] - 1, b.fecha[2]).getTime() : new Date(b.fecha).getTime();
          result = fechaA - fechaB;
          break;
        case 'neto':
          result = (a.montoNeto || 0) - (b.montoNeto || 0);
          break;
        case 'iva':
          result = (a.ivaTotal || 0) - (b.ivaTotal || 0);
          break;
        case 'bruto':
          result = (a.montoBruto || 0) - (b.montoBruto || 0);
          break;
        default:
          result = 0;
      }
      return movimientosSort.direction === 'asc' ? result : -result;
    });
    return sorted;
  }, [ventasRecientes, movimientosSort]);

  if (loading && ventas.length === 0) {
    return (
      <div className="ingresos-container">
        <div className="ingresos-card">
          <div className="ingresos-loading">
            <p>Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  const getContenidoPaso = () => {
    switch (pasoActual) {
      case 1:
        return (
          <ProductosVenta
            productos={productos}
            productosSeleccionados={productosSeleccionados}
            onAgregarProducto={agregarProducto}
            onActualizarProducto={actualizarProducto}
            onEliminarProducto={eliminarProducto}
            onIncrementarCantidad={incrementarCantidad}
            onDecrementarCantidad={decrementarCantidad}
            calcularSubtotalProducto={calcularSubtotalProducto}
            calcularTotal={calcularTotal}
          />
        );
      
      case 2:
        return (
          <MetodosPagoVenta
            metodosPago={metodosPago}
            metodosPagoSeleccionados={metodosPagoSeleccionados}
            montoRestante={montoRestante}
            calcularTotal={calcularTotal}
            onAgregarMetodoPago={agregarMetodoPago}
            onActualizarMetodoPago={actualizarMetodoPago}
            onEliminarMetodoPago={eliminarMetodoPago}
            onDistribuirMontos={distribuirMontos}
          />
        );
      
      case 3:
        return (
          <div style={{ padding: '0.5rem' }}>
            <div className="form-field" style={{ marginBottom: '1rem' }}>
              <label className="field-label">Fecha</label>
              <input 
                type="date" 
                value={formData.fecha}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
              />
            </div>

            <div className="form-field" style={{ marginBottom: '1rem' }}>
              <label className="field-label">Observaciones</label>
              <textarea 
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Notas opcionales..."
                rows={2}
              />
            </div>

            <div style={{
              background: '#FAF9F7',
              border: '2px solid #D7CCC8',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                Productos ({productosSeleccionados.length})
              </div>
              {productosSeleccionados.map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0',
                  fontSize: '0.85rem',
                  borderBottom: i < productosSeleccionados.length - 1 ? '1px solid #D7CCC8' : 'none'
                }}>
                  <span>{item.producto?.nombre} x{item.cantidad}</span>
                  <span style={{ fontWeight: '600' }}>
                    ${Math.round(calcularSubtotalProducto(item)).toLocaleString('es-CL')}
                  </span>
                </div>
              ))}
              
              <div style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '2px solid #5D4037',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#5D4037'
              }}>
                <span>Total</span>
                <span>${Math.round(calcularTotal()).toLocaleString('es-CL')}</span>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const tablaVentas = ventasOrdenadas.map((venta, idx) => {
    const obtenerProductosVenta = (venta) => {
      if (venta.detalles && venta.detalles.length > 0) {
        if (venta.detalles.length === 1) {
          const detalle = venta.detalles[0];
          return (
            <div style={{ fontWeight: '600' }}>
              {detalle.producto?.nombre} ({detalle.cantidad})
            </div>
          );
        } else {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{venta.detalles.length} productos</span>
              <button 
                className="btn-observaciones"
                onClick={() => setDetallesModal(venta.detalles)}
              >
                📋
              </button>
            </div>
          );
        }
      }
      return <span style={{ color: '#8D6E63' }}>Sin productos</span>;
    };

    const obtenerMetodosPago = (venta) => {
      if (venta.metodosPago && venta.metodosPago.length > 0) {
        return venta.metodosPago.map(mp => 
          `${mp.metodoPago?.nombre}: $${Math.round(mp.montoAsignado || 0).toLocaleString('es-CL')}`
        ).join(', ');
      }
      return 'Sin métodos de pago';
    };

    return [
      <div key={`fecha-${idx}`}>{formatearFecha(venta.fecha)}</div>,
      obtenerProductosVenta(venta),
      <div key={`neto-${idx}`} className="tabla-monto">
        ${Math.round(venta.montoNeto || 0).toLocaleString('es-CL')}
      </div>,
      <div key={`iva-${idx}`} style={{ textAlign: 'right', color: '#8D6E63' }}>
        ${Math.round(venta.ivaTotal || 0).toLocaleString('es-CL')}
      </div>,
      <div key={`comision-${idx}`} style={{ textAlign: 'right', color: '#8D6E63' }}>
        ${Math.round(venta.comisionTotal || 0).toLocaleString('es-CL')}
      </div>,
      <div key={`bruto-${idx}`} style={{ 
        textAlign: 'right', 
        fontWeight: '600',
        color: '#5D4037',
        fontSize: '1.05rem'
      }}>
        ${Math.round(venta.montoBruto || 0).toLocaleString('es-CL')}
      </div>,
      <div key={`metodos-${idx}`} style={{ fontSize: '0.9rem' }}>
        {obtenerMetodosPago(venta)}
      </div>,
      venta.observaciones && venta.observaciones.trim() !== '' ? (
        <button 
          key={`obs-${idx}`}
          className="btn-observaciones"
          onClick={() => setObservacionesModal(venta.observaciones)}
        >
          📝
        </button>
      ) : (
        <span key={`obs-${idx}`} style={{ color: '#8D6E63' }}>—</span>
      )
    ];
  });

  return (
    <div className="ingresos-container">
      <style>{`
        .ingresos-container {
          padding: 0.75rem;
          background: #EFEBE9;
          min-height: 100vh;
          max-width: 1400px;
          margin: 0 auto;
        }

        .ingresos-header {
          background: linear-gradient(135deg, #5D4037, #8D6E63);
          color: white;
          border-radius: 12px;
          margin-bottom: 1rem;
          box-shadow: 0 4px 12px rgba(93, 64, 55, 0.15);
        }

        .ingresos-card {
          background: #FAF9F7;
          border: 1px solid #D7CCC8;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(93, 64, 55, 0.08);
          margin-bottom: 1rem;
          position: relative;
        }

        .ingresos-card::before {
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

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
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

        .ingresos-loading {
          padding: 2rem;
          text-align: center;
          color: #8D6E63;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Formulario */}
      <div className="ingresos-card">
        <div className="card-header">
          <h2 className="card-title">Registrar Venta</h2>
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
                  Guardar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="ingresos-card ingresos-header">
        <div className="card-header">
          <h1 className="card-title">Ventas</h1>
          <p className="card-subtitle">Registro y control de ingresos por ventas</p>
        </div>
        <div className="card-body">
          <div className="stats-grid">
            {resumen.map((r) => (
              <div key={r.label} className="stat-card">
                <span className="stat-label">{r.label}</span>
                <span className="stat-value">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="ingresos-card">
        <div className="card-header">
          <h2 className="card-title">Ventas Recientes</h2>
          <p className="card-subtitle">Últimas ventas registradas en el sistema</p>
        </div>
        <div className="card-body">
          <div className="tabla-container">
            <table className="tabla">
              <thead>
                <tr>
                  <th><SortHeaderButton label="Fecha" columnKey="fecha" /></th>
                  <th>Productos</th>
                  <th><SortHeaderButton label="Neto" columnKey="neto" /></th>
                  <th><SortHeaderButton label="IVA" columnKey="iva" /></th>
                  <th>Comisión</th>
                  <th><SortHeaderButton label="Bruto" columnKey="bruto" /></th>
                  <th>Métodos de Pago</th>
                  <th>Obs</th>
                </tr>
              </thead>
              <tbody>
                {tablaVentas.map((fila, index) => (
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

      {/* Modales */}
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
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#3E2723' }}>
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

      {detallesModal && (
        <DetallesProductosModal 
          detalles={detallesModal} 
          onClose={() => setDetallesModal(null)} 
        />
      )}
    </div>
  );
}