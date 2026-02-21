import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/* ─────────────────────────────────────────────
   AuthContext — CyRa
   Provides: user, token, login, signup, logout,
             updateProfile, loading, authError
───────────────────────────────────────────── */

const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Storage helpers ──────────────────────────────────────────────────
const TOKEN_KEY = 'ca_auth_token';
const USER_KEY = 'ca_user';

const storage = {
  saveSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('ca_profile_done');
  },
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  },
};

// ── Real API layer ───────────────────────────────────────────────────
async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json;
}

const api = {
  async register(formData) {
    const { email, password, name, ...rest } = formData;
    return apiPost('/api/auth/register', {
      email, password, name,
      cycleProfile: {
        dob: rest.dob || null,
        height: rest.height || null,
        heightUnit: rest.heightUnit || 'cm',
        weight: rest.weight || null,
        weightUnit: rest.weightUnit || 'kg',
        cycleLength: rest.cycleLength || '28',
        periodDuration: rest.periodDuration || '5',
        lastPeriod: rest.lastPeriod || null,
        periodRegularity: rest.periodRegularity || null,
        birthControlType: rest.birthControlType || null,
        healthConditions: rest.healthConditions || [],
        previousCycles: rest.previousCycles || [],
        lifestyle: {
          baseMood: rest.baseMood || null,
          sleepHours: rest.sleepHours || '7',
          sleepChangeDuringPeriod: rest.sleepChangeDuringPeriod || null,
          skinCondition: rest.skinCondition || null,
          skinChangeDuringPeriod: rest.skinChangeDuringPeriod || null,
          energyLevel: rest.energyLevel || '5',
          diet: rest.diet || null,
          mentalHealth: rest.mentalHealth || null,
        },
      },
    });
  },

  async login(email, password) {
    return apiPost('/api/auth/login', { email, password });
  },

  async resetPassword(email) {
    return apiPost('/api/auth/reset-password', { email });
  },

  async updateProfile(token, userId, updates) {
    const res = await fetch(`${API}/api/user/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userId, ...updates }),
    });
    return res.json();
  },
};

// ── Provider ──────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Restore session on mount
  useEffect(() => {
    const savedToken = storage.getToken();
    const savedUser = storage.getUser();
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const clearError = useCallback(() => setAuthError(''), []);

  // ── signup ────────────────────────────────────────────────────────
  const signup = useCallback(async (formData) => {
    setAuthError('');
    try {
      const { token: t, user: u } = await api.register(formData);
      storage.saveSession(t, u);
      localStorage.setItem('ca_profile_done', '1');
      setToken(t);
      setUser(u);
      return { success: true, user: u };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // ── login ─────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setAuthError('');
    try {
      const { token: t, user: u } = await api.login(email, password);
      storage.saveSession(t, u);
      setToken(t);
      setUser(u);
      return { success: true, user: u };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // ── logout ────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    storage.clearSession();
    setToken(null);
    setUser(null);
  }, []);

  // ── sendPasswordReset ─────────────────────────────────────────────
  const sendPasswordReset = useCallback(async (email) => {
    setAuthError('');
    try {
      await api.resetPassword(email);
      return { success: true };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // ── updateProfile ─────────────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    if (!user) return { success: false, error: 'Not logged in.' };
    setAuthError('');
    try {
      await api.updateProfile(token, user.user_id, updates);
      const updated = { ...user, ...updates };
      storage.saveSession(token, updated);
      setUser(updated);
      return { success: true, user: updated };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  }, [user, token]);

  const isAuthenticated = !!token && !!user;

  const value = {
    user,
    token,
    loading,
    authError,
    isAuthenticated,
    signup,
    login,
    logout,
    sendPasswordReset,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;