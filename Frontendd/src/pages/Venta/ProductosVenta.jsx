import React from 'react';
import { Button } from '../../components/UI.jsx';
import { Add, Delete, ShoppingCart } from '@mui/icons-material';
import { Autocomplete, TextField } from '@mui/material';

export default function ProductosVenta({ 
  productos, 
  productosSeleccionados, 
  onAgregarProducto, 
  onActualizarProducto, 
  onEliminarProducto,
  onIncrementarCantidad,
  onDecrementarCantidad,
  calcularSubtotalProducto,
  calcularTotal 
}) {

  // MEJORA: Filtrar productos disponibles (excluir los ya seleccionados)
  const productosDisponibles = productos.filter(producto => 
    !productosSeleccionados.some(seleccionado => 
      seleccionado.idProducto === producto.idProducto.toString()
    )
  );

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
          <ShoppingCart sx={{ fontSize: 24 }} />
          Productos ({productosSeleccionados.length})
        </label>
        <Button 
          variant="ghost" 
          small 
          onClick={onAgregarProducto}
          disabled={productosDisponibles.length === 0}
        >
          <Add sx={{ fontSize: 20 }} />
          <span className="hide-on-mobile">Agregar Producto</span>
        </Button>
      </div>

      {productosSeleccionados.length === 0 ? (
        <div className="empty-state" style={{
          padding: '3rem',
          textAlign: 'center',
          border: '2px dashed var(--border)',
          borderRadius: '8px',
          color: 'var(--muted)',
          background: 'var(--accent)'
        }}>
          <ShoppingCart sx={{ fontSize: 48, color: 'var(--muted)', marginBottom: '1rem' }} />
          <p style={{ margin: 0, fontSize: '1.1rem' }}>No hay productos agregados</p>
          <small>Haga clic en "Agregar Producto" para comenzar</small>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {productosSeleccionados.map((item, index) => {
            const opcionesProducto = productos.filter(p => {
              if (p.idProducto.toString() === item.idProducto) return true;
              return !productosSeleccionados.some((seleccionado, idxSeleccionado) =>
                idxSeleccionado !== index && seleccionado.idProducto === p.idProducto.toString()
              );
            });
            const productoSeleccionado = opcionesProducto.find(
              p => p.idProducto.toString() === item.idProducto
            ) || null;

            const INPUT_HEIGHT = '48px';
            const LABEL_HEIGHT = '20px';

            return (
              <div key={index} className="producto-venta-item" style={{
                display: 'grid',
                gridTemplateColumns: '2fr 0.8fr 1fr 1fr auto',
                gap: '1rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, var(--panel), var(--panel-2))',
                borderRadius: '12px',
                border: '2px solid var(--border)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                alignItems: 'flex-end'
              }}>
                {/* PRODUCTO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--muted)', height: LABEL_HEIGHT }}>
                    Producto
                  </label>
                  <Autocomplete
                    options={opcionesProducto}
                    value={productoSeleccionado}
                    onChange={(_, nuevoProducto) =>
                      onActualizarProducto(
                        index,
                        'idProducto',
                        nuevoProducto ? nuevoProducto.idProducto.toString() : ''
                      )
                    }
                    isOptionEqualToValue={(option, value) => option.idProducto === value.idProducto}
                    getOptionLabel={(option) => option
                      ? `${option.nombre} - $${Math.round(option.precio || 0).toLocaleString('es-CL')}`
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
                        placeholder="Seleccionar producto..."
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

                {/* CANTIDAD */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--muted)', height: LABEL_HEIGHT }}>
                    Cantidad
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', height: INPUT_HEIGHT }}>
                    <button 
                      className="qty-btn"
                      onClick={() => onDecrementarCantidad(index)}
                      style={{ 
                        width: '40px', 
                        height: '48px',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        border: '2px solid var(--border)',
                        borderRadius: '6px',
                        background: 'var(--panel)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontWeight: '600'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'var(--accent)';
                        e.target.style.borderColor = 'var(--brand)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'var(--panel)';
                        e.target.style.borderColor = 'var(--border)';
                      }}
                    >
                      −
                    </button>
                    <input 
                      type="number"
                      value={item.cantidad}
                      onChange={(e) => onActualizarProducto(index, 'cantidad', parseInt(e.target.value) || 1)}
                      min="1"
                      step="1"
                      style={{
                        width: '80px',
                        textAlign: 'center',
                        padding: '0.4rem',
                        border: '2px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        background: 'var(--panel)',
                        color: 'var(--text)',
                        height: '100%',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button 
                      className="qty-btn"
                      onClick={() => onIncrementarCantidad(index)}
                      style={{ 
                        width: '40px', 
                        height: '48px',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        border: '2px solid var(--border)',
                        borderRadius: '6px',
                        background: 'var(--panel)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontWeight: '600'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'var(--accent)';
                        e.target.style.borderColor = 'var(--brand)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'var(--panel)';
                        e.target.style.borderColor = 'var(--border)';
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* PRECIO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--muted)', height: LABEL_HEIGHT }}>
                    Precio
                  </label>
                  <div style={{ 
                    height: INPUT_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.5rem',
                    background: 'var(--accent)',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    fontWeight: '600', 
                    color: 'var(--brand)' 
                  }}>
                    ${Math.round(item.precioUnitario || 0).toLocaleString('es-CL')}
                  </div>
                </div>

                {/* SUBTOTAL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--muted)', height: LABEL_HEIGHT }}>
                    Subtotal
                  </label>
                  <div style={{ 
                    height: INPUT_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.5rem',
                    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    fontWeight: '600', 
                    color: 'var(--success)' 
                  }}>
                    ${Math.round(calcularSubtotalProducto(item)).toLocaleString('es-CL')}
                  </div>
                </div>

                {/* ELIMINAR */}
                <Button 
                  className="delete-item-btn"
                  variant="ghost" 
                  small 
                  onClick={() => onEliminarProducto(index)}
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
          
          {/* MEJORA: Mensaje cuando no hay más productos disponibles */}
          {productosDisponibles.length === 0 && productosSeleccionados.length > 0 && (
            <div style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
              border: '2px solid #FF9800',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#EF6C00',
              fontWeight: '500',
              fontSize: '0.9rem'
            }}>
               Todos los productos disponibles han sido agregados
            </div>
          )}
          
          <div style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
            border: '2px solid var(--brand)',
            borderRadius: '8px',
            textAlign: 'center',
            fontWeight: '600',
            color: 'white',
            fontSize: '1.1rem'
          }}>
             Total Productos: {productosSeleccionados.length} | 
             Total Venta: ${Math.round(calcularTotal()).toLocaleString('es-CL')}
          </div>
        </div>
      )}
    </div>
  );
}