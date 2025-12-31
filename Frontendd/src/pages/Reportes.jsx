import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Tooltip
} from '@mui/material';
import {
  FilterList,
  Download,
  TrendingUp,
  AttachMoney,
  ShoppingCart,
  Assessment,
  Insights,
  Analytics,
  ReceiptLong,
  ShoppingBag,
  InfoOutlined
} from '@mui/icons-material';
import { api } from '../services/api/index.js';
import { API_BASE_URL } from '../services/api/config.js';
import PeriodoToolbar from '../components/PeriodoToolbar.jsx';


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

const FIXED_ROW_COUNT = 6;
const FIXED_TABLE_HEIGHT = 150;
const TABLE_ROW_TEMPLATE = 'minmax(0, 1.4fr) minmax(0, 0.8fr) minmax(0, 0.5fr)';

const crearPeriodoInicial = () => {
  const now = new Date();
  return {
    inicio: new Date(now.getFullYear(), now.getMonth(), 1),
    fin: new Date()
  };
};

const numberFormatter = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0 });

export default function Reportes() {
  const [periodo, setPeriodo] = useState(() => crearPeriodoInicial());
  const [periodoActivo, setPeriodoActivo] = useState(() => crearPeriodoInicial());
  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState({
    ingresos: 0,
    egresos: 0,
    saldo: 0,
    compras: 0,
    gastos: 0,
    operaciones: 0
  });
  const [serieMensual, setSerieMensual] = useState([]);
  const [categoriaDistribucion, setCategoriaDistribucion] = useState([]);
  const [showFiltros, setShowFiltros] = useState(false);

  const pad2 = (n) => String(n).padStart(2, '0');

  const dateToInputValue = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  };

  const parseInputDateToLocalDate = (value) => {
    // value is yyyy-mm-dd; build Date in local time to avoid UTC offset shifting a day.
    const [y, m, d] = String(value).split('-').map(Number);
    if (!y || !m || !d) return new Date(value);
    return new Date(y, m - 1, d);
  };

  const dateToYearMonth = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
  };

  useEffect(() => {
    let cancelado = false;

    const cargarReportes = async () => {
      setLoading(true);
      try {
        const inicioISO = periodoActivo.inicio.toISOString();
        const finISO = periodoActivo.fin.toISOString();

        const [totalVentas, totalCompras, totalGastos, ventasPeriodo] = await Promise.all([
          api.ventas.getTotalPorPeriodo(inicioISO, finISO).catch(() => 0),
          api.compras.getTotalPorPeriodo(inicioISO, finISO).catch(() => 0),
          api.gastos.getTotalPorPeriodo(inicioISO, finISO).catch(() => 0),
          api.ventas.getPorPeriodo(inicioISO, finISO).catch(() => [])
        ]);

        if (cancelado) return;

        const ingresos = parseFloat(totalVentas) || 0;
        const compras = parseFloat(totalCompras) || 0;
        const gastos = parseFloat(totalGastos) || 0;
        const egresos = compras + gastos;
        const saldo = ingresos - egresos;

        setResumen({
          ingresos,
          egresos,
          saldo,
          compras,
          gastos,
          operaciones: ventasPeriodo.length
        });

        const meses = generarMesesPeriodo(periodoActivo);
        const serie = await Promise.all(
          meses.map(async (mes) => {
            const [ventasMes, comprasMes] = await Promise.all([
              api.ventas.getTotalPorPeriodo(mes.inicio, mes.fin).catch(() => 0),
              api.compras.getTotalPorPeriodo(mes.inicio, mes.fin).catch(() => 0)
            ]);
            return {
              mes: mes.label,
              ventas: parseFloat(ventasMes) || 0,
              compras: parseFloat(comprasMes) || 0
            };
          })
        );

        if (!cancelado) {
          setSerieMensual(serie);
          setCategoriaDistribucion(construirDistribucionCategorias(ventasPeriodo));
        }
      } catch (error) {
        console.error('Error al cargar reportes:', error);
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    };

    cargarReportes();
    return () => {
      cancelado = true;
    };
  }, [periodoActivo]);

  const indicadores = useMemo(() => {
    const ticketPromedio = resumen.operaciones ? resumen.ingresos / resumen.operaciones : 0;
    const margen = resumen.ingresos ? (resumen.saldo / resumen.ingresos) * 100 : 0;
    const reinversion = resumen.ingresos ? (resumen.egresos / resumen.ingresos) * 100 : 0;
    const diasPeriodo = Math.max(1, Math.round((periodoActivo.fin - periodoActivo.inicio) / (1000 * 60 * 60 * 24)) + 1);
    const promedioDiario = diasPeriodo ? resumen.ingresos / diasPeriodo : 0;

    return {
      ticketPromedio,
      margen,
      reinversion,
      promedioDiario,
      diasPeriodo
    };
  }, [resumen, periodoActivo]);

  const comparativaSerie = useMemo(() => {
    if (!serieMensual.length) {
      return {
        meses: 0,
        totalVentas: 0,
        totalCompras: 0,
        diferencia: 0,
        mejorMesVentas: { mes: '-', ventas: 0 },
        mejorMesCompras: { mes: '-', compras: 0 }
      };
    }

    const totalVentas = serieMensual.reduce((sum, item) => sum + item.ventas, 0);
    const totalCompras = serieMensual.reduce((sum, item) => sum + item.compras, 0);
    const mejorMesVentas = serieMensual.reduce((prev, curr) => (curr.ventas > prev.ventas ? curr : prev), serieMensual[0]);
    const mejorMesCompras = serieMensual.reduce((prev, curr) => (curr.compras > prev.compras ? curr : prev), serieMensual[0]);

    return {
      meses: serieMensual.length,
      totalVentas,
      totalCompras,
      diferencia: totalVentas - totalCompras,
      mejorMesVentas,
      mejorMesCompras
    };
  }, [serieMensual]);

  const cambiarMes = (meses) => {
    const nuevaFecha = new Date(periodoActivo.inicio);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + meses);

    setPeriodoActivo({
      inicio: new Date(nuevaFecha.getFullYear(), nuevaFecha.getMonth(), 1),
      fin: new Date(nuevaFecha.getFullYear(), nuevaFecha.getMonth() + 1, 0)
    });
    setPeriodo({
      inicio: new Date(nuevaFecha.getFullYear(), nuevaFecha.getMonth(), 1),
      fin: new Date(nuevaFecha.getFullYear(), nuevaFecha.getMonth() + 1, 0)
    });
  };

  const formatearMes = (fecha) => {
    return fecha.toLocaleDateString('es-CL', {
      month: 'long',
      year: 'numeric'
    });
  };

  const formatearRangoMeses = (inicio, fin) => {
    const inicioKey = `${inicio.getFullYear()}-${inicio.getMonth()}`;
    const finKey = `${fin.getFullYear()}-${fin.getMonth()}`;

    if (inicioKey === finKey) {
      return formatearMes(inicio);
    }

    return `${formatearMes(inicio)} a ${formatearMes(fin)}`;
  };

  const restablecerPeriodoActual = () => {
    const base = crearPeriodoInicial();
    setPeriodo(base);
    setPeriodoActivo(base);
  };

  const handleAplicarFiltros = () => {
    setPeriodoActivo({ ...periodo });
    setShowFiltros(false);
  };

  const handleLimpiarFiltros = () => {
    const base = crearPeriodoInicial();
    setPeriodo(base);
    setPeriodoActivo(base);
    setShowFiltros(false);
  };

  const descargarReporteExcel = async () => {
    try {
      // Use local year-month to avoid shifting to previous month due to timezone offsets.
      const desde = dateToYearMonth(periodoActivo.inicio);
      const hasta = dateToYearMonth(periodoActivo.fin);
      const url = `${API_BASE_URL}/estadisticas/reporte-mensual/detallado?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      if (!res.ok) {
        throw new Error('Error al descargar reporte');
      }

      const blob = await res.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = `reporte_mensual_detallado_${desde}_${hasta}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlBlob);
    } catch (err) {
      console.error('Error descargando reporte:', err);
      alert('No se pudo descargar el reporte. Revisa la consola.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Cargando reportes...
        </Typography>
      </Box>
    );
  }

  const rangoLabel = `${periodoActivo.inicio.toLocaleDateString('es-CL')} - ${periodoActivo.fin.toLocaleDateString('es-CL')}`;
  const diasPeriodo = indicadores.diasPeriodo;

  const kpiCards = [
    {
      key: 'ingresos-totales',
      titulo: 'Ingresos totales',
      valor: `$${resumen.ingresos.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`,
      icono: <AttachMoney fontSize="small" />,
      color: '#5D4037'
    },
    {
      key: 'egresos-totales',
      titulo: 'Egresos totales',
      valor: `$${resumen.egresos.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`,
      icono: <ShoppingCart fontSize="small" />,
      color: '#A1887F'
    },
    {
      key: 'saldo',
      titulo: 'Saldo neto',
      valor: `$${resumen.saldo.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`,
      icono: <TrendingUp fontSize="small" />,
      color: resumen.saldo >= 0 ? '#2E7D32' : '#C62828'
    },
    {
      key: 'ticket-promedio',
      titulo: 'Ticket promedio',
      valor: `$${indicadores.ticketPromedio.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`,
      icono: <ReceiptLong fontSize="small" />,
      color: '#BCAAA4'
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

          {/* Resumen financiero + Distribución de egresos */}
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
                <TrendingUp fontSize="small" /> Balance del período
              </Typography>
              <Box sx={{ flex: 1, minHeight: 180 }}>
                <GraficoBalance ingresos={resumen.ingresos} egresos={resumen.egresos} saldo={resumen.saldo} />
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
                <ShoppingCart fontSize="small" /> Distribución de egresos
              </Typography>
              <Box sx={{ flex: 1, minHeight: 180, display: 'flex', justifyContent: 'center' }}>
                <GraficoEgresos compras={resumen.compras} gastos={resumen.gastos} />
              </Box>
            </Box>
          </Box>

          {/* Bloque medio: Tendencia mensual + Top categorías */}
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #D7CCC8', backgroundColor: '#FAF9F7', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" sx={{ color: '#5D4037', fontWeight: 'bold', mb: 1 }}>
                Tendencia mensual (Ventas vs Compras)
              </Typography>
              <GraficoTendenciaMensual datos={serieMensual} />
            </Box>
            <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #D7CCC8', backgroundColor: '#FAF9F7', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" sx={{ color: '#5D4037', fontWeight: 'bold', mb: 1 }}>
                Top categorías por ventas
              </Typography>
              <GraficoBarrasCategorias datos={categoriaDistribucion} />
            </Box>
          </Box>

          {/* Bloque compacto: Indicadores y métricas */}
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
              <Assessment fontSize="small" /> Indicadores y métricas
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, minmax(0, 1fr))' }
              }}
            >
              <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#F5F5F5', border: '1px solid #D7CCC8' }}>
                <IndicadorLabel
                  label="Operaciones"
                  tooltip="Cantidad de ventas (operaciones) registradas en el período seleccionado."
                />
                <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold', lineHeight: 1.15 }}>
                  {resumen.operaciones}
                </Typography>
              </Box>

              <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#F5F5F5', border: '1px solid #D7CCC8' }}>
                <IndicadorLabel
                  label="Margen"
                  tooltip="Porcentaje de saldo sobre ingresos: (saldo / ingresos) × 100."
                />
                <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold', lineHeight: 1.15 }}>
                  {indicadores.margen.toFixed(1)}%
                </Typography>
              </Box>

              <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#F5F5F5', border: '1px solid #D7CCC8' }}>
                <IndicadorLabel
                  label="Promedio diario"
                  tooltip="Ingresos promedio por día dentro del período: ingresos / días del período."
                />
                <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold', lineHeight: 1.15 }}>
                  ${indicadores.promedioDiario.toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                </Typography>
              </Box>

              <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#F5F5F5', border: '1px solid #D7CCC8' }}>
                <IndicadorLabel
                  label="Reinversión"
                  tooltip="Porcentaje de egresos sobre ingresos: (egresos / ingresos) × 100."
                />
                <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold', lineHeight: 1.15 }}>
                  {indicadores.reinversion.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Comparativa de serie mensual */}
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
              <Analytics fontSize="small" /> Comparativa del período
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, minmax(0, 1fr))' }
              }}
            >
              <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#F5F5F5', border: '1px solid #D7CCC8' }}>
                <Typography variant="caption" color="text.secondary">Meses analizados</Typography>
                <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold', lineHeight: 1.15 }}>
                  {comparativaSerie.meses}
                </Typography>
              </Box>

              <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#F5F5F5', border: '1px solid #D7CCC8' }}>
                <Typography variant="caption" color="text.secondary">Total ventas</Typography>
                <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold', lineHeight: 1.15 }}>
                  ${(comparativaSerie.totalVentas / 1000).toFixed(0)}k
                </Typography>
              </Box>

              <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#F5F5F5', border: '1px solid #D7CCC8' }}>
                <Typography variant="caption" color="text.secondary">Total compras</Typography>
                <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold', lineHeight: 1.15 }}>
                  ${(comparativaSerie.totalCompras / 1000).toFixed(0)}k
                </Typography>
              </Box>

              <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#F5F5F5', border: '1px solid #D7CCC8' }}>
                <Typography variant="caption" color="text.secondary">Mejor mes ventas</Typography>
                <Typography variant="h6" sx={{ color: '#5D4037', fontWeight: 'bold', lineHeight: 1.15 }}>
                  {comparativaSerie.mejorMesVentas.mes}
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
        titulo={formatearRangoMeses(periodoActivo.inicio, periodoActivo.fin)}
        periodoLabel={rangoLabel}
        onPrev={() => cambiarMes(-1)}
        onReset={restablecerPeriodoActual}
        onNext={() => cambiarMes(1)}
        actions={(
          <>
            <Tooltip title={showFiltros ? 'Ocultar filtros avanzados' : 'Mostrar filtros avanzados'} arrow>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterList fontSize="inherit" />}
                onClick={() => setShowFiltros(!showFiltros)}
              >
                Filtros
              </Button>
            </Tooltip>
            <Tooltip title="Descargar reporte en Excel" arrow>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Download fontSize="inherit" />}
                onClick={descargarReporteExcel}
              >
                Excel
              </Button>
            </Tooltip>
          </>
        )}
        footerOpen={showFiltros}
        footer={(
          <Box className="periodo-toolbar-footer-panel">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: { xs: 'wrap', md: 'nowrap' },
                justifyContent: 'space-between'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap',
                  flex: 1,
                  minWidth: 0
                }}
              >
                <TextField
                  label="Desde"
                  type="date"
                  size="small"
                  value={dateToInputValue(periodo.inicio)}
                  onChange={(e) => setPeriodo({ ...periodo, inicio: parseInputDateToLocalDate(e.target.value) })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: { xs: '100%', sm: 170 } }}
                />
                <TextField
                  label="Hasta"
                  type="date"
                  size="small"
                  value={dateToInputValue(periodo.fin)}
                  onChange={(e) => setPeriodo({ ...periodo, fin: parseInputDateToLocalDate(e.target.value) })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: { xs: '100%', sm: 170 } }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.75 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleLimpiarFiltros}
                  sx={{ borderColor: 'rgba(255,255,255,0.6)', color: '#fff' }}
                >
                  Limpiar
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAplicarFiltros}
                  sx={{ borderColor: 'rgba(255,255,255,0.9)', color: '#fff' }}
                >
                  Aplicar
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      />

      {/* KPIs */}
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

      {/* Tarjeta resumen global */}
      <Box>
        {summaryCard.element}
      </Box>
    </Box>
  );
}

// --- Funciones auxiliares ---

function generarMesesPeriodo(periodo) {
  const meses = [];
  const cursor = new Date(periodo.inicio);
  let contador = 0;

  while (cursor <= periodo.fin && contador < 12) {
    const inicioMes = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const finMes = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
    meses.push({
      label: inicioMes.toLocaleDateString('es-CL', { month: 'short' }),
      inicio: inicioMes.toISOString(),
      fin: finMes.toISOString()
    });
    cursor.setMonth(cursor.getMonth() + 1);
    contador += 1;
  }

  return meses.length ? meses : [{
    label: periodo.inicio.toLocaleDateString('es-CL', { month: 'short' }),
    inicio: periodo.inicio.toISOString(),
    fin: periodo.fin.toISOString()
  }];
}

function construirDistribucionCategorias(ventas) {
  const acumulado = new Map();
  ventas.forEach((venta) => {
    (venta.detalles || []).forEach((detalle) => {
      const categoria = detalle?.producto?.categoria?.nombre || detalle?.producto?.categoria || 'Sin categoría';
      const cantidad = Number(detalle?.cantidad) || 0;
      const precio = Number(detalle?.precioUnitario || detalle?.precio || 0);
      const subtotal = Number(detalle?.subtotal || cantidad * precio) || 0;
      acumulado.set(categoria, (acumulado.get(categoria) || 0) + subtotal);
    });
  });

  const data = Array.from(acumulado.entries()).map(([nombre, monto]) => ({ nombre, monto }));
  return data
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 6)
    .map(item => [{ nombre: item.nombre }, item.monto]);
}

// --- Componentes auxiliares ---

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

function GraficoBalance({ ingresos, egresos, saldo }) {
  const ingresosSeguro = Math.max(Number(ingresos) || 0, 0);
  const egresosSeguro = Math.max(Number(egresos) || 0, 0);
  const total = Math.max(ingresosSeguro + egresosSeguro, 1);
  const pIngresos = (ingresosSeguro / total) * 100;

  const datosTorta = [
    { nombre: 'Ingresos', valor: ingresosSeguro, color: '#4CAF50' },
    { nombre: 'Egresos', valor: egresosSeguro, color: '#FF6B6B' }
  ];

  return (
    <Box sx={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Box sx={{ position: 'relative', height: 140, mb: 2 }}>
        <Box sx={{
          position: 'relative', width: 140, height: 140, margin: '0 auto', borderRadius: '50%',
          background: `conic-gradient(#4CAF50 0% ${pIngresos}%, #FF6B6B ${pIngresos}% 100%)`
        }} />
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          textAlign: 'center', backgroundColor: 'white', borderRadius: '50%', width: 90, height: 90,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: 1
        }}>
          <Typography variant="caption" sx={{ color: '#8D6E63' }}>Saldo</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: saldo >= 0 ? '#4CAF50' : '#FF6B6B' }}>
            ${Math.round(saldo/1000)}k
          </Typography>
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

function GraficoEgresos({ compras, gastos }) {
  const total = compras + gastos || 1;
  const pCompras = (compras / total) * 100;

  const colors = ['#5D4037', '#8D6E63'];
  const datos = [
    { nombre: 'Compras', monto: compras },
    { nombre: 'Gastos', monto: gastos }
  ];

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
            background: `conic-gradient(#5D4037 0% ${pCompras}%, #8D6E63 ${pCompras}% 100%)`
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
        {datos.map((seg, index) => (
          <Box key={seg.nombre} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: colors[index] }} />
            <Typography variant="caption" sx={{ color: '#5D4037' }}>
              {seg.nombre} ({((seg.monto/total)*100).toFixed(0)}%)
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function GraficoTendenciaMensual({ datos }) {
  // Mostrar hasta 6 meses
  const displayData = datos.slice(-6);
  const maxValor = Math.max(...displayData.flatMap(d => [d.ventas, d.compras]), 1);

  // Rellenar hasta 6 filas
  const filledData = [...displayData];
  while (filledData.length < FIXED_ROW_COUNT) {
    filledData.push({ mes: '-', ventas: 0, compras: 0, isEmpty: true });
  }

  return (
    <Box sx={{ width: '100%', height: FIXED_TABLE_HEIGHT, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {filledData.map((item, index) => {
        const porcentajeVentas = item.isEmpty ? 0 : (item.ventas / maxValor) * 100;
        const porcentajeCompras = item.isEmpty ? 0 : (item.compras / maxValor) * 100;
        const mesLabel = item.mes;
        return (
          <Box
            key={index}
            sx={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1fr) minmax(0, 1fr)',
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
                <Tooltip title={`Ventas: $${(item.ventas/1000).toFixed(0)}k`} arrow>
                  <Box sx={{ width: `${porcentajeVentas}%`, height: '100%', background: 'linear-gradient(90deg, #4CAF50, #66BB6A)', borderRadius: 4 }} />
                </Tooltip>
              )}
            </Box>
            <Box sx={{ width: '100%', height: 8, backgroundColor: '#EFEBE9', borderRadius: 4, overflow: 'hidden', justifySelf: 'stretch' }}>
              {!item.isEmpty && (
                <Tooltip title={`Compras: $${(item.compras/1000).toFixed(0)}k`} arrow>
                  <Box sx={{ width: `${porcentajeCompras}%`, height: '100%', background: 'linear-gradient(90deg, #FF6B6B, #FF8A80)', borderRadius: 4 }} />
                </Tooltip>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function GraficoBarrasCategorias({ datos }) {
  const maxCantidad = Math.max(...datos.map(item => item[1] || 0), 1);

  // Rellenar hasta 6 filas
  const filledData = [...datos];
  while (filledData.length < FIXED_ROW_COUNT) {
    filledData.push([{ nombre: '-' }, 0, true]);
  }
  const displayData = filledData.slice(0, FIXED_ROW_COUNT);

  return (
    <Box sx={{ width: '100%', height: FIXED_TABLE_HEIGHT, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {displayData.map((item, index) => {
        const isEmpty = item[2] === true;
        const categoria = item[0];
        const monto = item[1] || 0;
        const porcentaje = isEmpty ? 0 : (maxCantidad > 0 ? (monto / maxCantidad) * 100 : 0);
        const categoriaName = categoria?.nombre || '-';
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
            <Tooltip title={isEmpty ? '' : categoriaName} disableHoverListener={isEmpty} arrow>
              <Typography
                variant="caption"
                sx={{
                  color: isEmpty ? 'transparent' : '#5D4037',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {categoriaName}
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
              {isEmpty ? '-' : `$${(monto/1000).toFixed(0)}k`}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function IndicadorLabel({ label, tooltip }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Tooltip title={tooltip} placement="top" arrow>
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            color: '#8D6E63',
            cursor: 'help',
            lineHeight: 0
          }}
        >
          <InfoOutlined sx={{ fontSize: 16 }} />
        </Box>
      </Tooltip>
    </Box>
  );
}