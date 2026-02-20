import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/* ─────────────────────────────────────────────
   AuthContext — CycleAura
   Provides: user, token, login, signup, logout,
             updateProfile, loading, authError
───────────────────────────────────────────── */

const AuthContext = createContext(null);

// ── Storage helpers ──────────────────────────────────────────────────
const TOKEN_KEY  = 'ca_auth_token';
const USER_KEY   = 'ca_user';

const storage = {
  saveSession : (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('ca_profile_done');
  },
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser : () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  },
};

// ── Mock token generator (replace with real JWT from backend) ─────────
const generateToken = (email) =>
  btoa(`${email}:${Date.now()}:${Math.random().toString(36).slice(2)}`);

// ── In-memory "database" (replace with real API calls) ────────────────
// Format: { [email]: { passwordHash, profile } }
const mockDB = {};

const hashPassword = async (password) => {
  // In production use bcrypt/argon2 on server.
  // Here we use a simple Web Crypto SHA-256 hash.
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(password + '__ca_salt__')
  );
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
};

// ── API layer (swap out these functions for real fetch() calls) ───────
const api = {
  async register(formData) {
    await new Promise(r => setTimeout(r, 1200)); // simulate latency

    const { email, password, name } = formData;
    if (mockDB[email]) throw new Error('An account with this email already exists.');

    const passwordHash = await hashPassword(password);
    const user = {
      id          : crypto.randomUUID(),
      email,
      name,
      createdAt   : new Date().toISOString(),
      profileDone : false,
      // Cycle data from signup form
      cycleProfile: {
        dob              : formData.dob            || null,
        height           : formData.height         || null,
        heightUnit       : formData.heightUnit      || 'cm',
        weight           : formData.weight         || null,
        weightUnit       : formData.weightUnit      || 'kg',
        cycleLength      : formData.cycleLength     || '28',
        periodDuration   : formData.periodDuration  || '5',
        lastPeriod       : formData.lastPeriod      || null,
        periodRegularity : formData.periodRegularity|| null,
        birthControlType : formData.birthControlType|| null,
        healthConditions : formData.healthConditions|| [],
        previousCycles   : formData.previousCycles || [],
        lifestyle: {
          baseMood              : formData.baseMood              || null,
          sleepHours            : formData.sleepHours            || '7',
          sleepChangeDuringPeriod: formData.sleepChangeDuringPeriod || null,
          skinCondition         : formData.skinCondition         || null,
          skinChangeDuringPeriod: formData.skinChangeDuringPeriod || null,
          energyLevel           : formData.energyLevel           || '5',
          diet                  : formData.diet                  || null,
          mentalHealth          : formData.mentalHealth          || null,
        },
      },
    };

    mockDB[email] = { passwordHash, user };
    const token = generateToken(email);
    return { token, user };
  },

  async login(email, password) {
    await new Promise(r => setTimeout(r, 1000));

    const record = mockDB[email];
    if (!record) throw new Error('No account found with this email address.');

    const hash = await hashPassword(password);
    if (hash !== record.passwordHash) throw new Error('Incorrect password. Please try again.');

    const token = generateToken(email);
    return { token, user: record.user };
  },

  async resetPassword(email) {
    await new Promise(r => setTimeout(r, 900));
    if (!mockDB[email]) throw new Error('No account found with this email address.');
    // In production: send a real reset email via backend
    return { success: true };
  },

  async updateProfile(email, updates) {
    await new Promise(r => setTimeout(r, 600));
    if (!mockDB[email]) throw new Error('User not found.');
    mockDB[email].user = { ...mockDB[email].user, ...updates };
    return { user: mockDB[email].user };
  },
};

// ── Provider ──────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,      setUser    ] = useState(null);
  const [token,     setToken   ] = useState(null);
  const [loading,   setLoading ] = useState(true);   // true on first mount while we restore session
  const [authError, setAuthError] = useState('');

  // Restore session on mount
  useEffect(() => {
    const savedToken = storage.getToken();
    const savedUser  = storage.getUser();
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
      const { user: updated } = await api.updateProfile(user.email, updates);
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