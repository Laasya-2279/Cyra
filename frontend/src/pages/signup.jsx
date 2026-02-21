import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Signup.css';

const TOTAL_STEPS = 4;
const STEP_TITLES = ['Create Account', 'Body & Cycle Basics', 'Cycle Health History', 'Lifestyle & Wellness'];
const STEP_SUBTITLES = ['Set up your secure account', 'Physical profile & cycle setup', 'Help us understand your cycle patterns', 'Daily habits that shape your cycle'];
const STEP_ICONS = ['🔐', '📏', '🌸', '🌿'];

export default function Signup() {
  const navigate = useNavigate();
  const { signup, authError, clearError } = useAuth();  // ← NEW

  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    dob: '', height: '', heightUnit: 'cm', weight: '', weightUnit: 'kg',
    cycleLength: '28', periodDuration: '5', lastPeriod: '', periodRegularity: '',
    previousCycles: [{ startDate: '', endDate: '', notes: '' }],
    birthControlType: '', healthConditions: [], otherCondition: '',
    baseMood: '', sleepHours: '7', sleepChangeDuringPeriod: '',
    skinCondition: '', skinChangeDuringPeriod: '', energyLevel: '5',
    diet: '', mentalHealth: '',
  });

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); clearError(); };

  const toggleCondition = (c) =>
    setForm(f => ({
      ...f,
      healthConditions: f.healthConditions.includes(c)
        ? f.healthConditions.filter(x => x !== c)
        : [...f.healthConditions, c],
    }));

  const updateCycle = (i, field, val) =>
    setForm(f => { const cycles = [...f.previousCycles]; cycles[i] = { ...cycles[i], [field]: val }; return { ...f, previousCycles: cycles }; });

  const addCycle = () =>
    setForm(f => ({ ...f, previousCycles: [...f.previousCycles, { startDate: '', endDate: '', notes: '' }] }));

  const removeCycle = (i) =>
    setForm(f => ({ ...f, previousCycles: f.previousCycles.filter((_, idx) => idx !== i) }));

  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.name.trim()) e.name = 'Name is required';
      if (!form.email.includes('@')) e.email = 'Enter a valid email';
      if (form.password.length < 8) e.password = 'Min. 8 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    if (s === 2) {
      if (!form.dob) e.dob = 'Date of birth is required';
      if (!form.height) e.height = 'Height is required';
      if (!form.weight) e.weight = 'Weight is required';
      if (!form.lastPeriod) e.lastPeriod = 'Required to calibrate predictions';
      if (!form.periodRegularity) e.periodRegularity = 'Please select regularity';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validate(step)) setStep(s => s + 1); };
  const handleBack = () => setStep(s => s - 1);

  // ── Final submit — calls AuthContext.signup ───────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    const result = await signup(form);   // ← passes entire form to AuthContext
    setLoading(false);
    if (result.success) navigate('/');
    // authError is exposed from context if it fails
  };

  const passScore = !form.password ? 0 : form.password.length < 8 ? 1 : form.password.length < 12 && !/[^a-zA-Z0-9]/.test(form.password) ? 2 : form.password.length >= 12 && /[^a-zA-Z0-9]/.test(form.password) ? 4 : 3;
  const passLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const passColors = ['', 'weak', 'fair', 'good', 'strong'];

  return (
    <div className="signup-page">
      <div className="blob blob-1" /><div className="blob blob-2" /><div className="blob blob-3" />

      <div className="floaters" aria-hidden="true">
        {['🌸', '🌱', '🌟', '🌙', '✨', '💧'].map((e, i) => (
          <span key={i} className="floater" style={{ left: `${8 + i * 14}%`, animationDelay: `${i * 0.85}s` }}>{e}</span>
        ))}
      </div>

      <div className="signup-card">

        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="left-content">
            <div className="logo-row">
              <span className="logo-mark">CA</span>
              <span className="logo-name">CyRa</span>
            </div>
            <h2 className="hero-text">Your body tells a story.<br /><em className="hero-em">We help you read it.</em></h2>
            <p className="hero-para">Biometric sensors + machine learning that learns <em>your</em> unique cycle — not a textbook average.</p>

            <div className="left-steps">
              {STEP_TITLES.map((title, i) => {
                const s = i + 1; const done = s < step; const active = s === step;
                return (
                  <div key={s} className={`left-step ${done ? 'left-step--done' : active ? 'left-step--active' : ''}`}>
                    <div className="left-step-icon">{done ? '✓' : STEP_ICONS[i]}</div>
                    <div className="left-step-info">
                      <p className="left-step-num">Step {s} of {TOTAL_STEPS}</p>
                      <p className="left-step-title">{title}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="phase-row">
              {[['🌸', 'Menstrual', 'menstrual'], ['🌱', 'Follicular', 'follicular'], ['🌟', 'Ovulatory', 'ovulatory'], ['🌙', 'Luteal', 'luteal']].map(([emoji, label, cls]) => (
                <div key={label} className={`phase-chip phase-chip--${cls}`}><span>{emoji}</span><span>{label}</span></div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          {/* Progress bar */}
          <div className="progress-bar-wrap">
            <div className="progress-bar" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </div>

          <div className="step-header">
            <div className="step-badge">{STEP_ICONS[step - 1]} Step {step}/{TOTAL_STEPS}</div>
            <h3 className="step-title">{STEP_TITLES[step - 1]}</h3>
            <p className="step-subtitle">{STEP_SUBTITLES[step - 1]}</p>
          </div>

          {/* Global auth error banner */}
          {authError && step === 4 && (
            <div className="auth-error-banner">⚠️ {authError}</div>
          )}

          {/* ══════════ STEP 1 — Account ══════════ */}
          {step === 1 && (
            <div className="form">
              <div className="field">
                <label className="field-label">Full Name</label>
                <input className={`field-input ${errors.name ? 'field-input--error' : ''}`} type="text"
                  placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className="field">
                <label className="field-label">Email Address</label>
                <input className={`field-input ${errors.email ? 'field-input--error' : ''}`} type="email"
                  placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="field">
                <label className="field-label">Password</label>
                <div className="pass-wrap">
                  <input className={`field-input ${errors.password ? 'field-input--error' : ''}`}
                    type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters"
                    value={form.password} onChange={e => set('password', e.target.value)} />
                  <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {form.password && (
                  <div className="pass-strength">
                    <div className="pass-bars">
                      {[1, 2, 3, 4].map(n => (
                        <div key={n} className={`pass-bar ${passScore >= n ? `pass-bar--${passColors[passScore]}` : ''}`} />
                      ))}
                    </div>
                    <span className={`pass-label pass-label--${passColors[passScore]}`}>{passLabels[passScore]}</span>
                  </div>
                )}
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="field">
                <label className="field-label">Confirm Password</label>
                <input className={`field-input ${errors.confirmPassword ? 'field-input--error' : ''}`}
                  type="password" placeholder="Re-enter password"
                  value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>

              <button className="btn-primary" onClick={handleNext}>Continue →</button>

              <p className="form-footer">
                Already have an account? <Link to="/login" className="link-text">Sign in</Link>
              </p>
            </div>
          )}

          {/* ══════════ STEP 2 — Body & Cycle Basics ══════════ */}
          {step === 2 && (
            <div className="form">
              <div className="field">
                <label className="field-label">Date of Birth</label>
                <input className={`field-input ${errors.dob ? 'field-input--error' : ''}`} type="date"
                  value={form.dob} onChange={e => set('dob', e.target.value)} />
                {errors.dob && <span className="field-error">{errors.dob}</span>}
              </div>

              <div className="field-row">
                <div className="field">
                  <label className="field-label">Height</label>
                  <div className="unit-input">
                    <input className={`field-input ${errors.height ? 'field-input--error' : ''}`} type="number"
                      placeholder="e.g. 165" value={form.height} onChange={e => set('height', e.target.value)} />
                    <select className="unit-select" value={form.heightUnit} onChange={e => set('heightUnit', e.target.value)}>
                      <option>cm</option><option>ft</option>
                    </select>
                  </div>
                  {errors.height && <span className="field-error">{errors.height}</span>}
                </div>
                <div className="field">
                  <label className="field-label">Weight</label>
                  <div className="unit-input">
                    <input className={`field-input ${errors.weight ? 'field-input--error' : ''}`} type="number"
                      placeholder="e.g. 60" value={form.weight} onChange={e => set('weight', e.target.value)} />
                    <select className="unit-select" value={form.weightUnit} onChange={e => set('weightUnit', e.target.value)}>
                      <option>kg</option><option>lbs</option>
                    </select>
                  </div>
                  {errors.weight && <span className="field-error">{errors.weight}</span>}
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label className="field-label">Average Cycle Length (days)</label>
                  <input className="field-input" type="number" min="21" max="45"
                    value={form.cycleLength} onChange={e => set('cycleLength', e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label">Period Duration (days)</label>
                  <input className="field-input" type="number" min="1" max="10"
                    value={form.periodDuration} onChange={e => set('periodDuration', e.target.value)} />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Last Period Start Date</label>
                <input className={`field-input ${errors.lastPeriod ? 'field-input--error' : ''}`} type="date"
                  value={form.lastPeriod} onChange={e => set('lastPeriod', e.target.value)} />
                {errors.lastPeriod && <span className="field-error">{errors.lastPeriod}</span>}
              </div>

              <div className="field">
                <label className="field-label">Cycle Regularity</label>
                <div className="chip-grid">
                  {['Very regular', 'Mostly regular', 'Somewhat irregular', 'Very irregular'].map(opt => (
                    <div key={opt} className={`pill-chip ${form.periodRegularity === opt ? 'pill-chip--active' : ''}`}
                      onClick={() => set('periodRegularity', opt)}>{opt}</div>
                  ))}
                </div>
                {errors.periodRegularity && <span className="field-error">{errors.periodRegularity}</span>}
              </div>

              <div className="btn-row">
                <button className="btn-back" onClick={handleBack}>← Back</button>
                <button className="btn-primary" onClick={handleNext}>Continue →</button>
              </div>
            </div>
          )}

          {/* ══════════ STEP 3 — Cycle Health History ══════════ */}
          {step === 3 && (
            <div className="form">
              <div className="section-divider"><span>📅 Previous Cycles</span></div>

              {form.previousCycles.map((cycle, i) => (
                <div key={i} className="cycle-entry">
                  <div className="cycle-entry-header">
                    <span>Cycle {i + 1}</span>
                    {i > 0 && <button className="btn-remove-cycle" onClick={() => removeCycle(i)}>✕</button>}
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label className="field-label">Start Date</label>
                      <input className="field-input" type="date" value={cycle.startDate} onChange={e => updateCycle(i, 'startDate', e.target.value)} />
                    </div>
                    <div className="field">
                      <label className="field-label">End Date</label>
                      <input className="field-input" type="date" value={cycle.endDate} onChange={e => updateCycle(i, 'endDate', e.target.value)} />
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">Notes</label>
                    <input className="field-input" type="text" placeholder="e.g. heavy flow, cramps, stress..."
                      value={cycle.notes} onChange={e => updateCycle(i, 'notes', e.target.value)} />
                  </div>
                </div>
              ))}

              {form.previousCycles.length < 4 && (
                <button className="btn-add-cycle" type="button" onClick={addCycle}>+ Add Another Cycle</button>
              )}

              <div className="section-divider"><span>💊 Birth Control</span></div>
              <div className="field">
                <label className="field-label">Current Birth Control Method</label>
                <div className="chip-grid">
                  {['None', 'Pill (combined)', 'Pill (progestin only)', 'IUD (hormonal)', 'IUD (copper)', 'Implant', 'Patch', 'Ring', 'Injection', 'Other'].map(opt => (
                    <div key={opt} className={`pill-chip ${form.birthControlType === opt ? 'pill-chip--active' : ''}`}
                      onClick={() => set('birthControlType', opt)}>{opt}</div>
                  ))}
                </div>
              </div>

              <div className="section-divider"><span>🩺 Health Conditions</span></div>
              <div className="field">
                <label className="field-label">Select all that apply</label>
                <div className="chip-grid">
                  {['PCOS', 'Endometriosis', 'Fibroids', 'Thyroid disorder', 'Diabetes', 'Anemia', 'Anxiety disorder', 'Depression', 'Autoimmune condition', 'None of the above'].map(cond => (
                    <div key={cond} className={`pill-chip ${form.healthConditions.includes(cond) ? 'pill-chip--active' : ''}`}
                      onClick={() => toggleCondition(cond)}>{cond}</div>
                  ))}
                </div>
              </div>

              {form.healthConditions.includes('Other') && (
                <div className="field">
                  <label className="field-label">Specify other condition</label>
                  <input className="field-input" type="text" placeholder="Enter condition..."
                    value={form.otherCondition} onChange={e => set('otherCondition', e.target.value)} />
                </div>
              )}

              <div className="btn-row">
                <button className="btn-back" onClick={handleBack}>← Back</button>
                <button className="btn-primary btn-submit" onClick={handleNext}>Continue →</button>
              </div>
            </div>
          )}

          {/* ══════════ STEP 4 — Lifestyle & Wellness ══════════ */}
          {step === 4 && (
            <div className="form">
              <div className="section-divider"><span>😊 Mood & Mental Health</span></div>
              <div className="field">
                <label className="field-label">Typical Mood (baseline)</label>
                <div className="mood-grid">
                  {[['😄', 'Happy'], ['🙂', 'Good'], ['😐', 'Neutral'], ['😔', 'Low'], ['😤', 'Irritable'], ['😰', 'Anxious']].map(([emoji, label]) => (
                    <div key={label} className={`mood-chip ${form.baseMood === label ? 'mood-chip--active' : ''}`}
                      onClick={() => set('baseMood', label)}>
                      <span className="mood-chip-emoji">{emoji}</span>
                      <span className="mood-chip-label">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="field">
                <label className="field-label">Mental Health (general state)</label>
                <div className="chip-grid">
                  {['Thriving', 'Stable', 'Managing', 'Struggling', 'Seeking support'].map(opt => (
                    <div key={opt} className={`pill-chip ${form.mentalHealth === opt ? 'pill-chip--active' : ''}`}
                      onClick={() => set('mentalHealth', opt)}>{opt}</div>
                  ))}
                </div>
              </div>

              <div className="section-divider"><span>😴 Sleep</span></div>
              <div className="field">
                <label className="field-label">Average Sleep Hours: <strong>{form.sleepHours}h</strong></label>
                <div className="slider-row">
                  <span className="slider-emoji">😴</span>
                  <input className="range-slider" type="range" min="4" max="12" step="0.5"
                    value={form.sleepHours} onChange={e => set('sleepHours', e.target.value)} />
                  <span className="slider-emoji">⚡</span>
                </div>
                <div className="slider-ticks"><span>4h</span><span>6h</span><span>8h</span><span>10h</span><span>12h</span></div>
              </div>

              <div className="field">
                <label className="field-label">How does sleep change during your period?</label>
                <div className="chip-grid">
                  {['Sleep much more', 'Sleep a bit more', 'No change', 'Sleep less', 'Very disrupted'].map(opt => (
                    <div key={opt} className={`pill-chip ${form.sleepChangeDuringPeriod === opt ? 'pill-chip--active' : ''}`}
                      onClick={() => set('sleepChangeDuringPeriod', opt)}>{opt}</div>
                  ))}
                </div>
              </div>

              <div className="section-divider"><span>✨ Skin</span></div>
              <div className="field-row">
                <div className="field">
                  <label className="field-label">Typical Skin Type</label>
                  <select className="field-select" value={form.skinCondition} onChange={e => set('skinCondition', e.target.value)}>
                    <option value="">Select...</option>
                    {['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive', 'Acne-prone'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Skin during period</label>
                  <select className="field-select" value={form.skinChangeDuringPeriod} onChange={e => set('skinChangeDuringPeriod', e.target.value)}>
                    <option value="">Select...</option>
                    {['Gets oilier', 'Gets drier', 'Breakouts', 'Flushed/red', 'No change', 'Glows more'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="section-divider"><span>⚡ Energy & Diet</span></div>
              <div className="field">
                <label className="field-label">Typical Energy Level: <strong>{form.energyLevel}/10</strong></label>
                <div className="slider-row">
                  <span className="slider-emoji">🥱</span>
                  <input className="range-slider range-slider--energy" type="range" min="1" max="10"
                    value={form.energyLevel} onChange={e => set('energyLevel', e.target.value)} />
                  <span className="slider-emoji">🚀</span>
                </div>
              </div>

              <div className="field">
                <label className="field-label">Typical Diet Pattern</label>
                <div className="chip-grid">
                  {['Balanced', 'Vegetarian', 'Vegan', 'Keto / Low-carb', 'High-protein', 'Intermittent fasting', 'No specific diet'].map(opt => (
                    <div key={opt} className={`pill-chip ${form.diet === opt ? 'pill-chip--active' : ''}`}
                      onClick={() => set('diet', opt)}>{opt}</div>
                  ))}
                </div>
              </div>

              <div className="ml-note">
                <span className="ml-icon">🤖</span>
                <p className="ml-text">All this data feeds directly into the Random Forest classifier. The more you share, the more personalized your predictions become — accuracy improves every cycle.</p>
              </div>

              <div className="btn-row">
                <button className="btn-back" onClick={handleBack}>← Back</button>
                <button className={`btn-primary btn-submit ${loading ? 'btn-primary--loading' : ''}`}
                  onClick={handleSubmit} disabled={loading}>
                  {loading ? <span className="spinner" /> : 'Start Tracking ✨'}
                </button>
              </div>

              <p className="terms-text">
                By joining, you agree to our <span className="link-text">Terms of Service</span> &{' '}
                <span className="link-text">Privacy Policy</span>. Your health data is encrypted and never shared.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}