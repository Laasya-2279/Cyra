import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { CycleProvider } from './context/CycleContext';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import { useAuth } from './auth/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Insights from './pages/Insights';
import Journal from './pages/Journal';
import Tips from './pages/Tips';
import Settings from './pages/Settings';
import Signup from './pages/Signup';
import Login from './pages/Login';
import './App.css';

function AppLayout() {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const isAuthPage = location.pathname === '/signup' || location.pathname === '/login';

  // Show loading state while restoring session from localStorage
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
        color: 'rgba(0,0,0,0.4)',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 14,
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid rgba(0,0,0,0.1)',
          borderTop: '3px solid #c05480',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span>Loading…</span>
      </div>
    );
  }

  // If authenticated and on auth page, redirect to dashboard
  if (isAuthenticated && isAuthPage) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app">
      {!isAuthPage && <Navbar />}
      <main className={`main-content ${isAuthPage ? 'main-content--no-nav' : ''}`}>
        <Routes>
          {/* Home - redirect authenticated users to dashboard, others to login */}
          <Route path="/" element={
            isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
          } />

          {/* Public routes */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route path="/insights" element={
            <ProtectedRoute>
              <Insights />
            </ProtectedRoute>
          } />
          <Route path="/journal" element={
            <ProtectedRoute>
              <Journal />
            </ProtectedRoute>
          } />
          <Route path="/tips" element={
            <ProtectedRoute>
              <Tips />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          {/* Catch-all: redirect to login */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CycleProvider>
        <Router>
          <AppLayout />
        </Router>
      </CycleProvider>
    </AuthProvider>
  );
}

export default App;
