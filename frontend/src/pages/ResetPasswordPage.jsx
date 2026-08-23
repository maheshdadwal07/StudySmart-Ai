import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/forms/AuthLayout';
import '../styles/landing.css';
import '../styles/auth.css';

function IconKey() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
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

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleResend() {
    if (resendCooldown > 0 || !email) return;
    
    setResending(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/resend-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to resend code');
      }
      
      setResendCooldown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !otp || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    
    if (otp.length !== 6) {
      setError('Reset code must be 6 digits.');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          new_password: password
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to reset password');
      }
      
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
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
            Password reset successful
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65, margin: '0 0 32px' }}>
            You have successfully changed your password. Please sign in with your new password.
          </p>

          <Link
            to="/login"
            className="auth-submit"
            style={{ display: 'flex', textDecoration: 'none', justifyContent: 'center' }}
          >
            Sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="auth-head">
        <h1>Reset Password</h1>
        <p>Enter the 6-digit code sent to your email and choose a new password.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label">Email address</label>
          <div className="input-wrap">
            <span className="input-icon"><IconMail /></span>
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={!!location.state?.email}
              placeholder="you@example.com"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Reset Code (6 digits)</label>
          <div className="input-wrap">
            <span className="input-icon"><IconKey /></span>
            <input
              type="text"
              maxLength="6"
              className="auth-input"
              value={otp}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(val);
                setError('');
              }}
              placeholder="123456"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">New Password</label>
          <div className="input-wrap">
            <span className="input-icon"><IconKey /></span>
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Min 8 characters"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <div className="input-wrap">
            <span className="input-icon"><IconKey /></span>
            <input
              type="password"
              className="auth-input"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
              placeholder="Min 8 characters"
            />
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>

        <button
          type="submit"
          className="auth-submit"
          disabled={loading}
          style={{ marginTop: 4 }}
        >
          {loading ? <span className="auth-spinner" /> : null}
          {loading ? 'Resetting…' : 'Reset Password'}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 8 }}>
          Didn't receive the code?
        </p>
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || resending}
          style={{
            background: 'none', border: 'none',
            color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--primary)',
            fontWeight: 700, fontSize: 14, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
            padding: 0
          }}
        >
          {resending ? 'Sending...' : resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend Code'}
        </button>
      </div>

      <div className="auth-switch" style={{ marginTop: 16 }}>
        Remember your password?
        <Link to="/login">Sign in →</Link>
      </div>
    </AuthLayout>
  );
}
