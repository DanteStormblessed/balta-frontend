import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Componente para proteger rutas que requieren autenticación
 * Redirige al login si el usuario no está autenticado
 */
export default function ProtectedRoute({ children }) {
  const usuario = localStorage.getItem('usuario');
  const estaAutenticado = usuario !== null;

  if (!estaAutenticado) {
    // Redirigir al login si no está autenticado
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderizar el componente hijo
  return children;
}
