import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/forms/AuthLayout';
import '../styles/landing.css';
import '../styles/auth.css';

function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  );
}

function isValidEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

/* ============================================================
   FORGOT PASSWORD PAGE
   ============================================================ */
export default function ForgotPasswordPage() {
  const [email, setEmail]         = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim())        { setError('Email is required.'); return; }
    if (!isValidEmail(email)) { setError('Enter a valid email address.'); return; }
    setError('');
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000)); // TODO: replace with real API call
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  /* ── Success state ──────────────────────────────────────── */
  if (submitted) {
    return (
      <AuthLayout>
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{
            width: 68, height: 68,
            borderRadius: 20,
            background: 'rgba(34,197,94,0.10)',
            border: '1px solid rgba(34,197,94,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', margin: '0 0 10px' }}>
            Check your inbox
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65, margin: '0 0 32px' }}>
            We sent a password reset link to{' '}
            <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{email}</strong>.
            {' '}The link expires in 15 minutes.
          </p>

          <Link
            to="/login"
            className="auth-submit"
            style={{ display: 'flex', textDecoration: 'none' }}
          >
            Back to sign in
          </Link>

          <p style={{ marginTop: 20, fontSize: 13.5, color: 'var(--text-muted)' }}>
            Didn't receive it?{' '}
            <button
              onClick={() => { setSubmitted(false); setEmail(''); }}
              style={{
                background: 'none', border: 'none',
                color: 'var(--primary)', fontWeight: 700,
                fontSize: 'inherit', cursor: 'pointer', padding: 0,
              }}
            >
              Try again
            </button>
          </p>
        </div>
      </AuthLayout>
    );
  }

  /* ── Form state ─────────────────────────────────────────── */
  return (
    <AuthLayout>
      <div className="auth-head">
        <h1>Reset your password</h1>
        <p>Enter the email address on your account and we'll send you a secure reset link.</p>
      </div>

      <form id="forgot-form" className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="forgot-email" className="form-label">Email address</label>
          <div className="input-wrap">
            <span className="input-icon"><IconMail /></span>
            <input
              id="forgot-email"
              type="email"
              className={`auth-input${error ? ' error' : ''}`}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
            />
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>

        <button
          id="forgot-submit"
          type="submit"
          className="auth-submit"
          disabled={loading}
          style={{ marginTop: 4 }}
        >
          {loading ? <span className="auth-spinner" /> : null}
          {loading ? 'Sending link…' : 'Send reset link'}
        </button>
      </form>

      <div className="auth-switch">
        Remember your password?
        <Link to="/login">Sign in →</Link>
      </div>
    </AuthLayout>
  );
}
