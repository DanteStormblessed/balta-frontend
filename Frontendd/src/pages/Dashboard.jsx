// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table } from '../components/UI.jsx';
import { api } from '../services/api/index.js';
import { 
  TrendingUp, 
  TrendingDown, 
  AccountBalance, 
  ShoppingCart,
  AttachMoney,
  Warning,
  ArrowUpward,
  ArrowDownward,
  SwapVert
} from '@mui/icons-material';

export default function Dashboard() {
  const [resumen, setResumen] = useState([
    { label: 'Ingresos', value: '$ 0', color: '#4CAF50' },
    { label: 'Egresos', value: '$ 0', color: '#F44336' },
    { label: 'Saldo', value: '$ 0', color: '#5D4037' }
  ]);
  
  const [metricas, setMetricas] = useState([
    { label: 'Ventas del Día', value: '0' },
    { label: 'Productos Vendidos', value: '0' },
    { label: 'Bajo Stock', value: '0' }
  ]);

  const [recientes, setRecientes] = useState([]);
  const [bajoStock, setBajoStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movimientosSort, setMovimientosSort] = useState({ key: 'fecha', direction: 'desc' });

  const movimientosRows = useMemo(() => {
    if (!recientes || recientes.length === 0) return [];
    const sorted = [...recientes].sort((a, b) => {
      let result = 0;
      switch (movimientosSort.key) {
        case 'fecha':
          result = (a.fechaOriginal?.getTime?.() || 0) - (b.fechaOriginal?.getTime?.() || 0);
          break;
        case 'monto':
          result = (a.monto || 0) - (b.monto || 0);
          break;
        case 'tipo':
          result = (a.tipo || '').localeCompare(b.tipo || '');
          break;
        default:
          result = 0;
      }
      return movimientosSort.direction === 'asc' ? result : -result;
    });

    return sorted.map((mov) => [
      mov.fechaLabel,
      mov.descripcion,
      mov.montoLabel,
      mov.tipoTag
    ]);
  }, [recientes, movimientosSort]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const now = new Date();
      
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
      const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      const inicioDia = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const finDia = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      const formatearFechaLocal = (fecha) => {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        const hours = String(fecha.getHours()).padStart(2, '0');
        const minutes = String(fecha.getMinutes()).padStart(2, '0');
        const seconds = String(fecha.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };

      const inicioDiaStr = formatearFechaLocal(inicioDia);
      const finDiaStr = formatearFechaLocal(finDia);

      const [
        ventasDelDia,
        todasLasVentas,
        todasLasCompras,
        todosLosGastos,
        productosBajoStock
      ] = await Promise.all([
        api.ventas.getPorPeriodo(inicioDiaStr, finDiaStr).catch(() => []),
        api.ventas.getAll().catch(() => []),
        api.compras.getAll().catch(() => []),
        api.gastos.getAll().catch(() => []),
        api.inventario.getBajoStock(10).catch(() => [])
      ]);

      const ventasMesArray = Array.isArray(todasLasVentas) ? todasLasVentas : [];
      const ingresos = ventasMesArray
        .filter(v => {
          const fechaVenta = obtenerFechaDesdeDato(v.fecha);
          return fechaVenta >= inicioMes && fechaVenta <= finMes;
        })
        .reduce((sum, v) => sum + (parseFloat(v?.montoNeto) || 0), 0);

      const comprasMesArray = Array.isArray(todasLasCompras) ? todasLasCompras : [];
      const comprasNeto = comprasMesArray
        .filter(c => {
          const fechaCompra = obtenerFechaDesdeDato(c.fecha);
          return fechaCompra >= inicioMes && fechaCompra <= finMes;
        })
        .reduce((sum, c) => sum + (parseFloat(c?.montoNeto) || 0), 0);

      const gastosMes = (Array.isArray(todosLosGastos) ? todosLosGastos : [])
        .filter(g => {
          const fechaGasto = obtenerFechaDesdeDato(g.fecha);
          return fechaGasto >= inicioMes && fechaGasto <= finMes;
        })
        .reduce((sum, g) => sum + (parseFloat(g?.monto) || 0), 0);

      const egresos = comprasNeto + gastosMes;
      const saldo = ingresos - egresos;

      setResumen([
        { 
          label: 'Ingresos', 
          value: `$ ${Math.round(ingresos).toLocaleString('es-CL')}`,
          color: '#4CAF50'
        },
        { 
          label: 'Egresos', 
          value: `$ ${Math.round(egresos).toLocaleString('es-CL')}`,
          color: '#F44336'
        },
        { 
          label: 'Saldo', 
          value: `$ ${Math.round(saldo).toLocaleString('es-CL')}`,
          color: saldo >= 0 ? '#4CAF50' : '#F44336'
        }
      ]);

      const ventasDelDiaArray = Array.isArray(ventasDelDia) ? ventasDelDia : [];
      const cantidadVentasDia = ventasDelDiaArray.length;
      
      const productosVendidosDia = ventasDelDiaArray.reduce((total, venta) => {
        if (venta && venta.detalles && Array.isArray(venta.detalles)) {
          return total + venta.detalles.reduce((sum, detalle) => {
            return sum + (parseInt(detalle?.cantidad) || 0);
          }, 0);
        }
        return total;
      }, 0);

      const productosBajoStockCount = Array.isArray(productosBajoStock) ? productosBajoStock.length : 0;

      setMetricas([
        { label: 'Ventas del Día', value: cantidadVentasDia.toString() },
        { label: 'Productos Vendidos', value: productosVendidosDia.toString() },
        { label: 'Bajo Stock', value: productosBajoStockCount.toString() }
      ]);

      const productosBajoStockArray = Array.isArray(productosBajoStock) ? productosBajoStock : [];
      setBajoStock(productosBajoStockArray.slice(0, 5).map(producto => [
        producto?.producto?.nombre || 'Producto',
        producto?.cantidadProducto || 0,
        (producto?.cantidadProducto || 0) < 5 ? 'Crítico' : 'Bajo'
      ]));

      const movimientosRecientes = [];
      const todasLasVentasArray = Array.isArray(todasLasVentas) ? todasLasVentas : [];
      const todasLasComprasArray = Array.isArray(todasLasCompras) ? todasLasCompras : [];

      const ventasRecientes = todasLasVentasArray.filter(venta => {
        const fechaVenta = obtenerFechaDesdeDato(venta?.fecha);
        const dosSemanasAtras = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        return fechaVenta >= dosSemanasAtras;
      }).slice(-10);

      ventasRecientes.reverse().forEach(venta => {
        const primerProducto = venta?.detalles && Array.isArray(venta.detalles) && venta.detalles.length > 0
          ? (venta.detalles[0]?.producto?.nombre || 'Producto')
          : 'Venta';
        
        const fechaFormateada = formatearFecha(venta?.fecha);
        const monto = venta?.montoNeto || venta?.montoTotal || 0;
        
        movimientosRecientes.push({
          fecha: fechaFormateada,
          descripcion: primerProducto,
          monto: monto,
          tipo: 'Venta',
          fechaOriginal: obtenerFechaDesdeDato(venta?.fecha)
        });
      });

      const comprasRecientes = todasLasComprasArray.filter(compra => {
        const fechaCompra = obtenerFechaDesdeDato(compra?.fecha);
        const dosSemanasAtras = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        return fechaCompra >= dosSemanasAtras;
      }).slice(-10);

      comprasRecientes.reverse().forEach(compra => {
        const primerProducto = compra?.detalles && Array.isArray(compra.detalles) && compra.detalles.length > 0
          ? (compra.detalles[0]?.descripcion || 'Insumo')
          : 'Compra';
        
        const fechaFormateada = formatearFecha(compra?.fecha);
        const monto = compra?.montoNeto || 0;
        
        movimientosRecientes.push({
          fecha: fechaFormateada,
          descripcion: primerProducto,
          monto: monto,
          tipo: 'Compra',
          fechaOriginal: obtenerFechaDesdeDato(compra?.fecha)
        });
      });

      const todosLosGastosArray = Array.isArray(todosLosGastos) ? todosLosGastos : [];
      todosLosGastosArray.forEach(gasto => {
        if (gasto) {
          const fechaFormateada = formatearFecha(gasto?.fecha);
          const monto = gasto?.monto || 0;
          
          movimientosRecientes.push({
            fecha: fechaFormateada,
            descripcion: gasto?.descripcion || 'Gasto',
            monto: monto,
            tipo: 'Gasto',
            fechaOriginal: obtenerFechaDesdeDato(gasto?.fecha)
          });
        }
      });

      const movimientosOrdenados = movimientosRecientes
        .sort((a, b) => b.fechaOriginal - a.fechaOriginal)
        .slice(0, 10)
        .map(mov => {
          return {
            fechaLabel: mov.fecha,
            fechaOriginal: mov.fechaOriginal,
            descripcion: mov.descripcion,
            monto: mov.monto,
            montoLabel: `$ ${Math.round(mov.monto).toLocaleString('es-CL')}`,
            tipo: mov.tipo,
            tipoTag: mov.tipo
          };
        });

      setRecientes(movimientosOrdenados);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerFechaDesdeDato = (fechaData) => {
    try {
      if (!fechaData) return new Date();
      
      let fecha;
      
      if (Array.isArray(fechaData)) {
        fecha = new Date(fechaData[0], fechaData[1] - 1, fechaData[2]);
      } else if (typeof fechaData === 'string') {
        fecha = new Date(fechaData);
      } else if (fechaData instanceof Date) {
        fecha = fechaData;
      } else {
        fecha = new Date();
      }

      if (isNaN(fecha.getTime())) {
        return new Date();
      }

      return fecha;
    } catch (e) {
      return new Date();
    }
  };

  const formatearFecha = (fechaData) => {
    try {
      const fecha = obtenerFechaDesdeDato(fechaData);
      const hoy = new Date();
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);

      if (fecha.toDateString() === hoy.toDateString()) {
        return 'Hoy';
      } else if (fecha.toDateString() === ayer.toDateString()) {
        return 'Ayer';
      } else {
        return fecha.toLocaleDateString('es-CL', { 
          day: '2-digit', 
          month: 'short'
        });
      }
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  const handleSortMovimientos = (columnKey) => {
    setMovimientosSort((prev) => {
      if (prev.key === columnKey) {
        return {
          key: columnKey,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return {
        key: columnKey,
        direction: columnKey === 'fecha' ? 'desc' : 'asc'
      };
    });
  };

  const SortHeaderButton = ({ label, columnKey }) => {
    const isActive = movimientosSort.key === columnKey;
    const IconComponent = !isActive ? SwapVert : movimientosSort.direction === 'asc' ? ArrowUpward : ArrowDownward;

    return (
      <button
        type="button"
        onClick={() => handleSortMovimientos(columnKey)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          font: 'inherit',
          cursor: 'pointer',
          padding: 0
        }}
      >
        <span>{label}</span>
        <IconComponent sx={{ fontSize: '0.9rem' }} />
      </button>
    );
  };

  if (loading) {
    return (
      <div className="stack dashboard-page" style={{ padding: '0.75rem' }}>
        <Card contentSx={{ p: { xs: 1.5, sm: 2.5, md: 3 } }}>
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
            Cargando...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="stack dashboard-page" style={{ padding: '0.75rem', gap: '0.75rem' }}>
      {/* RESUMEN */}
      <Card contentSx={{ p: { xs: 1.5, sm: 2.5, md: 3 } }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 'clamp(0.35rem, 1.8vw, 1rem)',
          marginBottom: 'clamp(0.35rem, 1.8vw, 1rem)'
        }}>
          {resumen.map((r) => (
            <div key={r.label} style={{
              textAlign: 'center',
              padding: 'clamp(0.55rem, 2.4vw, 1rem)',
              background: 'var(--panel-2)',
              borderRadius: '8px',
              border: '2px solid var(--border)',
              minWidth: 0
            }}>
              <div style={{ 
                fontSize: 'clamp(0.68rem, 2.8vw, 0.85rem)', 
                color: 'var(--muted)', 
                marginBottom: 'clamp(0.25rem, 1.5vw, 0.5rem)',
                fontWeight: '600'
              }}>
                {r.label}
              </div>
              <div style={{ 
                fontSize: 'clamp(0.95rem, 4.6vw, 1.5rem)', 
                fontWeight: '600',
                color: r.color,
                whiteSpace: 'nowrap'
              }}>
                {r.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 'clamp(0.35rem, 1.8vw, 1rem)'
        }}>
          {metricas.map((m) => (
            <div key={m.label} style={{
              textAlign: 'center',
              padding: 'clamp(0.5rem, 2.2vw, 0.75rem)',
              background: 'var(--panel)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              minWidth: 0
            }}>
              <div style={{ 
                fontSize: 'clamp(0.66rem, 2.6vw, 0.8rem)', 
                color: 'var(--muted)', 
                marginBottom: 'clamp(0.2rem, 1.2vw, 0.35rem)'
              }}>
                {m.label}
              </div>
              <div style={{ 
                fontSize: 'clamp(0.9rem, 4vw, 1.2rem)', 
                fontWeight: '600'
              }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ALERTAS Y MOVIMIENTOS */}
      <div className="dashboard-alertas-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
        {/* BAJO STOCK */}
        <Card title="Bajo Stock" contentSx={{ p: { xs: 1.5, sm: 2.5, md: 3 } }}>
          {bajoStock.length > 0 ? (
            <Table 
              columns={["Producto", "Stock", "Estado"]} 
              rows={bajoStock}
            />
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              color: 'var(--muted)'
            }}>
              Stock OK
            </div>
          )}
        </Card>

        {/* MOVIMIENTOS */}
        <Card title="Movimientos Recientes" contentSx={{ p: { xs: 1.5, sm: 2.5, md: 3 } }}>
          {recientes.length > 0 ? (
            <Table 
              columns={[
                <SortHeaderButton key="fecha" label="Fecha" columnKey="fecha" />, 
                "Descripción",
                <SortHeaderButton key="monto" label="Monto" columnKey="monto" />, 
                <SortHeaderButton key="tipo" label="Tipo" columnKey="tipo" />
              ]} 
              rows={movimientosRows}
            />
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              color: 'var(--muted)'
            }}>
              Sin movimientos
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}