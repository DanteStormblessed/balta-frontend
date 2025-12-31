import React from 'react';
import { Card, Toolbar, Button } from '../../components/UI.jsx';
import { AttachMoney, Add, CalendarToday, Description, Receipt } from '@mui/icons-material';

export default function FormularioVenta({
  formData,
  onFormChange,
  onGuardar,
  onGuardarYNuevo,
  onCancelar,
  calcularTotal,
  metodosPagoSeleccionados,
  metodosPago, 
  children
}) {

  const calcularResumen = () => {
    const bruto = calcularTotal();
    const ivaProductos = bruto - (bruto / 1.19);
    
    // Calcular comisiones totales (base sin IVA)
    const comisionBase = metodosPagoSeleccionados.reduce((total, metodo) => {
      if (metodo.idMetodoPago && metodo.montoAsignado) {
        const metodoPagoComision = metodosPago.find(m => m.idMetodoPago === parseInt(metodo.idMetodoPago));
        if (metodoPagoComision?.comisionAsociada) {
          return total + (metodo.montoAsignado * metodoPagoComision.comisionAsociada / 100);
        }
      }
      return total;
    }, 0);
    
    // Comisión total incluye IVA de la comisión
    const comisionTotal = comisionBase * 1.19;
    
    // Neto = Bruto - IVA de productos - Comisión total (con IVA)
    const neto = bruto - ivaProductos - comisionTotal;

    return {
      bruto: bruto,
      neto: neto,
      iva: ivaProductos,
      comision: comisionTotal
    };
  };

  const resumen = calcularResumen();

  return (
    <Card 
      title="Registrar Nueva Venta" 
      subtitle="Agregue múltiples productos y métodos de pago"
      accent="accent"
    >
      <div className="form-grid">
        {children}
        
        {/* MEJORA: Resumen financiero */}
        <div className="field col-12">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginBottom: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'var(--panel-2)',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }}>
            <Receipt sx={{ fontSize: 22, color: 'var(--brand)' }} />
            <label className="field-label" style={{ margin: 0, fontSize: '1rem' }}>
              Resumen financiero
            </label>
          </div>
          
          <div className="resumen-financiero-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #E8F5E8, #C8E6C9)',
              border: '2px solid #4CAF50',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#2E7D32', marginBottom: '0.5rem' }}>
                Neto
              </div>
              <div style={{ fontWeight: '600', color: '#2E7D32', fontSize: '1.2rem' }}>
                ${Math.round(resumen.neto).toLocaleString('es-CL')}
              </div>
            </div>
            
            <div style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
              border: '2px solid #2196F3',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#1565C0', marginBottom: '0.5rem' }}>
                IVA (19%)
              </div>
              <div style={{ fontWeight: '600', color: '#1565C0', fontSize: '1.2rem' }}>
                ${Math.round(resumen.iva).toLocaleString('es-CL')}
              </div>
            </div>
            
            <div style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
              border: '2px solid #FF9800',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#EF6C00', marginBottom: '0.5rem' }}>
                Comisión + IVA
              </div>
              <div style={{ fontWeight: '600', color: '#EF6C00', fontSize: '1.2rem' }}>
                ${Math.round(resumen.comision).toLocaleString('es-CL')}
              </div>
            </div>
            
            <div style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
              border: '2px solid var(--brand)',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: 'white', marginBottom: '0.5rem' }}>
                Bruto
              </div>
              <div style={{ fontWeight: '600', color: 'white', fontSize: '1.2rem' }}>
                ${Math.round(resumen.bruto).toLocaleString('es-CL')}
              </div>
            </div>
          </div>
        </div>

        <div className="field col-6">
          <label className="field-label">
            <CalendarToday sx={{ fontSize: 20, marginRight: 1 }} />
            Fecha
          </label>
          <input 
            type="date" 
            value={formData.fecha}
            onChange={(e) => onFormChange('fecha', e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid var(--border)',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div className="field col-6">
          <label className="field-label">
            <AttachMoney sx={{ fontSize: 20, marginRight: 1 }} />
            Monto Total
          </label>
          <input 
            type="text" 
            value={`$ ${Math.round(calcularTotal()).toLocaleString('es-CL')}`} 
            disabled 
            style={{
              background: 'linear-gradient(135deg, var(--success), #66BB6A)',
              color: 'white',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}
          />
        </div>

        <div className="field col-12">
          <label className="field-label">
            <Description sx={{ fontSize: 20, marginRight: 1 }} />
            Observaciones (opcional)
          </label>
          <textarea 
            value={formData.observaciones}
            onChange={(e) => onFormChange('observaciones', e.target.value)}
            placeholder="Ingrese notas o comentarios adicionales..."
            rows={2}
            style={{
              width: '100%',
              padding: '0.65rem 0.75rem',
              fontSize: '0.95rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--panel)',
              resize: 'vertical',
              minHeight: '3rem'
            }}
          />
        </div>
      </div>

      <Toolbar className="venta-acciones">
        <Button onClick={onGuardar}>
          <AttachMoney sx={{ fontSize: 20 }} />
          Registrar Venta
        </Button>
        <Button variant="ghost" onClick={onGuardarYNuevo}>
          <Add sx={{ fontSize: 20 }} />
          Guardar y Nuevo
        </Button>
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
      </Toolbar>
    </Card>
  );
}
