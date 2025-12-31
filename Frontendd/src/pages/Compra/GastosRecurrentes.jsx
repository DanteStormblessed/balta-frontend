import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../components/UI.jsx';
import { 
  Add, 
  Edit, 
  Delete, 
  PlayArrow, 
  Event,
  Repeat,
  Warning,
  CheckCircle,
  AutoMode
} from '@mui/icons-material';

export default function GastosRecurrentes() {
  const [gastosRecurrentes, setGastosRecurrentes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [gastosPendientes, setGastosPendientes] = useState([]);
  const [ejecutando, setEjecutando] = useState(false);
  
  const [formData, setFormData] = useState({
    descripcion: '',
    monto: '',
    frecuencia: 'MENSUAL',
    diaEjecucion: 1,
    metodoPagoId: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    activo: true,
    observaciones: ''
  });

  useEffect(() => {
    cargarGastosRecurrentes();
    verificarGastosPendientes();
    
    // Auto-ejecutar gastos pendientes después de 2 segundos
    const timer = setTimeout(() => {
      ejecutarGastosPendientesAutomaticamente();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const cargarGastosRecurrentes = () => {
    const stored = localStorage.getItem('gastosRecurrentes');
    if (stored) {
      try {
        setGastosRecurrentes(JSON.parse(stored));
      } catch (e) {
        setGastosRecurrentes([]);
      }
    }
  };

  const guardarGastosRecurrentes = (gastos) => {
    localStorage.setItem('gastosRecurrentes', JSON.stringify(gastos));
    setGastosRecurrentes(gastos);
  };

  const calcularProximaEjecucion = (fechaInicio, frecuencia, diaEjecucion, ultimaEjecucion) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    let base = ultimaEjecucion ? new Date(ultimaEjecucion) : new Date(fechaInicio);
    base.setHours(0, 0, 0, 0);
    
    let proxima = new Date(base);

    switch(frecuencia) {
      case 'SEMANAL':
        proxima.setDate(proxima.getDate() + 7);
        break;
      case 'QUINCENAL':
        proxima.setDate(proxima.getDate() + 15);
        break;
      case 'MENSUAL':
        proxima.setMonth(proxima.getMonth() + 1);
        const ultimoDia = new Date(proxima.getFullYear(), proxima.getMonth() + 1, 0).getDate();
        proxima.setDate(Math.min(diaEjecucion, ultimoDia));
        break;
      case 'BIMESTRAL':
        proxima.setMonth(proxima.getMonth() + 2);
        break;
      case 'TRIMESTRAL':
        proxima.setMonth(proxima.getMonth() + 3);
        break;
      case 'SEMESTRAL':
        proxima.setMonth(proxima.getMonth() + 6);
        break;
      case 'ANUAL':
        proxima.setFullYear(proxima.getFullYear() + 1);
        break;
      default:
        proxima.setMonth(proxima.getMonth() + 1);
    }

    // Si la próxima ejecución ya pasó, seguir avanzando
    while (proxima < hoy) {
      switch(frecuencia) {
        case 'SEMANAL':
          proxima.setDate(proxima.getDate() + 7);
          break;
        case 'QUINCENAL':
          proxima.setDate(proxima.getDate() + 15);
          break;
        case 'MENSUAL':
          proxima.setMonth(proxima.getMonth() + 1);
          break;
        case 'BIMESTRAL':
          proxima.setMonth(proxima.getMonth() + 2);
          break;
        case 'TRIMESTRAL':
          proxima.setMonth(proxima.getMonth() + 3);
          break;
        case 'SEMESTRAL':
          proxima.setMonth(proxima.getMonth() + 6);
          break;
        case 'ANUAL':
          proxima.setFullYear(proxima.getFullYear() + 1);
          break;
      }
    }

    return proxima.toISOString().split('T')[0];
  };

  const verificarGastosPendientes = () => {
    const stored = localStorage.getItem('gastosRecurrentes');
    if (!stored) return;

    const gastos = JSON.parse(stored);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const pendientes = gastos.filter(g => {
      if (!g.activo) return false;
      
      const proxima = new Date(g.proximaEjecucion);
      proxima.setHours(0, 0, 0, 0);
      
      return proxima <= hoy;
    });

    setGastosPendientes(pendientes);
  };

  // ⭐ FUNCIÓN CLAVE: Auto-ejecutar gastos pendientes
  const ejecutarGastosPendientesAutomaticamente = async () => {
    const stored = localStorage.getItem('gastosRecurrentes');
    if (!stored) return;

    const gastos = JSON.parse(stored);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const pendientes = gastos.filter(g => {
      if (!g.activo) return false;
      const proxima = new Date(g.proximaEjecucion);
      proxima.setHours(0, 0, 0, 0);
      return proxima <= hoy;
    });

    if (pendientes.length === 0) return;

    // Verificar si ya se preguntó hoy
    const ultimaPregunta = localStorage.getItem('ultimaPreguntaGastosRecurrentes');
    const hoyStr = hoy.toISOString().split('T')[0];
    
    if (ultimaPregunta === hoyStr) {
      // Ya se preguntó hoy, no volver a preguntar
      return;
    }

    // Preguntar al usuario
    const nombres = pendientes.map(g => `• ${g.descripcion} - $${Math.round(g.monto).toLocaleString('es-CL')}`).join('\n');
    
    const confirmar = window.confirm(
      `🔔 Gastos Recurrentes Pendientes (${pendientes.length}):\n\n` +
      `${nombres}\n\n` +
      `¿Deseas registrarlos automáticamente ahora?`
    );

    // Guardar que ya se preguntó hoy
    localStorage.setItem('ultimaPreguntaGastosRecurrentes', hoyStr);

    if (!confirmar) return;

    // Ejecutar
    await ejecutarMultiplesGastos(pendientes);
  };

  // Ejecutar múltiples gastos
  const ejecutarMultiplesGastos = async (gastosAEjecutar) => {
    setEjecutando(true);
    let registrados = 0;
    let errores = 0;
    const erroresDetalle = [];

    for (const gasto of gastosAEjecutar) {
      try {
        await ejecutarGastoEnAPI(gasto);
        marcarComoEjecutado(gasto.id);
        registrados++;
      } catch (error) {
        console.error('Error al registrar gasto:', error);
        errores++;
        erroresDetalle.push(`${gasto.descripcion}: ${error.message}`);
      }
    }

    setEjecutando(false);

    if (registrados > 0) {
      alert(
        `✅ Gastos registrados automáticamente: ${registrados}\n` +
        (errores > 0 ? `\n❌ Errores: ${errores}\n${erroresDetalle.join('\n')}` : '')
      );
    }

    verificarGastosPendientes();
  };

  // Ejecutar un gasto en la API
  const ejecutarGastoEnAPI = async (gasto) => {
    const response = await fetch('http://localhost:8080/api/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fecha: new Date().toISOString(),
        monto: parseFloat(gasto.monto),
        metodoPago: { idMetodoPago: parseInt(gasto.metodoPagoId) },
        descripcion: `${gasto.descripcion} (Recurrente)`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al registrar');
    }

    return await response.json();
  };

  const marcarComoEjecutado = (id) => {
    const hoy = new Date().toISOString().split('T')[0];
    const nuevosGastos = gastosRecurrentes.map(g => {
      if (g.id === id) {
        const proximaEjecucion = calcularProximaEjecucion(
          g.fechaInicio,
          g.frecuencia,
          g.diaEjecucion,
          hoy
        );
        return {
          ...g,
          ultimaEjecucion: hoy,
          proximaEjecucion
        };
      }
      return g;
    });
    guardarGastosRecurrentes(nuevosGastos);
  };

  const irARegistrarGasto = (gasto) => {
    const preloadData = {
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      metodoPagoId: gasto.metodoPagoId,
      observaciones: gasto.observaciones || ''
    };
    localStorage.setItem('preloadGasto', JSON.stringify(preloadData));
    window.location.hash = '#/egresos';
  };

  const ejecutarGastoManualmente = async (gasto) => {
    if (!window.confirm(`¿Registrar este gasto ahora?\n\n${gasto.descripcion}\n$${Math.round(gasto.monto).toLocaleString('es-CL')}`)) {
      return;
    }

    setEjecutando(true);
    try {
      await ejecutarGastoEnAPI(gasto);
      marcarComoEjecutado(gasto.id);
      alert('✅ Gasto registrado exitosamente');
      verificarGastosPendientes();
    } catch (error) {
      alert('❌ Error al registrar: ' + error.message);
    } finally {
      setEjecutando(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.metodoPagoId) {
      alert('⚠️ Selecciona un método de pago');
      return;
    }

    const proximaEjecucion = calcularProximaEjecucion(
      formData.fechaInicio, 
      formData.frecuencia, 
      formData.diaEjecucion,
      null
    );

    const nuevoGasto = {
      id: editando ? editando.id : Date.now(),
      ...formData,
      monto: parseFloat(formData.monto),
      diaEjecucion: parseInt(formData.diaEjecucion),
      metodoPagoId: parseInt(formData.metodoPagoId),
      proximaEjecucion,
      ultimaEjecucion: null,
      fechaCreacion: editando ? editando.fechaCreacion : new Date().toISOString()
    };

    let nuevosGastos;
    if (editando) {
      nuevosGastos = gastosRecurrentes.map(g => g.id === editando.id ? nuevoGasto : g);
    } else {
      nuevosGastos = [...gastosRecurrentes, nuevoGasto];
    }

    guardarGastosRecurrentes(nuevosGastos);
    resetForm();
    setShowModal(false);
    verificarGastosPendientes();
  };

  const handleEditar = (gasto) => {
    setEditando(gasto);
    setFormData({
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      frecuencia: gasto.frecuencia,
      diaEjecucion: gasto.diaEjecucion,
      metodoPagoId: gasto.metodoPagoId,
      fechaInicio: gasto.fechaInicio,
      activo: gasto.activo,
      observaciones: gasto.observaciones || ''
    });
    setShowModal(true);
  };

  const handleEliminar = (id) => {
    if (!window.confirm('¿Eliminar este gasto recurrente?')) return;
    
    const nuevosGastos = gastosRecurrentes.filter(g => g.id !== id);
    guardarGastosRecurrentes(nuevosGastos);
    verificarGastosPendientes();
  };

  const handleToggleActivo = (id) => {
    const nuevosGastos = gastosRecurrentes.map(g => 
      g.id === id ? { ...g, activo: !g.activo } : g
    );
    guardarGastosRecurrentes(nuevosGastos);
    verificarGastosPendientes();
  };

  const resetForm = () => {
    setFormData({
      descripcion: '',
      monto: '',
      frecuencia: 'MENSUAL',
      diaEjecucion: 1,
      metodoPagoId: '',
      fechaInicio: new Date().toISOString().split('T')[0],
      activo: true,
      observaciones: ''
    });
    setEditando(null);
  };

  const getFrecuenciaLabel = (frecuencia) => {
    const labels = {
      SEMANAL: 'Semanal',
      QUINCENAL: 'Quincenal',
      MENSUAL: 'Mensual',
      BIMESTRAL: 'Bimestral',
      TRIMESTRAL: 'Trimestral',
      SEMESTRAL: 'Semestral',
      ANUAL: 'Anual'
    };
    return labels[frecuencia] || frecuencia;
  };

  const getDiasRestantes = (proximaEjecucion) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const proxima = new Date(proximaEjecucion);
    proxima.setHours(0, 0, 0, 0);
    
    const diff = Math.ceil((proxima - hoy) / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return '¡Vencido!';
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Mañana';
    return `En ${diff} días`;
  };

  return (
    <div style={{ padding: '1rem' }}>
      {/* BANNER DE EJECUCIÓN */}
      {ejecutando && (
        <Card style={{ 
          marginBottom: '1rem', 
          border: '2px solid #2196f3',
          background: '#e3f2fd',
          textAlign: 'center',
          padding: '1rem'
        }}>
          <AutoMode style={{ fontSize: 32, color: '#1976d2', animation: 'spin 1s linear infinite' }} />
          <p style={{ margin: '0.5rem 0 0 0', fontWeight: 600, color: '#1565c0' }}>
            Registrando gastos automáticamente...
          </p>
        </Card>
      )}

      {/* ALERTAS DE GASTOS PENDIENTES */}
      {gastosPendientes.length > 0 && (
        <Card style={{ 
          marginBottom: '1rem', 
          border: '2px solid #ff9800',
          background: '#fff3e0'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <Warning style={{ color: '#f57c00', fontSize: 32 }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, color: '#e65100' }}>
                Gastos Pendientes ({gastosPendientes.length})
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#ef6c00', fontSize: '0.9rem' }}>
                Puedes registrarlos manualmente o esperar a que se registren automáticamente
              </p>
            </div>
            <Button
              onClick={() => ejecutarMultiplesGastos(gastosPendientes)}
              disabled={ejecutando}
              style={{ background: '#4caf50', color: 'white' }}
            >
              <AutoMode sx={{ fontSize: 18 }} />
              Registrar Todos Ahora
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {gastosPendientes.map(gasto => (
              <div key={gasto.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #ffb74d'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#3E2723' }}>
                    {gasto.descripcion}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#5D4037', marginTop: '0.25rem' }}>
                    ${Math.round(gasto.monto).toLocaleString('es-CL')} • {getFrecuenciaLabel(gasto.frecuencia)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button 
                    small
                    onClick={() => ejecutarGastoManualmente(gasto)}
                    disabled={ejecutando}
                    style={{ background: '#4caf50', color: 'white' }}
                  >
                    <AutoMode sx={{ fontSize: 18 }} />
                    Registrar
                  </Button>
                  <Button 
                    small
                    variant="ghost"
                    onClick={() => marcarComoEjecutado(gasto.id)}
                    disabled={ejecutando}
                  >
                    <CheckCircle sx={{ fontSize: 18 }} />
                    Ya lo Hice
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem' 
      }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Repeat /> Gastos Recurrentes
          </h2>
          <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
            Los gastos se registran automáticamente en tu base de datos
          </p>
        </div>
        <Button onClick={() => {
          resetForm();
          setShowModal(true);
        }}>
          <Add sx={{ fontSize: 20 }} />
          Nuevo Gasto Recurrente
        </Button>
      </div>

      <Card>
        {gastosRecurrentes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <Repeat style={{ fontSize: 48, opacity: 0.3, marginBottom: '1rem' }} />
            <p>No hay gastos recurrentes configurados</p>
            <p style={{ fontSize: '0.9rem' }}>
              Configura gastos periódicos como luz, agua, arriendo, etc.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>
                    Estado
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>
                    Descripción
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>
                    Monto
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>
                    Frecuencia
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>
                    Próxima Fecha
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' }}>
                    Última Ejecución
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {gastosRecurrentes.map(gasto => {
                  const diasRestantes = getDiasRestantes(gasto.proximaEjecucion);
                  const esUrgente = diasRestantes === 'Hoy' || diasRestantes === '¡Vencido!' || diasRestantes === 'Mañana';
                  
                  return (
                    <tr key={gasto.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          onClick={() => handleToggleActivo(gasto.id)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: gasto.activo ? '#d4edda' : '#f8d7da',
                            color: gasto.activo ? '#155724' : '#721c24'
                          }}
                        >
                          {gasto.activo ? '✓ Activo' : '✕ Inactivo'}
                        </button>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>
                        <div style={{ fontWeight: 600 }}>{gasto.descripcion}</div>
                        {gasto.observaciones && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                            {gasto.observaciones}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>
                        ${Math.round(gasto.monto).toLocaleString('es-CL')}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Repeat sx={{ fontSize: 16, color: 'var(--brand)' }} />
                          {getFrecuenciaLabel(gasto.frecuencia)}
                        </div>
                        {gasto.frecuencia === 'MENSUAL' && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                            Día {gasto.diaEjecucion}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Event sx={{ fontSize: 16, color: esUrgente ? '#f57c00' : 'var(--muted)' }} />
                          {new Date(gasto.proximaEjecucion).toLocaleDateString('es-CL')}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: esUrgente ? '#f57c00' : 'var(--muted)', 
                          marginTop: '0.25rem',
                          fontWeight: esUrgente ? 600 : 400
                        }}>
                          {diasRestantes}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                        {gasto.ultimaEjecucion ? (
                          <>
                            <CheckCircle sx={{ fontSize: 14, color: '#4caf50', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                            {new Date(gasto.ultimaEjecucion).toLocaleDateString('es-CL')}
                          </>
                        ) : (
                          'Nunca'
                        )}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <Button 
                            small 
                            variant="ghost"
                            onClick={() => ejecutarGastoManualmente(gasto)}
                            title="Ejecutar ahora"
                            disabled={ejecutando}
                          >
                            <PlayArrow sx={{ fontSize: 18 }} />
                          </Button>
                          <Button 
                            small 
                            variant="ghost"
                            onClick={() => handleEditar(gasto)}
                            title="Editar"
                          >
                            <Edit sx={{ fontSize: 18 }} />
                          </Button>
                          <Button 
                            small 
                            variant="ghost"
                            onClick={() => handleEliminar(gasto.id)}
                            style={{ color: '#d32f2f' }}
                            title="Eliminar"
                          >
                            <Delete sx={{ fontSize: 18 }} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* MODAL CREAR/EDITAR */}
      {showModal && (
        <ModalFormulario
          formData={formData}
          setFormData={setFormData}
          editando={editando}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowModal(false);
            resetForm();
          }}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Componente Modal separado para mantener el código limpio
function ModalFormulario({ formData, setFormData, editando, onSubmit, onCancel }) {
  const [metodosPago, setMetodosPago] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarMetodosPago();
  }, []);

  const cargarMetodosPago = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/metodos-pago');
    const data = await response.json();
    
    // ⭐ AGREGAR ESTO PARA VER LA ESTRUCTURA
    console.log('Estructura del primer método:', data[0]);
    console.log('Todos los métodos:', JSON.stringify(data, null, 2));
    
    setMetodosPago(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Error:', error);
    setMetodosPago([]);
  } finally {
    setLoading(false);
  }
};
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
      overflowY: 'auto'
    }} onClick={onCancel}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        margin: 'auto'
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>
          {editando ? 'Editar' : 'Nuevo'} Gasto Recurrente
        </h3>

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              Descripción *
            </label>
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Ej: Pago mensual de luz"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '1rem'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              Monto *
            </label>
            <input
              type="number"
              value={formData.monto}
              onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              placeholder="45000"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '1rem'
              }}
              required
              min="0"
              step="1"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              Método de Pago *
            </label>
            {loading ? (
              <div style={{
                padding: '0.75rem',
                textAlign: 'center',
                color: 'var(--muted)',
                border: '1px solid var(--border)',
                borderRadius: '8px'
              }}>
                Cargando métodos de pago...
              </div>
            ) : metodosPago.length === 0 ? (
              <div style={{
                padding: '0.75rem',
                textAlign: 'center',
                color: '#d32f2f',
                border: '1px solid #d32f2f',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}>
                ⚠️ No hay métodos de pago disponibles. Créalos primero en Configuración.
              </div>
            ) : (
              <select
                value={formData.metodoPagoId}
                onChange={(e) => setFormData({ ...formData, metodoPagoId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '1rem'
                }}
                required
              >
                <option value="">Seleccionar...</option>
                {metodosPago.map(metodo => (
                  <option key={metodo.idMetodoPago} value={metodo.idMetodoPago}>
                    {metodo.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              Frecuencia *
            </label>
            <select
              value={formData.frecuencia}
              onChange={(e) => setFormData({ ...formData, frecuencia: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '1rem'
              }}
              required
            >
              <option value="SEMANAL">Semanal</option>
              <option value="QUINCENAL">Quincenal</option>
              <option value="MENSUAL">Mensual</option>
              <option value="BIMESTRAL">Bimestral (cada 2 meses)</option>
              <option value="TRIMESTRAL">Trimestral (cada 3 meses)</option>
              <option value="SEMESTRAL">Semestral (cada 6 meses)</option>
              <option value="ANUAL">Anual</option>
            </select>
          </div>

          {formData.frecuencia === 'MENSUAL' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                Día del mes (1-31)
              </label>
              <input
                type="number"
                value={formData.diaEjecucion}
                onChange={(e) => setFormData({ ...formData, diaEjecucion: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '1rem'
                }}
                min="1"
                max="31"
                required
              />
              <small style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                Si el mes no tiene ese día (ej: día 31 en febrero), se usará el último día del mes.
              </small>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              Fecha de inicio *
            </label>
            <input
              type="date"
              value={formData.fechaInicio}
              onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '1rem'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Notas adicionales..."
              rows={2}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ 
            padding: '1rem',
            background: '#e8f5e9',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: '#2e7d32'
          }}>
            <AutoMode sx={{ fontSize: 18, verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Este gasto se registrará automáticamente en tu base de datos cuando llegue la fecha.
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={loading || metodosPago.length === 0}
            >
              {editando ? 'Guardar Cambios' : 'Crear Gasto Recurrente'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}