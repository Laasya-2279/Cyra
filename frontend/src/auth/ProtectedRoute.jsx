import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/* ─────────────────────────────────────────────
   ProtectedRoute
   Wraps any route that requires authentication.
   Redirects to /login if not authenticated,
   preserving the intended destination.
───────────────────────────────────────────── */

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute check:', { isAuthenticated, loading, pathname: location.pathname });

  // While restoring session from localStorage, show nothing (or a splash)
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d0d14',
        color: 'rgba(255,255,255,0.4)',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 14,
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid rgba(255,255,255,0.1)',
          borderTop: '3px solid #c084fc',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span>Restoring your session…</span>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('User authenticated, rendering protected content');
  return children;
}