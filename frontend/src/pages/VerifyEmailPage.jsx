import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import AuthLayout from '../components/forms/AuthLayout';
import '../styles/landing.css';
import '../styles/auth.css';

function IconMail() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)', marginBottom: '16px' }}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  );
}

export default function VerifyEmailPage() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get('email');

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Verification failed. Please check your code.');
      }

      setSuccess('Email verified successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setError('');
    setSuccess('');
    setResending(true);

    try {
      const res = await apiFetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to resend code.');
      }

      setSuccess('A new verification code has been sent to your email.');
      setCooldown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-head" style={{ textAlign: 'center' }}>
        <IconMail />
        <h1>Check your email</h1>
        <p style={{ marginTop: '8px' }}>
          We sent a verification code to:<br/>
          <strong>{email}</strong>
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: 18, padding: '11px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 12, fontSize: 13.5, color: '#EF4444', fontWeight: 500 }} role="alert">
          {error}
        </div>
      )}

      {success && (
        <div style={{ marginBottom: 18, padding: '11px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)', borderRadius: 12, fontSize: 13.5, color: '#10B981', fontWeight: 500 }} role="alert">
          {success}
        </div>
      )}

      <form className="auth-form" onSubmit={handleVerify}>
        <div className="form-group" style={{ textAlign: 'center' }}>
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setOtp(val);
            }}
            placeholder="000000"
            className="auth-input"
            style={{ fontSize: '24px', letterSpacing: '8px', textAlign: 'center', padding: '12px' }}
            autoComplete="one-time-code"
          />
        </div>

        <button type="submit" className="auth-submit" disabled={loading || otp.length !== 6}>
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
        Didn't receive the code?{' '}
        <button 
          type="button" 
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          style={{ 
            background: 'none', border: 'none', color: 'var(--primary)', 
            fontWeight: 500, cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
            padding: 0, font: 'inherit'
          }}
        >
          {resending ? 'Sending...' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>
      </div>

      <div className="auth-switch" style={{ marginTop: '16px' }}>
        <Link to="/login">← Back to log in</Link>
      </div>
    </AuthLayout>
  );
}
