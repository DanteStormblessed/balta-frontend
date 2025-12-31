import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Tooltip
} from '@mui/material';
import {
  AttachMoney,
  ReceiptLong,
  ShoppingBag,
  Payment,
  Insights,
  TrendingUp,
  Analytics
} from '@mui/icons-material';
import { api } from '../../services/api';
import PeriodoToolbar from '../../components/PeriodoToolbar.jsx';
import '../estadisticas-page.css';

const CARD_BASE_SX = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 3,
  border: '1px solid #D7CCC8',
  boxShadow: '0 8px 20px rgba(93, 64, 55, 0.1)',
  backgroundColor: '#FAF9F7'
};

const KPI_CARD_HEIGHT = 170;

const parseFecha = (valor) => {
  if (!valor) return null;
  try {
    if (Array.isArray(valor)) {
      const [year, month, day] = valor;
      return new Date(year || 0, (month || 1) - 1, day || 1);
    }
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  } catch (e) {
    return null;
  }
};

const toNumber = (valor) => {
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
  if (typeof valor === 'string') {
    const normalizado = valor.replace(/[^0-9.-]/g, '');
    const numero = parseFloat(normalizado);
    return Number.isFinite(numero) ? numero : 0;
  }
  return 0;
};

export default function EstadisticasCompras() {
  const [datos, setDatos] = useState({
    productosMasComprados: [],
    comprasMes: { bruto: 0, neto: 0, iva: 0 },
    metodosPago: [],
    comisiones: 0,
    todasCompras: [],
    tendenciaMensual: []
  });
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    fin: new Date()
  });

  useEffect(() => {
    cargarEstadisticas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const compras = await api.compras.getAll().catch(() => []);
      const metodosPago = await api.metodosPago.getAll().catch(() => []);
      const tendenciaMensual = await cargarTendenciaMensual();

      const comprasPeriodo = (compras || []).filter(compra => {
        const fecha = parseFecha(compra?.fecha);
        return fecha && fecha >= periodo.inicio && fecha <= periodo.fin;
      });

      const totalBruto = comprasPeriodo.reduce((sum, compra) => sum + toNumber(compra?.montoTotal), 0);
      const totalIva = comprasPeriodo.reduce((sum, compra) => {
        const bruto = toNumber(compra?.montoTotal);
        return (compra?.tipoDocumento || '').toLowerCase() === 'factura'
          ? sum + (bruto - bruto / 1.19)
          : sum;
      }, 0);
      const totalNeto = Math.max(0, totalBruto - totalIva);

      const productosMasComprados = calcularTopProductos(comprasPeriodo);
      const metodosConUso = calcularUsoMetodosPago(metodosPago, comprasPeriodo);

      setDatos({
        productosMasComprados,
        comprasMes: { bruto: totalBruto, neto: totalNeto, iva: totalIva },
        metodosPago: metodosConUso,
        comisiones: 0,
        todasCompras: comprasPeriodo,
        tendenciaMensual
      });
    } catch (error) {
      console.error('Error cargando estadísticas de compras:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarTendenciaMensual = async () => {
    const tendencia = [];
    const hoy = new Date();

    for (let i = 5; i >= 0; i--) {
      const mes = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const inicioMes = new Date(mes.getFullYear(), mes.getMonth(), 1);
      const finMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);

      try {
        const totalMes = await api.compras.getTotalPorPeriodo(
          inicioMes.toISOString(),
          finMes.toISOString()
        );

        tendencia.push({
          mes: mes.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }),
          total: parseFloat(totalMes) || 0
        });
      } catch (error) {
        tendencia.push({
          mes: mes.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }),
          total: 0
        });
      }
    }

    return tendencia;
  };

  const calcularTopProductos = (comprasPeriodo) => {
    const mapa = new Map();

    comprasPeriodo.forEach(compra => {
      (compra?.detalles || []).forEach(detalle => {
        const nombre = (detalle?.descripcion || 'Producto').trim();
        const cantidad = parseInt(detalle?.cantidad, 10) || 0;
        mapa.set(nombre, (mapa.get(nombre) || 0) + cantidad);
      });
    });

    return Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([nombre, cantidad]) => [{ nombre }, cantidad]);
  };

  const calcularUsoMetodosPago = (metodos, comprasPeriodo) => {
    const metodosConMontos = metodos.map(metodo => {
      const monto = comprasPeriodo
        .filter(compra => compra?.metodoPago?.idMetodoPago === metodo.idMetodoPago)
        .reduce((sum, compra) => sum + toNumber(compra?.montoTotal), 0);

      return { ...metodo, monto };
    });

    const total = metodosConMontos.reduce((sum, metodo) => sum + metodo.monto, 0);

    return metodosConMontos
      .map(metodo => ({
        ...metodo,
        porcentaje: total > 0 ? (metodo.monto / total) * 100 : 0
      }))
      .filter(metodo => metodo.monto > 0);
  };

  const cambiarMes = (meses) => {
    const nuevaFecha = new Date(periodo.inicio);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + meses);

    setPeriodo({
      inicio: new Date(nuevaFecha.getFullYear(), nuevaFecha.getMonth(), 1),
      fin: new Date(nuevaFecha.getFullYear(), nuevaFecha.getMonth() + 1, 0)
    });
  };

  const formatearMes = (fecha) => fecha.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

  const restablecerPeriodoActual = () => {
    const ahora = new Date();
    setPeriodo({
      inicio: new Date(ahora.getFullYear(), ahora.getMonth(), 1),
      fin: new Date()
    });
  };

  const calcularMetricasClave = () => {
    const comprasFiltradas = datos.todasCompras;
    const totalCompras = comprasFiltradas.reduce((sum, c) => sum + toNumber(c.montoTotal), 0);
    const cantidadCompras = comprasFiltradas.length;
    const productosComprados = comprasFiltradas.reduce((sum, c) =>
      sum + (c.detalles?.reduce((detSum, d) => detSum + (parseInt(d.cantidad, 10) || 0), 0) || 0), 0
    );

    return {
      ticketPromedio: cantidadCompras > 0 ? totalCompras / cantidadCompras : 0,
      comprasPorDia: cantidadCompras > 0 ? cantidadCompras / 30 : 0,
      productosPorCompra: cantidadCompras > 0 ? productosComprados / cantidadCompras : 0,
      totalCompras,
      cantidadCompras
    };
  };

  const calcularComparativa = () => {
    const mesActual = datos.comprasMes.bruto;
    const mesAnterior = datos.tendenciaMensual[4]?.total || 0;

    const diferencia = mesActual - mesAnterior;
    const porcentaje = mesAnterior > 0 ? (diferencia / mesAnterior) * 100 : 0;

    return {
      mesActual,
      mesAnterior,
      diferencia,
      porcentaje,
      esPositivo: diferencia >= 0
    };
  };

  const generarResumenEjecutivo = () => {
    return {};
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Cargando estadísticas...
        </Typography>
      </Box>
    );
  }

  const metricas = calcularMetricasClave();
  const comparativa = calcularComparativa();
  generarResumenEjecutivo();
  const rangoLabel = `${periodo.inicio.toLocaleDateString('es-CL')} - ${periodo.fin.toLocaleDateString('es-CL')}`;
  const diasPeriodo = Math.max(1, Math.round((periodo.fin - periodo.inicio) / (1000 * 60 * 60 * 24)) + 1);

  const kpiCards = [
    {
      key: 'compras-totales',
      titulo: 'Compras totales',
      valor: `$${metricas.totalCompras.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`,
      icono: <AttachMoney fontSize="small" />, 
      color: '#5D4037'
    },
    {
      key: 'ticket-promedio',
      titulo: 'Ticket promedio',
      valor: `$${metricas.ticketPromedio.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`,
      icono: <ReceiptLong fontSize="small" />, 
      color: '#A1887F'
    },
    {
      key: 'cantidad-compras',
      titulo: 'Cantidad compras',
      valor: metricas.cantidadCompras.toString(),
      icono: <ShoppingBag fontSize="small" />, 
      color: '#BCAAA4'
    },
    {
      key: 'comparativa',
      titulo: `Comparativa vs mes anterior ($${comparativa.mesAnterior.toLocaleString('es-CL', { minimumFractionDigits: 0 })})`,
      valor: `${comparativa.esPositivo ? '+' : ''}${comparativa.porcentaje.toFixed(1)}%`,
      icono: <TrendingUp fontSize="small" />, 
      color: comparativa.esPositivo ? '#2E7D32' : '#C62828'
    }
  ];

  const summaryCard = {
    key: 'resumen-global',
    element: (
      <Card sx={{ ...CARD_BASE_SX, mt: 1 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Insights sx={{ color: '#5D4037' }} />
              <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold' }}>
                Resumen
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color: '#8D6E63' }}>
                Período: {rangoLabel}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {diasPeriodo} días analizados
              </Typography>
            </Box>
          </Box>

          {/* Resumen financiero + métodos de pago (integrados en el resumen) */}
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }
            }}
          >
            <Box
              sx={{
                p: 1.75,
                borderRadius: 2,
                border: '1px solid #D7CCC8',
                backgroundColor: '#FAF9F7',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ color: '#5D4037', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}
              >
                <TrendingUp fontSize="small" /> Resumen financiero
              </Typography>
              <Box sx={{ flex: 1, minHeight: 180 }}>
                <GraficoComprasMes datos={datos.comprasMes} comisiones={datos.comisiones} />
              </Box>
            </Box>

            <Box
              sx={{
                p: 1.75,
                borderRadius: 2,
                border: '1px solid #D7CCC8',
                backgroundColor: '#FAF9F7',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ color: '#5D4037', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}
              >
                <Payment fontSize="small" /> Métodos de pago
              </Typography>
              <Box sx={{ flex: 1, minHeight: 180, display: 'flex', justifyContent: 'center' }}>
                <GraficoMetodosPago datos={datos.metodosPago} />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #D7CCC8', backgroundColor: '#FAF9F7', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" sx={{ color: '#5D4037', fontWeight: 'bold', mb: 1 }}>
                Top productos comprados
              </Typography>
              <GraficoBarrasProductos datos={datos.productosMasComprados} />
            </Box>
            <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #D7CCC8', backgroundColor: '#FAF9F7', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" sx={{ color: '#5D4037', fontWeight: 'bold', mb: 1 }}>
                Tendencia últimos 6 meses
              </Typography>
              <GraficoTendenciaMensual datos={datos.tendenciaMensual} />
            </Box>
          </Box>

          {/* Bloque compacto: IVA + métricas (sin duplicar ticket promedio) */}
          <Box
            sx={{
              p: 1.75,
              borderRadius: 2,
              border: '1px solid #D7CCC8',
              backgroundColor: '#FAF9F7'
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ color: '#5D4037', mb: 1.25, display: 'flex', alignItems: 'center', gap: 0.6 }}
            >
              <AttachMoney fontSize="small" /> IVA y métricas
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }
              }}
            >
              <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#F5F5F5', border: '1px solid #D7CCC8' }}>
                <Typography variant="caption" color="text.secondary">IVA estimado (período)</Typography>
                <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold', lineHeight: 1.15 }}>
                  ${datos.comprasMes.iva.toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                </Typography>
              </Box>

              <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#F5F5F5', border: '1px solid #D7CCC8' }}>
                <Typography variant="caption" color="text.secondary">Compras por día</Typography>
                <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold', lineHeight: 1.15 }}>
                  {metricas.comprasPorDia.toFixed(1)}
                </Typography>
              </Box>

              <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#F5F5F5', border: '1px solid #D7CCC8' }}>
                <Typography variant="caption" color="text.secondary">Productos por compra</Typography>
                <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold', lineHeight: 1.15 }}>
                  {metricas.productosPorCompra.toFixed(1)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    )
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 2.25, md: 2.5, lg: 3 }, maxWidth: 1600, margin: '0 auto' }} className="estadisticas-page">
      <PeriodoToolbar
        icon={Analytics}
        titulo={formatearMes(periodo.inicio)}
        periodoLabel={rangoLabel}
        onPrev={() => cambiarMes(-1)}
        onReset={restablecerPeriodoActual}
        onNext={() => cambiarMes(1)}
      />

      <Card sx={{ ...CARD_BASE_SX, p: { xs: 1.25, sm: 1.5 }, mb: { xs: 1.25, md: 0.5 } }}>
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 1.25, sm: 1.5, md: 1.75 },
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))'
            }
          }}
        >
          {kpiCards.map(kpi => (
            <MetricaCompacta key={kpi.key} {...kpi} />
          ))}
        </Box>
      </Card>

      <Box>
        {summaryCard.element}
      </Box>
    </Box>
  );
}

function MetricaCompacta({ titulo, valor, subtitulo, icono, color }) {
  return (
    <Box sx={{
      p: 1.25,
      borderRadius: 2,
      border: '1px solid #D7CCC8',
      backgroundColor: '#F5F5F5',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 0.9,
      minHeight: 88
    }}>
      <Box sx={{
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: `${color}20`,
        color,
        display: 'grid',
        placeItems: 'center',
        fontSize: '1.2rem'
      }}>
        {icono}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ color: '#5D4037', fontWeight: 550, fontSize: '1.1rem', lineHeight: 1.2 }}>
          {valor}
        </Typography>
        <Typography variant="body2" sx={{ color: '#6D4C41', fontWeight: 500, fontSize: '0.85rem' }}>
          {titulo}
        </Typography>
        {subtitulo && (
          <Typography variant="caption" sx={{ color: '#8D6E63', fontSize: '0.78rem' }}>
            {subtitulo}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

const FIXED_ROW_COUNT = 6;
const FIXED_TABLE_HEIGHT = 150;
const TABLE_ROW_TEMPLATE = 'minmax(0, 1.4fr) minmax(0, 0.8fr) minmax(0, 0.5fr)';

function GraficoTendenciaMensual({ datos }) {
  const maxValor = Math.max(...datos.map(d => d.total), 1);
  const filledData = [...datos];
  while (filledData.length < FIXED_ROW_COUNT) {
    filledData.push({ mes: '-', total: 0, isEmpty: true });
  }
  const displayData = filledData.slice(0, FIXED_ROW_COUNT);

  return (
    <Box sx={{ width: '100%', height: FIXED_TABLE_HEIGHT, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {displayData.map((item, index) => {
        const porcentaje = item.isEmpty ? 0 : (item.total / maxValor) * 100;
        const mesLabel = item.mes.split(' ')[0];
        return (
          <Box
            key={index}
            sx={{
              display: 'grid',
              gridTemplateColumns: TABLE_ROW_TEMPLATE,
              alignItems: 'center',
              columnGap: 1.5,
              height: 24
            }}
          >
            <Tooltip title={item.isEmpty ? '' : mesLabel} disableHoverListener={item.isEmpty} arrow>
              <Typography
                variant="caption"
                sx={{
                  color: item.isEmpty ? 'transparent' : '#5D4037',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {mesLabel}
              </Typography>
            </Tooltip>
            <Box sx={{ width: '100%', height: 8, backgroundColor: '#EFEBE9', borderRadius: 4, overflow: 'hidden', justifySelf: 'stretch' }}>
              {!item.isEmpty && (
                <Box sx={{ width: `${porcentaje}%`, height: '100%', background: 'linear-gradient(90deg, #5D4037, #8D6E63)', borderRadius: 4 }} />
              )}
            </Box>
            <Typography
              variant="caption"
              sx={{ textAlign: 'right', fontWeight: 'bold', color: item.isEmpty ? 'transparent' : '#5D4037' }}
            >
              {item.isEmpty ? '-' : `$${(item.total/1000).toFixed(0)}k`}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function GraficoBarrasProductos({ datos }) {
  const maxCantidad = Math.max(...datos.map(item => item[1] || 0), 1);
  const filledData = [...datos];
  while (filledData.length < FIXED_ROW_COUNT) {
    filledData.push([{ nombre: '-' }, 0, true]);
  }
  const displayData = filledData.slice(0, FIXED_ROW_COUNT);

  return (
    <Box sx={{ width: '100%', height: FIXED_TABLE_HEIGHT, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {displayData.map((item, index) => {
        const isEmpty = item[2] === true;
        const producto = item[0];
        const cantidad = item[1] || 0;
        const porcentaje = isEmpty ? 0 : (maxCantidad > 0 ? (cantidad / maxCantidad) * 100 : 0);
        const productName = producto?.nombre || '-';
        return (
          <Box
            key={index}
            sx={{
              display: 'grid',
              gridTemplateColumns: TABLE_ROW_TEMPLATE,
              alignItems: 'center',
              columnGap: 1.5,
              height: 24
            }}
          >
            <Tooltip title={isEmpty ? '' : productName} disableHoverListener={isEmpty} arrow>
              <Typography
                variant="caption"
                sx={{
                  color: isEmpty ? 'transparent' : '#5D4037',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {productName}
              </Typography>
            </Tooltip>
            <Box sx={{ width: '100%', height: 8, backgroundColor: '#EFEBE9', borderRadius: 4, overflow: 'hidden', justifySelf: 'stretch' }}>
              {!isEmpty && (
                <Box sx={{ width: `${porcentaje}%`, height: '100%', background: 'linear-gradient(90deg, #5D4037, #8D6E63)', borderRadius: 4 }} />
              )}
            </Box>
            <Typography
              variant="caption"
              sx={{ textAlign: 'right', fontWeight: 'bold', color: isEmpty ? 'transparent' : '#5D4037' }}
            >
              {isEmpty ? '-' : cantidad}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function GraficoComprasMes({ datos, comisiones }) {
  const { bruto, neto, iva } = datos;
  const netoFinal = Math.max(0, neto - comisiones);
  const total = bruto || 1;
  const pNeto = (netoFinal / total) * 100;
  const pCom = (comisiones / total) * 100;

  const datosTorta = [
    { nombre: 'Neto', valor: netoFinal, color: '#4CAF50' },
    { nombre: 'Com.', valor: comisiones, color: '#FF6B6B' },
    { nombre: 'IVA', valor: iva, color: '#2196F3' }
  ];

  return (
    <Box sx={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Box sx={{ position: 'relative', height: 140, mb: 2 }}>
        <Box sx={{
          position: 'relative', width: 140, height: 140, margin: '0 auto', borderRadius: '50%',
          background: `conic-gradient(#4CAF50 0% ${pNeto}%, #FF6B6B ${pNeto}% ${pNeto + pCom}%, #2196F3 ${pNeto + pCom}% 100%)`
        }} />
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          textAlign: 'center', backgroundColor: 'white', borderRadius: '50%', width: 90, height: 90,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: 1
        }}>
          <Typography variant="caption" sx={{ color: '#8D6E63' }}>Total</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#5D4037' }}>${Math.round(bruto/1000)}k</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
        {datosTorta.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, backgroundColor: item.color, borderRadius: '50%' }} />
            <Typography variant="caption" sx={{ fontWeight: 'medium' }}>{item.nombre}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function GraficoMetodosPago({ datos }) {
  if (datos.length === 0) return <Box sx={{ textAlign: 'center', py: 4 }}>Sin datos</Box>;

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
  const total = datos.reduce((acc, m) => acc + m.monto, 0);
  if (total === 0) {
    return <Box sx={{ textAlign: 'center', py: 4 }}>Sin datos</Box>;
  }

  let currentAngle = 0;
  const segmentos = datos.map((m, index) => {
    const porcentaje = (m.monto / total) * 100;
    const start = currentAngle;
    const end = currentAngle + porcentaje;
    currentAngle = end;
    return {
      nombre: m.nombre,
      porcentaje,
      color: colors[index % colors.length],
      start,
      end
    };
  });

  const gradientStops = segmentos
    .map(seg => `${seg.color} ${seg.start}% ${seg.end}%`)
    .join(', ');

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Box sx={{ position: 'relative', height: 140 }}>
        <Box
          sx={{
            position: 'relative',
            width: 140,
            height: 140,
            margin: '0 auto',
            borderRadius: '50%',
            background: `conic-gradient(${gradientStops})`
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: '50%',
            width: 90,
            height: 90,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: 1
          }}
        >
          <Typography variant="caption" sx={{ color: '#8D6E63' }}>Total</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#5D4037' }}>
            ${Math.round(total/1000)}k
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5 }}>
        {segmentos.map(seg => (
          <Box key={seg.nombre} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: seg.color }} />
            <Typography variant="caption" sx={{ color: '#5D4037' }}>
              {seg.nombre} ({seg.porcentaje.toFixed(0)}%)
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function GraficoComisiones({ comisiones }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h3" sx={{ color: '#5D4037', fontWeight: 'bold', mb: 1 }}>
        ${comisiones.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
        Acumulado del mes
      </Typography>
      <Box sx={{ width: '100%', height: 6, backgroundColor: '#EFEBE9', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #5D4037, #8D6E63)' }} />
      </Box>
    </Box>
  );
}
