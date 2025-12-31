// src/pages/Inventario/components/modals/ModalesRecetas.jsx
import React from 'react'
import { Button } from '../../../../components/UI.jsx'
import { Science, Add, Delete } from '@mui/icons-material'

export function ModalVerReceta({ showRecetaModal, setShowRecetaModal, recetaActual, setShowAgregarMaterialModal }) {
  if (!showRecetaModal) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--panel)',
        padding: '2rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '600px',
        border: '2px solid var(--border)',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem' }}>
          Receta: {showRecetaModal.nombre}
        </h3>

        {recetaActual.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--muted)',
            background: 'var(--bg)',
            borderRadius: '8px'
          }}>
            <Science sx={{ fontSize: 48, marginBottom: '1rem', opacity: 0.5 }} />
            <p>Este producto no tiene receta definida</p>
            <Button
              onClick={() => {
                setShowRecetaModal(null)
                setShowAgregarMaterialModal(showRecetaModal)
              }}
              style={{ marginTop: '1rem' }}
            >
              Crear Receta
            </Button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Material</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Cantidad</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Costo</th>
              </tr>
            </thead>
            <tbody>
              {recetaActual.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>
                    {item.material?.nombre || '-'}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {item.cantidad} {item.material?.unidadMedida?.abreviatura || ''}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    ${(item.costoCalculado || 0).toLocaleString('es-CL')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border)', fontWeight: '600' }}>
                <td style={{ padding: '0.75rem' }} colSpan="2">
                  Costo Total
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  ${recetaActual.reduce((sum, item) => sum + (item.costoCalculado || 0), 0).toLocaleString('es-CL')}
                </td>
              </tr>
            </tfoot>
          </table>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          {recetaActual.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                setShowRecetaModal(null)
                setShowAgregarMaterialModal(showRecetaModal)
              }}
            >
              Editar
            </Button>
          )}
          <Button variant="ghost" onClick={() => setShowRecetaModal(null)}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ModalAgregarMaterial({ 
  showAgregarMaterialModal, 
  setShowAgregarMaterialModal, 
  recetaActual,
  materiales,
  formMaterial,
  setFormMaterial,
  handleAgregarMaterial,
  setDeleteConfirmReceta
}) {
  if (!showAgregarMaterialModal) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--panel)',
        padding: '2rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '700px',
        border: '2px solid var(--border)',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem' }}>
          Editar Receta: {showAgregarMaterialModal.nombre}
        </h3>

        {recetaActual.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Materiales Actuales:</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.85rem' }}>Material</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.85rem' }}>Cantidad</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recetaActual.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.5rem', fontSize: '0.9rem' }}>
                      {item.material?.nombre || '-'}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.9rem' }}>
                      {item.cantidad} {item.material?.unidadMedida?.abreviatura || ''}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <Button
                        small
                        variant="ghost"
                        onClick={() => setDeleteConfirmReceta(item)}
                        style={{ background: 'var(--error)', color: 'white' }}
                      >
                        <Delete sx={{ fontSize: 16 }} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{
          background: 'var(--bg)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Agregar Material:</h4>
          <form onSubmit={handleAgregarMaterial}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>
                  Material *
                </label>
                <select
                  value={formMaterial.idMaterial}
                  onChange={(e) => setFormMaterial(prev => ({ ...prev, idMaterial: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '2px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">Seleccione material</option>
                  {materiales.map(mat => (
                    <option key={mat.idMaterial} value={mat.idMaterial}>
                      {mat.nombre} (Stock: {mat.stockActual || 0} {mat.unidadMedida?.abreviatura || ''})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>
                  Cantidad *
                </label>
                <input
                  type="number"
                  value={formMaterial.cantidad}
                  onChange={(e) => setFormMaterial(prev => ({ ...prev, cantidad: e.target.value }))}
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '2px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <Button type="submit" small style={{ background: '#4CAF50' }}>
                <Add sx={{ fontSize: 18 }} />
              </Button>
            </div>
          </form>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button
            variant="ghost"
            onClick={() => {
              setShowAgregarMaterialModal(null)
              setFormMaterial({ idMaterial: '', cantidad: '' })
            }}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ModalCalcularCosto({ showCostoModal, setShowCostoModal, recetaActual, costoCalculado }) {
  if (!showCostoModal) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--panel)',
        padding: '2rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        border: '2px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Science sx={{ color: '#2196F3', fontSize: 28 }} />
          <h3 style={{ margin: 0, fontSize: '1.3rem' }}>
            Costo de Producción
          </h3>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            <strong>{showCostoModal.nombre}</strong>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Precio de venta: ${(showCostoModal.precio || 0).toLocaleString('es-CL')}
          </div>
        </div>

        {recetaActual.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            background: 'var(--bg)',
            borderRadius: '8px',
            color: 'var(--muted)'
          }}>
            Este producto no tiene receta definida
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
              <tbody>
                {recetaActual.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.5rem', fontSize: '0.9rem' }}>
                      {item.material?.nombre}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.9rem', color: 'var(--muted)' }}>
                      {item.cantidad} {item.material?.unidadMedida?.abreviatura}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.9rem' }}>
                      ${(item.costoCalculado || 0).toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{
              background: '#2196F315',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong>Costo Total Materiales:</strong>
                <strong>${(costoCalculado || 0).toLocaleString('es-CL')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--muted)' }}>
                <span>Precio de Venta:</span>
                <span>${(showCostoModal.precio || 0).toLocaleString('es-CL')}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '0.5rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border)',
                fontWeight: '600',
                color: (showCostoModal.precio || 0) - (costoCalculado || 0) > 0 ? '#4CAF50' : '#F44336'
              }}>
                <span>Margen:</span>
                <span>${((showCostoModal.precio || 0) - (costoCalculado || 0)).toLocaleString('es-CL')}</span>
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setShowCostoModal(null)}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ModalConfirmarEliminacion({ deleteConfirmReceta, setDeleteConfirmReceta, handleEliminarMaterial }) {
  if (!deleteConfirmReceta) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1001
    }}>
      <div style={{
        background: 'var(--panel)',
        padding: '2rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '400px',
        textAlign: 'center',
        border: '2px solid var(--border)'
      }}>
        <Delete sx={{ fontSize: 48, color: '#F44336', marginBottom: '1rem' }} />

        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem' }}>
          ¿Eliminar material?
        </h3>

        <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
          {deleteConfirmReceta.material?.nombre} ({deleteConfirmReceta.cantidad} {deleteConfirmReceta.material?.unidadMedida?.abreviatura})
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Button variant="ghost" onClick={() => setDeleteConfirmReceta(null)}>
            Cancelar
          </Button>
          <Button onClick={handleEliminarMaterial} style={{ background: 'var(--error)' }}>
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  )
}