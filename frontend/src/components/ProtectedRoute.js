import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  if (adminOnly) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
    } catch {
      return <Navigate to="/dashboard" replace />;
    }
  }
  return children;
}

export default ProtectedRoute;
