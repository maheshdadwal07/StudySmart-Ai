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
function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" fill="#FFC107" />
      <path d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" fill="#FF3D00" />
      <path d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z" fill="#4CAF50" />
      <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.2 5.2C41.1 36.2 44 30.5 44 24c0-1.2-.1-2.3-.4-3.5z" fill="#1976D2" />
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

  /* ── Google OAuth ── */
  function handleGoogle() {
    // TODO: trigger Google OAuth flow
    console.log('Google sign-in');
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

        {/* Divider */}
        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        {/* Google */}
        <button
          id="login-google"
          type="button"
          className="auth-oauth"
          onClick={handleGoogle}
        >
          <IconGoogle />
          Continue with Google
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
