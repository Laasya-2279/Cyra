import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, sendPasswordReset, authError, clearError } = useAuth(); // ← NEW

  // After login, go to the page the user originally tried to visit, else '/'
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!email.includes('@')) e.email = 'Enter a valid email address';
    if (password.length < 1) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateForgot = () => {
    const e = {};
    if (!email.includes('@')) e.email = 'Enter a valid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Handlers ── */
  const handleLogin = async () => {
    if (!validate()) return;
    clearError();
    setLoading(true);

    const result = await login(email, password);   // ← uses AuthContext

    setLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    }
    // authError is set automatically inside AuthContext on failure
  };

  const handleForgot = async () => {
    if (!validateForgot()) return;
    clearError();
    setLoading(true);

    const result = await sendPasswordReset(email); // ← uses AuthContext

    setLoading(false);
    if (result.success) setResetSent(true);
  };

  const setField = (setter, key) => (e) => {
    setter(e.target.value);
    setErrors(prev => ({ ...prev, [key]: '' }));
    clearError();
  };

  /* ── Phase card (demo data — replace with real user cycle state) ── */
  const cycleDay = 18;
  const phaseInfo = cycleDay <= 5 ? { phase: 'Menstrual', emoji: '🌸', cls: 'menstrual', msg: 'Rest & restore today.' }
    : cycleDay <= 13 ? { phase: 'Follicular', emoji: '🌱', cls: 'follicular', msg: 'Energy is rising — seize it.' }
      : cycleDay === 14 ? { phase: 'Ovulatory', emoji: '🌟', cls: 'ovulatory', msg: "Peak day. You're glowing." }
        : { phase: 'Luteal', emoji: '🌙', cls: 'luteal', msg: 'Turn inward. Honour your rest.' };

  return (
    <div className="login-page">
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />

      <div className="particles" aria-hidden="true">
        {['🌸', '✨', '🌙', '💧', '🌿', '⭐'].map((sym, i) => (
          <span key={i} className="particle"
            style={{ left: `${6 + i * 15}%`, animationDelay: `${i * 0.7}s`, animationDuration: `${4 + i * 0.5}s` }}>
            {sym}
          </span>
        ))}
      </div>

      <div className="login-wrapper">

        {/* ── LEFT: Branding panel ── */}
        <div className="login-brand">
          <div className="brand-inner">
            <div className="brand-logo">
              <span className="brand-mark">CA</span>
              <span className="brand-name">CyRa</span>
            </div>

            <div className={`phase-card phase-card--${phaseInfo.cls}`}>
              <div className="phase-card-top">
                <span className="phase-card-emoji">{phaseInfo.emoji}</span>
                <div>
                  <p className="phase-card-label">Today's Phase</p>
                  <p className="phase-card-name">{phaseInfo.phase}</p>
                </div>
                <div className="phase-card-day">
                  <span className="phase-day-num">{cycleDay}</span>
                  <span className="phase-day-label">Day</span>
                </div>
              </div>
              <p className="phase-card-msg">"{phaseInfo.msg}"</p>
            </div>

            <h1 className="brand-headline">Welcome<br /><em className="brand-headline-em">back.</em></h1>
            <p className="brand-tagline">Your body has been keeping rhythm.<br />Let's pick up where you left off.</p>

            <div className="cycle-ring-wrap">
              <svg viewBox="0 0 160 160" className="cycle-ring">
                <circle cx="80" cy="80" r="64" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
                <circle cx="80" cy="80" r="64" fill="none" stroke="#e53e3e" strokeWidth="12" strokeDasharray="72 330" strokeDashoffset="72" strokeLinecap="round" opacity="0.8" />
                <circle cx="80" cy="80" r="64" fill="none" stroke="#d69e2e" strokeWidth="12" strokeDasharray="115 330" strokeDashoffset="0" strokeLinecap="round" opacity="0.8" />
                <circle cx="80" cy="80" r="64" fill="none" stroke="#38a169" strokeWidth="12" strokeDasharray="14 330" strokeDashoffset="-115" strokeLinecap="round" opacity="0.8" />
                <circle cx="80" cy="80" r="64" fill="none" stroke="#3182ce" strokeWidth="12" strokeDasharray="200 330" strokeDashoffset="-129" strokeLinecap="round" opacity="0.8" />
                <g transform={`rotate(${(cycleDay / 28) * 360 - 90}, 80, 80)`}>
                  <line x1="80" y1="80" x2="80" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="80" cy="80" r="4" fill="white" />
                </g>
                <text x="80" y="75" textAnchor="middle" fill="white" fontSize="18" fontWeight="800">{cycleDay}</text>
                <text x="80" y="91" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontWeight="600">CYCLE DAY</text>
              </svg>
            </div>

            <div className="brand-stats">
              {[['89.6%', 'ML Accuracy'], ['3', 'Sensors'], ['28d', 'Avg. Cycle']].map(([val, lbl]) => (
                <div key={lbl} className="brand-stat">
                  <span className="brand-stat-val">{val}</span>
                  <span className="brand-stat-lbl">{lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Form panel ── */}
        <div className="login-form-panel">

          {!forgotMode ? (
            <div className="login-form-inner">
              <div className="form-eyebrow"><span className="form-eyebrow-dot" />Welcome back to CyRa</div>
              <h2 className="form-heading">Sign in</h2>
              <p className="form-subheading">Track, predict & understand your cycle — pick up right where you left off.</p>

              <div className="form-body">
                <div className="field">
                  <label className="field-label">Email Address</label>
                  <div className={`field-input-wrap ${errors.email ? 'field-input-wrap--error' : ''}`}>
                    <span className="field-icon">✉️</span>
                    <input className="field-input" type="email" placeholder="you@example.com"
                      value={email} onChange={setField(setEmail, 'email')} autoComplete="email" />
                  </div>
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                <div className="field">
                  <div className="field-label-row">
                    <label className="field-label">Password</label>
                    <button type="button" className="forgot-inline-btn"
                      onClick={() => { setForgotMode(true); setErrors({}); clearError(); }}>
                      Forgot password?
                    </button>
                  </div>
                  <div className={`field-input-wrap ${errors.password ? 'field-input-wrap--error' : ''}`}>
                    <span className="field-icon">🔒</span>
                    <input className="field-input" type={showPass ? 'text' : 'password'}
                      placeholder="Your password" value={password}
                      onChange={setField(setPassword, 'password')}
                      autoComplete="current-password"
                      onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                    <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.password && <span className="field-error">{errors.password}</span>}
                </div>

                <button className={`btn-login ${loading ? 'btn-login--loading' : ''}`}
                  onClick={handleLogin} disabled={loading}>
                  {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In →'}
                </button>

                <div className="divider"><span>or continue with</span></div>

                <div className="social-row">
                  {[{ icon: '🔵', label: 'Google' }, { icon: '⚫', label: 'Apple' }].map(({ icon, label }) => (
                    <button key={label} className="btn-social">
                      <span>{icon}</span><span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <p className="form-footer">
                {authError && (
                  <div className="signup-error-message">
                    ⚠️ {authError}
                  </div>
                )}
                New to CyRa?{' '}
                <Link to="/signup" className="link-text">Create an account</Link>
              </p>
            </div>

          ) : resetSent ? (
            <div className="login-form-inner reset-confirm">
              <div className="confirm-icon">📬</div>
              <h2 className="form-heading">Check your inbox</h2>
              <p className="form-subheading">
                We've sent a password reset link to <strong>{email}</strong>.
              </p>
              <button className="btn-login"
                onClick={() => { setForgotMode(false); setResetSent(false); clearError(); }}>
                ← Back to Sign In
              </button>
              <p className="resend-hint">
                Didn't get it?{' '}
                <button className="link-text-btn" onClick={() => setResetSent(false)}>Resend email</button>
              </p>
            </div>

          ) : (
            <div className="login-form-inner">
              <button className="back-btn" onClick={() => { setForgotMode(false); setErrors({}); clearError(); }}>
                ← Back to sign in
              </button>
              {authError && <div className="auth-error-banner">⚠️ {authError}</div>}
              <div className="forgot-icon">🔑</div>
              <h2 className="form-heading">Reset password</h2>
              <p className="form-subheading">Enter your email and we'll send you a secure reset link.</p>
              <div className="form-body">
                <div className="field">
                  <label className="field-label">Email Address</label>
                  <div className={`field-input-wrap ${errors.email ? 'field-input-wrap--error' : ''}`}>
                    <span className="field-icon">✉️</span>
                    <input className="field-input" type="email" placeholder="you@example.com"
                      value={email} onChange={setField(setEmail, 'email')} />
                  </div>
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>
                <button className={`btn-login ${loading ? 'btn-login--loading' : ''}`}
                  onClick={handleForgot} disabled={loading}>
                  {loading ? <><span className="spinner" /> Sending…</> : 'Send Reset Link ✉️'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}