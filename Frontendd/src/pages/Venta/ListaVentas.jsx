import React, { useMemo, useState, useCallback } from 'react';
import { Card, Table, Button } from '../../components/UI.jsx';
import { ArrowUpward, ArrowDownward, SwapVert } from '@mui/icons-material';

export default function ListaVentas({ 
  ventas, 
  formatearFecha, 
  onVerObservaciones, 
  onVerDetalles 
}) {
  const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'desc' });

  const obtenerMetodosPagoVenta = useCallback((venta) => {
    if (venta.metodosPago && venta.metodosPago.length > 0) {
      return venta.metodosPago.map(mp => 
        `${mp.metodoPago?.nombre}: $${Math.round(mp.montoAsignado || 0).toLocaleString('es-CL')}`
      ).join(', ');
    }
    return 'Sin métodos de pago';
  }, []);

  const obtenerProductosVenta = useCallback((venta) => {
    if (venta.detalles && venta.detalles.length > 0) {
      if (venta.detalles.length === 1) {
        const detalle = venta.detalles[0];
        return (
          <div style={{ fontWeight: '600', color: 'var(--text)', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
            {detalle.producto?.nombre} ({detalle.cantidad})
          </div>
        );
      } else {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', minWidth: 0, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
            <span>{venta.detalles.length} productos</span>
            <Button 
              variant="ghost" 
              small 
              onClick={() => onVerDetalles(venta.detalles)}
              style={{ padding: '0.25rem 0.5rem' }}
            >
              📋 Ver
            </Button>
          </div>
        );
      }
    }
    return <span style={{ color: 'var(--muted)' }}>Sin productos</span>;
  }, [onVerDetalles]);

  const handleSort = useCallback((columnKey) => {
    setSortConfig((prev) => {
      if (prev.key === columnKey) {
        return { key: columnKey, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key: columnKey, direction: columnKey === 'fecha' ? 'desc' : 'asc' };
    });
  }, []);

  const SortHeaderButton = ({ label, columnKey }) => {
    const isActive = sortConfig.key === columnKey;
    const IconComponent = !isActive
      ? SwapVert
      : sortConfig.direction === 'asc'
        ? ArrowUpward
        : ArrowDownward;

    return (
      <button
        type="button"
        onClick={() => handleSort(columnKey)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          font: 'inherit',
          cursor: 'pointer',
          padding: 0
        }}
      >
        <span>{label}</span>
        <IconComponent sx={{ fontSize: 16 }} />
      </button>
    );
  };

  const recentVentas = useMemo(() => ventas.slice(-10), [ventas]);

  const processedRows = useMemo(() => recentVentas.map((venta) => {
    const fecha = venta.fecha ? new Date(venta.fecha) : null;
    const fechaValor = fecha ? fecha.getTime() : 0;

    return {
      sortValues: {
        fecha: fechaValor,
        neto: venta.montoNeto || 0,
        iva: venta.ivaTotal || 0,
        comision: venta.comisionTotal || 0,
        bruto: venta.montoBruto || 0
      },
      cells: [
        formatearFecha(venta.fecha),
        obtenerProductosVenta(venta),
        <div key={`${venta.idVenta}-neto`} style={{ textAlign: 'right', color: 'var(--text)' }}>
          ${Math.round(venta.montoNeto || 0).toLocaleString('es-CL')}
        </div>,
        <div key={`${venta.idVenta}-iva`} style={{ textAlign: 'right', color: 'var(--muted)' }}>
          ${Math.round(venta.ivaTotal || 0).toLocaleString('es-CL')}
        </div>,
        <div key={`${venta.idVenta}-comision`} style={{ textAlign: 'right', color: 'var(--muted)' }}>
          ${Math.round(venta.comisionTotal || 0).toLocaleString('es-CL')}
        </div>,
        <div key={`${venta.idVenta}-bruto`} style={{ 
          textAlign: 'right', 
          color: 'var(--brand)', 
          fontWeight: '600',
          fontSize: '1.05rem'
        }}>
          ${Math.round(venta.montoBruto || 0).toLocaleString('es-CL')}
        </div>,
        <div key={`${venta.idVenta}-metodos`} style={{ 
          color: 'var(--text)',
          fontSize: '0.9rem',
          lineHeight: '1.2',
          whiteSpace: 'normal',
          overflowWrap: 'anywhere'
        }}>
          {obtenerMetodosPagoVenta(venta)}
        </div>,
        venta.observaciones && venta.observaciones.trim() !== '' ? (
          <Button 
            key={`${venta.idVenta}-observaciones`}
            variant="ghost" 
            small 
            onClick={() => onVerObservaciones(venta.observaciones)}
            style={{ padding: '0.25rem 0.75rem', whiteSpace: 'nowrap' }}
          >
            📝 Ver
          </Button>
        ) : <span key={`${venta.idVenta}-sin-observ`} style={{ color: 'var(--muted)', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>—</span>
      ]
    };
  }), [recentVentas, formatearFecha, obtenerProductosVenta, obtenerMetodosPagoVenta, onVerObservaciones]);

  const sortedRows = useMemo(() => {
    const rows = [...processedRows];
    rows.sort((a, b) => {
      const valueA = a.sortValues[sortConfig.key];
      const valueB = b.sortValues[sortConfig.key];

      if (typeof valueA === 'string' || typeof valueB === 'string') {
        const textA = (valueA ?? '').toString();
        const textB = (valueB ?? '').toString();
        return sortConfig.direction === 'asc'
          ? textA.localeCompare(textB)
          : textB.localeCompare(textA);
      }

      const numberA = Number(valueA ?? 0);
      const numberB = Number(valueB ?? 0);
      return sortConfig.direction === 'asc'
        ? numberA - numberB
        : numberB - numberA;
    });
    return rows.map(row => row.cells);
  }, [processedRows, sortConfig]);

  return (
    <Card 
      title="Ventas Recientes" 
      subtitle="Últimas ventas registradas en el sistema"
      className="ventas-recientes-card"
    >
      <Table 
        className="mentas-recientes ventas-recientes"
        columns={[
          <SortHeaderButton key="fecha" label="Fecha" columnKey="fecha" />, 
          "Productos", 
          <SortHeaderButton key="neto" label="Neto" columnKey="neto" />, 
          <SortHeaderButton key="iva" label="IVA" columnKey="iva" />, 
          <SortHeaderButton key="comision" label="Comisión" columnKey="comision" />, 
          <SortHeaderButton key="bruto" label="Bruto" columnKey="bruto" />, 
          "Métodos de Pago", 
          "Observaciones"
        ]} 
        rows={sortedRows}
      />
    </Card>
  );
}
