import React, { useState } from 'react';
import { api } from '../../services/api/index.js';
import { Button } from '../../components/UI.jsx';
import { 
  PersonAdd, 
  Person, 
  Email, 
  Lock, 
  Badge,
  Visibility,
  VisibilityOff,
  ArrowBack
} from '@mui/icons-material';
import './Auth.css';
const styles = `
  .auth-content {
    grid-template-columns: 1fr !important;
    place-items: center !important;
  }
  .auth-card {
    max-width: 500px !important;
    padding: 1.5rem !important;
  }
  .auth-header {
    margin-bottom: 1rem !important;
  }
  .auth-logo {
    margin-top: 0.5rem !important;
  }
  .auth-logo svg {
    width: 36px !important;
    height: 36px !important;
  }
  .auth-title {
    font-size: 1.4rem !important;
    margin: 0.4rem 0 0.2rem 0 !important;
  }
  .auth-subtitle {
    font-size: 0.85rem !important;
    margin-bottom: 0 !important;
  }
  .auth-field {
    margin-bottom: 0rem !important;
  }
  .auth-label {
    margin-bottom: 0rem !important;
    gap: 0.4rem !important;
  }
  .auth-hint {
    margin-top: 0.1rem !important;
    margin-bottom: 0.1rem !important;
    font-size: 0.75rem !important;
  }
  .auth-submit {
    margin-top: 0.75rem !important;
  }
  .auth-footer {
    margin-top: 0.75rem !important;
    padding-top: 0.75rem !important;
  }
  .auth-back-button {
    margin-bottom: 0.25rem !important;
    padding: 0.4rem 0.4rem !important;
    font-size: 0.85rem !important;
  }
`;
export default function Registro({ onRegistroSuccess }) {
  const [formData, setFormData] = useState({
    rut: '',
    nombre: '',
    correoElectronico: '',
    password: '',
    confirmarPassword: '',
    rol: 'USUARIO'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
    setError('');
  };

  const validarRut = (rut) => {
    const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');
    return rutLimpio.length >= 8 && rutLimpio.length <= 9;
  };

  const formatearRut = (rut) => {
    let rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');
    
    if (rutLimpio.length > 9) {
      rutLimpio = rutLimpio.substring(0, 9);
    }
    
    if (rutLimpio.length > 1) {
      const cuerpo = rutLimpio.slice(0, -1);
      const dv = rutLimpio.slice(-1);
      return `${cuerpo}-${dv}`;
    }
    
    return rutLimpio;
  };

  const handleRutChange = (valor) => {
    const rutFormateado = formatearRut(valor);
    handleChange('rut', rutFormateado);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.rut || !formData.nombre || !formData.correoElectronico || 
          !formData.password || !formData.confirmarPassword) {
        throw new Error('Todos los campos son obligatorios');
      }

      if (!validarRut(formData.rut)) {
        throw new Error('El RUT ingresado no es válido');
      }

      if (formData.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      if (formData.password !== formData.confirmarPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      const correoExiste = await api.auth.verificarCorreo(formData.correoElectronico);
      if (correoExiste.existe) {
        throw new Error('El correo electrónico ya está registrado');
      }

      const rutExiste = await api.auth.verificarRut(formData.rut);
      if (rutExiste.existe) {
        throw new Error('El RUT ya está registrado');
      }

      const response = await api.auth.registro({
        rut: formData.rut,
        nombre: formData.nombre,
        correoElectronico: formData.correoElectronico,
        password: formData.password,
        rol: formData.rol
      });

      // Guardar datos del usuario en localStorage
      const userData = {
        rut: response.rut,
        nombre: response.nombre,
        correoElectronico: response.correoElectronico,
        rol: response.rol
      };
      localStorage.setItem('usuario', JSON.stringify(userData));

      // Llamar callback de éxito
      if (onRegistroSuccess) {
        onRegistroSuccess(userData);
      }
    } catch (error) {
      console.error('Error en registro:', error);
      setError(error.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    window.location.hash = '#/login';
  };

  return (
    <div className="auth-container">
    <style>{styles}</style>
      <div className="auth-background"></div>
      
      <div className="auth-content">
        <div className="auth-card registro-card">
          <div className="auth-header">
            <button 
              className="auth-back-button"
              onClick={handleGoToLogin}
              disabled={loading}
            >
              <ArrowBack sx={{ fontSize: 20 }} />
              Volver
            </button>
            
            <div className="auth-logo">
              <PersonAdd sx={{ fontSize: 48 }} />
            </div>
            <h1 className="auth-title">Crear Cuenta</h1>
            <p className="auth-subtitle">Completa el formulario para registrarte</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="auth-error">
                <span>⚠️ {error}</span>
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label">
                <Badge sx={{ fontSize: 20 }} />
                RUT
              </label>
              <input
                type="text"
                value={formData.rut}
                onChange={(e) => handleRutChange(e.target.value)}
                placeholder="12345678-9"
                className="auth-input"
                required
                disabled={loading}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">
                <Person sx={{ fontSize: 20 }} />
                Nombre 
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                placeholder="Juan Pérez González"
                className="auth-input"
                required
                disabled={loading}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">
                <Email sx={{ fontSize: 20 }} />
                Correo electrónico
              </label>
              <input
                type="email"
                value={formData.correoElectronico}
                onChange={(e) => handleChange('correoElectronico', e.target.value)}
                placeholder="ejemplo@correo.com"
                className="auth-input"
                required
                disabled={loading}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">
                <Lock sx={{ fontSize: 20 }} />
                Contraseña
              </label>
              <div className="auth-password-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="••••••••"
                  className="auth-input"
                  required
                  disabled={loading}
                  minLength={6}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">
                <Lock sx={{ fontSize: 20 }} />
                Confirmar contraseña
              </label>
              <div className="auth-password-container">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmarPassword}
                  onChange={(e) => handleChange('confirmarPassword', e.target.value)}
                  placeholder="••••••••"
                  className="auth-input"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="auth-submit"
              disabled={loading}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {loading ? (
                <>
                  <span className="auth-spinner"></span>
                  Registrando...
                </>
              ) : (
                <>
                  <PersonAdd sx={{ fontSize: 20 }} />
                  Crear Cuenta
                </>
              )}
            </Button>
          </form>

          <div className="auth-footer">
            <p>¿Ya tienes cuenta?</p>
            <button
              className="auth-link"
              onClick={handleGoToLogin}
              disabled={loading}
            >
              Inicia sesión aquí
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
