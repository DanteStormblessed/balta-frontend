import React, { useState } from 'react';
import { api } from '../../services/api/index.js';
import { Button } from '../../components/UI.jsx';
import { Login as LoginIcon, Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
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
    margin-top: 0.15rem !important;
    margin-bottom: 0.25rem !important;
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
    padding: 0.4rem 0.8rem !important;
    font-size: 0.85rem !important;
  }
`;
export default function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    correoElectronico: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.correoElectronico || !formData.password) {
        throw new Error('Todos los campos son obligatorios');
      }

      const response = await api.auth.login({
        correoElectronico: formData.correoElectronico,
        password: formData.password
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
      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError(error.message || 'Correo electrónico o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div className="auth-container">
     <style>{styles}</style>
      <div className="auth-background"></div>
      
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <LoginIcon sx={{ fontSize: 48 }} />
            </div>
            <h1 className="auth-title">Marroquinería Balta</h1>
            <p className="auth-subtitle">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="auth-error">
                <span>⚠️ {error}</span>
              </div>
            )}

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

            <Button
              type="submit"
              className="auth-submit"
              disabled={loading}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {loading ? (
                <>
                  <span className="auth-spinner"></span>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LoginIcon sx={{ fontSize: 20 }} />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>

          
        </div>

        
      </div>
    </div>
  );
}
