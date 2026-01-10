import React from 'react';
import { Button } from '../../components/UI.jsx';
import { Add, Delete, Payment, AutoFixHigh } from '@mui/icons-material';
import { Autocomplete, TextField } from '@mui/material';

export default function MetodosPagoVenta({
  metodosPago,
  metodosPagoSeleccionados,
  montoRestante,
  calcularTotal,
  onAgregarMetodoPago,
  onActualizarMetodoPago,
  onEliminarMetodoPago,
  onDistribuirMontos
}) {

  // MEJORA: Auto-completar monto restante en el primer método vacío
  const autoCompletarMontos = () => {
    if (metodosPagoSeleccionados.length === 0 || Math.abs(montoRestante) < 0.01) return;

    const total = calcularTotal();
    const totalAsignado = metodosPagoSeleccionados.reduce((sum, metodo) => 
      sum + (parseFloat(metodo.montoAsignado) || 0), 0
    );
    const restante = total - totalAsignado;

    // Encontrar el primer método con monto 0 o vacío
    const primerMetodoVacioIndex = metodosPagoSeleccionados.findIndex(
      metodo => !metodo.montoAsignado || metodo.montoAsignado == 0
    );

    if (primerMetodoVacioIndex !== -1) {
      onActualizarMetodoPago(primerMetodoVacioIndex, 'montoAsignado', restante.toFixed(2));
    }
  };

  // MEJORA: Si hay solo un método de pago, asignar automáticamente el total
  React.useEffect(() => {
    if (metodosPagoSeleccionados.length === 1) {
      const metodo = metodosPagoSeleccionados[0];
      const total = calcularTotal();
      
      // Solo asignar si el método está seleccionado y no tiene monto asignado
      if (metodo.idMetodoPago && (!metodo.montoAsignado || metodo.montoAsignado == 0)) {
        onActualizarMetodoPago(0, 'montoAsignado', total.toFixed(2));
      }
    }
  }, [metodosPagoSeleccionados.length, calcularTotal]);

  return (
    <div className="field col-12">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1rem',
        padding: '1rem',
        background: 'linear-gradient(135deg, var(--panel), var(--panel-2))',
        borderRadius: '8px',
        border: '1px solid var(--border)'
      }}>
        <label className="field-label" style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Payment sx={{ fontSize: 24 }} />
          Métodos de Pago ({metodosPagoSeleccionados.length})
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Button variant="ghost" small onClick={onAgregarMetodoPago}>
            <Add sx={{ fontSize: 20 }} />
            <span className="hide-on-mobile">Agregar</span>
          </Button>
          {metodosPagoSeleccionados.length > 1 && (
            <>
              <Button variant="ghost" small onClick={onDistribuirMontos}>
                 Distribuir
              </Button>
              <Button variant="ghost" small onClick={autoCompletarMontos}>
                <AutoFixHigh sx={{ fontSize: 20 }} />
                Auto-completar
              </Button>
            </>
          )}
        </div>
      </div>

      {metodosPagoSeleccionados.length === 0 ? (
        <div className="empty-state" style={{
          padding: '3rem',
          textAlign: 'center',
          border: '2px dashed var(--border)',
          borderRadius: '8px',
          color: 'var(--muted)',
          background: 'var(--accent)'
        }}>
          <Payment sx={{ fontSize: 48, color: 'var(--muted)', marginBottom: '1rem' }} />
          <p style={{ margin: 0, fontSize: '1.1rem' }}>No hay métodos de pago agregados</p>
          <small>Haga clic en "Agregar" para comenzar</small>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {metodosPagoSeleccionados.map((metodo, index) => {
            const opcionesMetodos = metodosPago.filter(mp => {
              if (mp.idMetodoPago === parseInt(metodo.idMetodoPago)) return true;
              return !metodosPagoSeleccionados.some((seleccionado, idxSeleccionado) =>
                idxSeleccionado !== index && parseInt(seleccionado.idMetodoPago) === mp.idMetodoPago
              );
            });
            const metodoSeleccionado = opcionesMetodos.find(
              mp => mp.idMetodoPago === parseInt(metodo.idMetodoPago)
            ) || null;

            const INPUT_HEIGHT = '48px';
            const LABEL_HEIGHT = '20px';

            return (
              <div key={index} className="metodo-pago-item" style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr auto',
                gap: '1rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, var(--panel), var(--panel-2))',
                borderRadius: '12px',
                border: '2px solid var(--border)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                alignItems: 'flex-end'
              }}>
                {/* MÉTODO DE PAGO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--muted)', height: LABEL_HEIGHT }}>
                    Método de Pago
                  </label>
                  <Autocomplete
                    options={opcionesMetodos}
                    value={metodoSeleccionado}
                    onChange={(_, nuevoMetodo) =>
                      onActualizarMetodoPago(
                        index,
                        'idMetodoPago',
                        nuevoMetodo ? nuevoMetodo.idMetodoPago.toString() : ''
                      )
                    }
                    isOptionEqualToValue={(option, value) => option.idMetodoPago === value.idMetodoPago}
                    getOptionLabel={(option) => option
                      ? `${option.nombre}${option.comisionAsociada > 0 ? ` (${option.comisionAsociada}% comisión)` : ''}`
                      : ''
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        border: '2px solid var(--border)',
                        background: 'var(--panel)',
                        paddingRight: '0.25rem',
                        height: INPUT_HEIGHT,
                        '&:hover fieldset': { borderColor: 'var(--brand)' },
                        '&.Mui-focused fieldset': {
                          borderColor: 'var(--brand)',
                          boxShadow: '0 0 0 2px rgba(93, 64, 55, 0.12)'
                        }
                      }
                    }}
                    ListboxProps={{ sx: { borderRadius: '8px' } }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Seleccionar método..."
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          sx: {
                            height: INPUT_HEIGHT,
                            '& .MuiInputBase-input': {
                              padding: '12px',
                              fontSize: '1rem'
                            }
                          }
                        }}
                      />
                    )}
                  />
                </div>

                {/* MONTO ASIGNADO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--muted)', height: LABEL_HEIGHT }}>
                    Monto
                  </label>
                  <div style={{ 
                    height: INPUT_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative'
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      color: 'var(--muted)',
                      fontWeight: '600',
                      pointerEvents: 'none'
                    }}>$</span>
                    <input 
                      type="number"
                      value={metodo.montoAsignado}
                      onChange={(e) => onActualizarMetodoPago(index, 'montoAsignado', e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2rem',
                        border: '2px solid var(--border)',
                        borderRadius: '8px',
                        background: 'var(--panel)',
                        fontSize: '1rem',
                        color: 'var(--text)',
                        height: '100%',
                        boxSizing: 'border-box',
                        textAlign: 'right'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--brand)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                </div>

                {/* ELIMINAR */}
                <Button 
                  className="delete-method-btn"
                  variant="ghost" 
                  small 
                  onClick={() => onEliminarMetodoPago(index)}
                  style={{ 
                    minWidth: 'auto', 
                    padding: '0.75rem',
                    background: 'var(--error)',
                    color: 'white',
                    height: INPUT_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Delete sx={{ fontSize: 20 }} />
                </Button>
              </div>
            );
          })}
          
          <div style={{
            padding: '1rem',
            background: Math.abs(montoRestante) < 0.01 ? 
              'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))' : 
              'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 152, 0, 0.05))',
            border: `2px solid ${Math.abs(montoRestante) < 0.01 ? '#4CAF50' : '#FF9800'}`,
            borderRadius: '8px',
            textAlign: 'center',
            fontWeight: '600',
            color: Math.abs(montoRestante) < 0.01 ? '#2E7D32' : '#EF6C00',
            fontSize: '1.1rem'
          }}>
            {Math.abs(montoRestante) < 0.01 ? 
              '✓ Montos balanceados' : 
              `Monto restante: $${Math.abs(montoRestante).toLocaleString('es-CL', { minimumFractionDigits: 2 })}`
            }
          </div>
        </div>
      )}
    </div>
  );
}