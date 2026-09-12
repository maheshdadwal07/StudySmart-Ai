import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/forms/AuthLayout';
import '../styles/landing.css';
import '../styles/auth.css';

/* ── tiny inline SVG helpers ── */
function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
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

function getPasswordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-4
}

const PW_LEVELS = ['', 'weak', 'fair', 'good', 'strong'];
const PW_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

/* ── Password strength bar component (inline, no extra file) ── */
function PasswordStrength({ password }) {
  const score = getPasswordStrength(password);
  const level = PW_LEVELS[score] || '';
  const label = PW_LABELS[score] || '';

  if (!password) return null;

  return (
    <div className="pw-strength">
      <div className="pw-strength-bars">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`pw-strength-bar${score >= n ? ` ${level}` : ''}`}
          />
        ))}
      </div>
      <span className={`pw-strength-label ${level}`}>{label} password</span>
    </div>
  );
}

/* ============================================================
   SIGN UP PAGE  —  one logical feature = one component
   ============================================================ */
export default function SignUpPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const { register } = useAuth();

  /* ── Validation ── */
  function validate() {
    const errs = {};
    if (!name.trim()) errs.name = 'Full name is required.';
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!isValidEmail(email)) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (!confirmPw) errs.confirmPw = 'Please confirm your password.';
    else if (confirmPw !== password) errs.confirmPw = 'Passwords do not match.';
    if (!agreed) errs.agreed = 'You must agree to the terms to continue.';
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
      await register(name, email, password);
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }


  /* ── Render ── */
  return (
    <AuthLayout>
      {/* Header */}
      <div className="auth-head">
        <h1>Create your account</h1>
        <p>
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
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
        </div>
      )}


      <form
        id="signup-form"
        className="auth-form"
        onSubmit={handleSubmit}
        noValidate
        style={{ marginTop: 4 }}
      >
        {/* Full Name */}
        <div className="form-group">
          <label htmlFor="signup-name" className="form-label">
            Full name
          </label>
          <div className="input-wrap">
            <span className="input-icon"><IconUser /></span>
            <input
              id="signup-name"
              type="text"
              className={`auth-input${errors.name ? ' error' : ''}`}
              placeholder="Jane Smith"
              autoComplete="name"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
            />
          </div>
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="signup-email" className="form-label">
            Email address
          </label>
          <div className="input-wrap">
            <span className="input-icon"><IconMail /></span>
            <input
              id="signup-email"
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
          <label htmlFor="signup-password" className="form-label">
            Password
          </label>
          <div className="input-wrap">
            <span className="input-icon"><IconLock /></span>
            <input
              id="signup-password"
              type={showPw ? 'text' : 'password'}
              className={`auth-input has-suffix${errors.password ? ' error' : ''}`}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
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
          <PasswordStrength password={password} />
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label htmlFor="signup-confirm" className="form-label">
            Confirm password
          </label>
          <div className="input-wrap">
            <span className="input-icon"><IconLock /></span>
            <input
              id="signup-confirm"
              type={showConfirm ? 'text' : 'password'}
              className={`auth-input has-suffix${errors.confirmPw ? ' error' : ''}`}
              placeholder="Repeat your password"
              autoComplete="new-password"
              value={confirmPw}
              onChange={(e) => { setConfirmPw(e.target.value); setErrors((p) => ({ ...p, confirmPw: '' })); }}
            />
            <button
              type="button"
              className="input-suffix"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              onClick={() => setShowConfirm((v) => !v)}
            >
              <IconEye open={showConfirm} />
            </button>
          </div>
          {errors.confirmPw && <p className="form-error">{errors.confirmPw}</p>}
        </div>

        {/* Terms */}
        <div className="form-group">
          <label className="auth-terms">
            <input
              id="signup-terms"
              type="checkbox"
              checked={agreed}
              onChange={(e) => { setAgreed(e.target.checked); setErrors((p) => ({ ...p, agreed: '' })); }}
            />
            I agree to the{' '}
            <Link to="/terms">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy">Privacy Policy</Link>
          </label>
          {errors.agreed && <p className="form-error">{errors.agreed}</p>}
        </div>

        {/* Submit */}
        <button
          id="signup-submit"
          type="submit"
          className="auth-submit"
          disabled={loading}
        >
          {loading ? <span className="auth-spinner" /> : null}
          {loading ? 'Creating account…' : 'Create free account'}
        </button>
      </form>

      {/* Bottom switch */}
      <div className="auth-switch">
        Already have an account?
        <Link to="/login">Sign in →</Link>
      </div>
    </AuthLayout>
  );
}
