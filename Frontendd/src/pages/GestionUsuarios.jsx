import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/UI';
import { Logout, Person, Key, ExpandMore } from '@mui/icons-material';
import { apiFetch } from '../services/api/api.js';

/**
 * Componente de encabezado con información del usuario y botón de logout
 */
export default function Header() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [modalPassword, setModalPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('usuario');
      navigate('/login');
    }
  };

  const handleCambiarPassword = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!passwordActual || !nuevaPassword || !confirmarPassword) {
        throw new Error('Todos los campos son obligatorios');
      }

      if (nuevaPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      if (nuevaPassword !== confirmarPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      // Verificar contraseña actual
      await apiFetch('/auth/login', {
        method: 'POST',
        // apiFetch ya agrega Content-Type y Authorization si existe token
        body: JSON.stringify({
          correoElectronico: usuario.correoElectronico,
          password: passwordActual
        })
      }).catch(() => {
        throw new Error('La contraseña actual es incorrecta');
      });

      // Actualizar contraseña
      await apiFetch(`/usuarios/${usuario.rut}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...usuario,
          password: nuevaPassword
        })
      });

      setSuccess('Contraseña actualizada exitosamente');
      setTimeout(() => {
        setModalPassword(false);
        setPasswordActual('');
        setNuevaPassword('');
        setConfirmarPassword('');
        setSuccess('');
      }, 2000);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
        color: 'white',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.5rem', 
            fontWeight: '700' 
          }}>
            Marroquinería Balta
          </h1>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem' 
        }}>
          {/* Menú de Usuario con Dropdown */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                if (!menuUsuarioAbierto) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }
              }}
            >
              <Person sx={{ fontSize: 20 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ 
                  fontWeight: '600', 
                  fontSize: '0.95rem' 
                }}>
                  {usuario.nombre || 'Usuario'}
                </span>
                <span style={{ 
                  fontSize: '0.8rem', 
                  opacity: 0.9 
                }}>
                  {usuario.rol || 'USUARIO'}
                </span>
              </div>
              <ExpandMore 
                sx={{ 
                  fontSize: 20,
                  transform: menuUsuarioAbierto ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }} 
              />
            </div>

            {/* Dropdown Menu */}
            {menuUsuarioAbierto && (
              <>
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 998
                  }}
                  onClick={() => setMenuUsuarioAbierto(false)}
                />
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  background: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  minWidth: '220px',
                  overflow: 'hidden',
                  zIndex: 999
                }}>
                  <div
                    onClick={() => {
                      setMenuUsuarioAbierto(false);
                      setModalPassword(true);
                      setError('');
                      setSuccess('');
                      setPasswordActual('');
                      setNuevaPassword('');
                      setConfirmarPassword('');
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      color: 'var(--text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--panel)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Key sx={{ fontSize: 20, color: '#f57c00' }} />
                    <span>Cambiar Contraseña</span>
                  </div>

                  <div
                    onClick={handleLogout}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      color: '#d32f2f',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      borderTop: '1px solid var(--border)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#ffebee'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Logout sx={{ fontSize: 20 }} />
                    <span>Cerrar Sesión</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Modal de Cambiar Contraseña */}
      {modalPassword && (
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
          zIndex: 10000,
          padding: '1rem'
        }} onClick={() => {
          setModalPassword(false);
          setError('');
          setSuccess('');
          setPasswordActual('');
          setNuevaPassword('');
          setConfirmarPassword('');
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '100%'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)' }}>
              <Key sx={{ color: '#f57c00' }} /> Cambiar mi Contraseña
            </h3>

            {error && (
              <div style={{
                padding: '0.75rem',
                background: '#f8d7da',
                color: '#721c24',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div style={{
                padding: '0.75rem',
                background: '#d4edda',
                color: '#155724',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                ✓ {success}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text)' }}>
                Contraseña Actual
              </label>
              <input
                type="password"
                value={passwordActual}
                onChange={(e) => {
                  setPasswordActual(e.target.value);
                  setError('');
                }}
                placeholder="Tu contraseña actual"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '1rem'
                }}
                disabled={loading}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text)' }}>
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={nuevaPassword}
                onChange={(e) => {
                  setNuevaPassword(e.target.value);
                  setError('');
                }}
                placeholder="Mínimo 6 caracteres"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '1rem'
                }}
                minLength={6}
                disabled={loading}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text)' }}>
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={confirmarPassword}
                onChange={(e) => {
                  setConfirmarPassword(e.target.value);
                  setError('');
                }}
                placeholder="Repetir nueva contraseña"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '1rem'
                }}
                minLength={6}
                disabled={loading}
              />
            </div>

            {nuevaPassword && confirmarPassword && nuevaPassword === confirmarPassword && (
              <div style={{
                padding: '0.75rem',
                background: '#d4edda',
                color: '#155724',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                ✓ Las contraseñas coinciden
              </div>
            )}

            {nuevaPassword && confirmarPassword && nuevaPassword !== confirmarPassword && (
              <div style={{
                padding: '0.75rem',
                background: '#f8d7da',
                color: '#721c24',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                ✗ Las contraseñas no coinciden
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setModalPassword(false);
                  setError('');
                  setSuccess('');
                  setPasswordActual('');
                  setNuevaPassword('');
                  setConfirmarPassword('');
                }}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: '2px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  fontSize: '1rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCambiarPassword}
                disabled={loading || !passwordActual || !nuevaPassword || !confirmarPassword || nuevaPassword !== confirmarPassword}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: loading || !passwordActual || !nuevaPassword || !confirmarPassword || nuevaPassword !== confirmarPassword ? '#ccc' : 'var(--brand)',
                  color: '#fff',
                  cursor: loading || !passwordActual || !nuevaPassword || !confirmarPassword || nuevaPassword !== confirmarPassword ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  fontSize: '1rem'
                }}
              >
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}