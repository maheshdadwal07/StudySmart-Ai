import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/forms/AuthLayout';
import '../styles/landing.css';
import '../styles/auth.css';

/* ── tiny inline SVG helpers (Lucide-style, no extra import cost) ── */
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
function IconEye({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/* ── Validation helpers ── */
function isValidEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

/* ============================================================
   LOGIN PAGE  —  one logical feature = one component
   ============================================================ */
export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const { login } = useAuth();

  /* ── Validation ── */
  function validate() {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!isValidEmail(email)) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    return errs;
  }

  /* ── Submit ── */
  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.message === 'UNVERIFIED_EMAIL') {
        setApiError('Your email address has not been verified yet.');
      } else {
        setApiError(err.message || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  /* ── Render ── */
  return (
    <AuthLayout>
      {/* Header */}
      <div className="auth-head">
        <h1>Welcome back</h1>
        <p>
          Don't have an account?{' '}
          <Link to="/signup">Create one free</Link>
        </p>
      </div>

      {/* Global API error */}
      {apiError && (
        <div
          style={{
            marginBottom: 18,
            padding: '11px 14px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.22)',
            borderRadius: 12,
            fontSize: 13.5,
            color: '#EF4444',
            fontWeight: 500,
          }}
          role="alert"
        >
          {apiError}
          {apiError === 'Your email address has not been verified yet.' && (
            <div style={{ marginTop: 8 }}>
              <Link to={`/verify-email?email=${encodeURIComponent(email)}`} style={{ color: '#EF4444', textDecoration: 'underline', fontWeight: 600 }}>
                Click here to verify your email
              </Link>
            </div>
          )}
        </div>
      )}

      <form
        id="login-form"
        className="auth-form"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* Email */}
        <div className="form-group">
          <label htmlFor="login-email" className="form-label">
            Email address
          </label>
          <div className="input-wrap">
            <span className="input-icon"><IconMail /></span>
            <input
              id="login-email"
              type="email"
              className={`auth-input${errors.email ? ' error' : ''}`}
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
            />
          </div>
          {errors.email && <p className="form-error">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="form-group">
          <label htmlFor="login-password" className="form-label">
            Password
            <Link to="/forgot-password" className="form-label-link">
              Forgot password?
            </Link>
          </label>
          <div className="input-wrap">
            <span className="input-icon"><IconLock /></span>
            <input
              id="login-password"
              type={showPw ? 'text' : 'password'}
              className={`auth-input has-suffix${errors.password ? ' error' : ''}`}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
            />
            <button
              type="button"
              className="input-suffix"
              aria-label={showPw ? 'Hide password' : 'Show password'}
              onClick={() => setShowPw((v) => !v)}
            >
              <IconEye open={showPw} />
            </button>
          </div>
          {errors.password && <p className="form-error">{errors.password}</p>}
        </div>

        {/* Submit */}
        <button
          id="login-submit"
          type="submit"
          className="auth-submit"
          disabled={loading}
        >
          {loading ? <span className="auth-spinner" /> : null}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

      </form>

      {/* Bottom switch */}
      <div className="auth-switch">
        New to StudySmart AI?
        <Link to="/signup">Create a free account →</Link>
      </div>
    </AuthLayout>
  );
}
