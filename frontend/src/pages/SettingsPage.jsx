import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  User, Palette, Lock, Shield,
  Mail, Phone, MapPin, Save
} from 'lucide-react';
import { apiFetch } from '../api/client';
import '../styles/dashboard.css';
import '../styles/auth.css';
import '../styles/settings.css';

/* ── Tabs config ── */
const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'password', label: 'Password', icon: Lock },
  { id: 'privacy', label: 'Privacy', icon: Shield },
];

/* ── Password strength (same logic as SignUpPage) ── */
function pwStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const PW_LEVELS = ['', 'weak', 'fair', 'good', 'strong'];
const PW_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

/* ============================================================
   SETTINGS PAGE
   ============================================================ */
export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');

  /* ── Account form state ── */
  const [account, setAccount] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
  });

  useEffect(() => {
    if (user) {
      setAccount({
        name: user.name || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        location: user.profile?.location || '',
      });
      
      if (user.preferences) {
        setTheme(user.preferences.theme || 'light');
        setFontSize(user.preferences.fontSize || 'Medium');
      }
    }
  }, [user]);

  const [accountSaved, setAccountSaved] = useState(false);

  /* ── Appearance ── */
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('Medium');

  /* ── Password form state ── */
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  /* ── Delete Account state ── */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-save generic settings when changed
  const saveSettings = async (prefs) => {
    try {
      await apiFetch('/api/account/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs)
      });
      await refreshUser();
    } catch (e) {
      console.error(e);
    }
  };

  /* ── Save handlers ── */
  async function saveAccount(e) {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: account.name,
          profile: {
            phone: account.phone,
            location: account.location,
            university: user?.profile?.university || '',
            field: user?.profile?.field || '',
            level: user?.profile?.level || '',
            goal: user?.profile?.goal || '',
            bio: user?.profile?.bio || ''
          }
        })
      });
      if (res.ok) {
        setAccountSaved(true);
        setTimeout(() => setAccountSaved(false), 2500);
        await refreshUser();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (!pwForm.current) { setPwError('Current password is required.'); return; }
    if (!pwForm.next) { setPwError('New password is required.'); return; }
    if (pwForm.next.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }
    setPwError('');
    
    try {
      const res = await apiFetch('/api/account/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: pwForm.current,
          new_password: pwForm.next
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        setPwError(errorData.detail || 'Failed to update password');
        return;
      }
      
      setPwSaved(true);
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(async () => {
        setPwSaved(false);
        // Force logout to apply new password sessions
        await logout();
        navigate('/login');
      }, 1500);
    } catch (e) {
      setPwError('An error occurred. Please try again.');
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm.');
      return;
    }
    
    setIsDeleting(true);
    setDeleteError('');

    try {
      const res = await apiFetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword })
      });

      if (!res.ok) {
        const errorData = await res.json();
        setDeleteError(errorData.detail || 'Failed to delete account');
        setIsDeleting(false);
        return;
      }

      // Successful deletion
      await logout();
      navigate('/');
    } catch (e) {
      setDeleteError('An unexpected error occurred. Please try again.');
      setIsDeleting(false);
    }
  }

  /* ── Password eye icon ── */
  function EyeIcon({ open }) {
    return open ? (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }

  /* ── Shared save banner ── */
  function SavedBanner({ show }) {
    if (!show) return null;
    return (
      <div style={{
        padding: '10px 14px',
        background: 'rgba(34,197,94,0.09)',
        border: '1px solid rgba(34,197,94,0.22)',
        borderRadius: 10,
        fontSize: 13.5,
        fontWeight: 600,
        color: '#16a34a',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Changes saved successfully.
      </div>
    );
  }

  /* ── ACCOUNT TAB ── */
  function AccountTab() {
    return (
      <form onSubmit={saveAccount}>
        <SavedBanner show={accountSaved} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          
          <div className="form-group">
            <label htmlFor="acc-name" className="form-label">Full Name</label>
            <div className="input-wrap">
              <span className="input-icon">
                <User size={15} strokeWidth={1.8} color="#9AA1AE" />
              </span>
              <input
                id="acc-name"
                type="text"
                className="auth-input"
                placeholder="Your full name"
                value={account.name}
                onChange={e => setAccount(p => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="acc-email" className="form-label">Email Address</label>
            <div className="input-wrap">
              <span className="input-icon">
                <Mail size={15} strokeWidth={1.8} color="#9AA1AE" />
              </span>
              <input
                id="acc-email"
                type="email"
                className="auth-input"
                value={account.email}
                readOnly
                style={{ backgroundColor: 'var(--border)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                title="Email cannot be changed directly."
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="acc-phone" className="form-label">Phone Number</label>
            <div className="input-wrap">
              <span className="input-icon">
                <Phone size={15} strokeWidth={1.8} color="#9AA1AE" />
              </span>
              <input
                id="acc-phone"
                type="tel"
                className="auth-input"
                placeholder="+1 (555) 000-0000"
                value={account.phone}
                onChange={e => setAccount(p => ({ ...p, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="acc-location" className="form-label">Location</label>
            <div className="input-wrap">
              <span className="input-icon">
                <MapPin size={15} strokeWidth={1.8} color="#9AA1AE" />
              </span>
              <input
                id="acc-location"
                type="text"
                className="auth-input"
                placeholder="City, Country"
                value={account.location}
                onChange={e => setAccount(p => ({ ...p, location: e.target.value }))}
              />
            </div>
          </div>

        </div>

        <button id="save-account" type="submit" className="btn btn-secondary">
          <Save size={14} strokeWidth={2} />
          Save Account
        </button>
      </form>
    );
  }

  /* ── APPEARANCE TAB ── */
  function AppearanceTab() {
    const THEMES = [
      {
        id: 'light',
        label: 'Light',
        preview: 'linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)',
      },
      {
        id: 'dark',
        label: 'Dark',
        preview: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
      },
      {
        id: 'system',
        label: 'System',
        preview: 'linear-gradient(90deg, #ffffff 50%, #1e293b 50%)',
      },
    ];

    return (
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Theme</div>
        <div className="appearance-grid">
          {THEMES.map(t => (
            <button
              key={t.id}
              type="button"
              className={`appearance-card${theme === t.id ? ' active' : ''}`}
              onClick={() => {
                setTheme(t.id);
                saveSettings({ theme: t.id, fontSize });
              }}
              id={`theme-${t.id}`}
            >
              <div className="appearance-preview" style={{ background: t.preview }} />
              <div className="appearance-label">{t.label}</div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Font Size</div>
          <div style={{ display: 'flex', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 3, gap: 2, width: 'fit-content' }}>
            {['Small', 'Medium', 'Large'].map(size => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setFontSize(size);
                  saveSettings({ theme, fontSize: size });
                }}
                style={{
                  padding: '7px 18px',
                  border: 'none',
                  borderRadius: 8,
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: fontSize === size ? 'var(--primary)' : 'transparent',
                  color: fontSize === size ? '#fff' : 'var(--text-muted)',
                  boxShadow: fontSize === size ? 'var(--shadow-sm)' : 'none',
                  transition: 'all .15s',
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── PASSWORD TAB ── */
  function PasswordTab() {
    const strength = pwStrength(pwForm.next);
    const level = PW_LEVELS[strength] || '';
    const label = PW_LABELS[strength] || '';

    const PW_FIELDS = [
      { key: 'current', label: 'Current password', placeholder: 'Enter your current password', autoComplete: 'current-password' },
      { key: 'next', label: 'New password', placeholder: 'Min. 8 characters', autoComplete: 'new-password' },
      { key: 'confirm', label: 'Confirm new password', placeholder: 'Repeat new password', autoComplete: 'new-password' },
    ];

    return (
      <form onSubmit={savePassword} style={{ maxWidth: 440 }}>
        <SavedBanner show={pwSaved} />
        {pwError && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 10, fontSize: 13, color: '#EF4444', fontWeight: 500, marginBottom: 20 }}>
            {pwError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {PW_FIELDS.map(field => (
            <div key={field.key} className="form-group">
              <label htmlFor={`pw-${field.key}`} className="form-label">{field.label}</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <Lock size={15} strokeWidth={1.8} color="#9AA1AE" />
                </span>
                <input
                  id={`pw-${field.key}`}
                  type={showPw[field.key] ? 'text' : 'password'}
                  className="auth-input has-suffix"
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  value={pwForm[field.key]}
                  onChange={e => { setPwForm(p => ({ ...p, [field.key]: e.target.value })); setPwError(''); }}
                />
                <button
                  type="button"
                  className="input-suffix"
                  onClick={() => setShowPw(p => ({ ...p, [field.key]: !p[field.key] }))}
                  aria-label="Toggle password visibility"
                >
                  <EyeIcon open={showPw[field.key]} />
                </button>
              </div>
              {field.key === 'next' && pwForm.next && (
                <div className="pw-strength">
                  <div className="pw-strength-bars">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className={`pw-strength-bar${strength >= n ? ` ${level}` : ''}`} />
                    ))}
                  </div>
                  <span className={`pw-strength-label ${level}`}>{label} password</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <button id="save-password" type="submit" className="btn btn-primary">
          <Lock size={14} strokeWidth={2} />
          Update Password
        </button>
      </form>
    );
  }

  /* ── PRIVACY TAB ── */
  function PrivacyTab() {
    return (
      <div>
        <div className="danger-zone">
          <h4>Danger Zone</h4>
          <p>Permanently delete your account and all associated data including documents and study history. This action cannot be undone.</p>
          <button type="button" className="btn-danger" onClick={() => setShowDeleteModal(true)} id="delete-account-btn">
            Delete my account
          </button>
        </div>

        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 400 }}>
              <h3 style={{ color: '#EF4444', marginBottom: 8, fontSize: 18 }}>Confirm Account Deletion</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
                This will permanently delete your account, documents, and all saved study sessions. Please enter your password to confirm.
              </p>
              
              <form onSubmit={handleDeleteAccount}>
                <div className="input-wrap" style={{ marginBottom: 16 }}>
                  <span className="input-icon">
                    <Lock size={15} strokeWidth={1.8} color="#9AA1AE" />
                  </span>
                  <input
                    type="password"
                    className="auth-input"
                    placeholder="Enter your password"
                    value={deletePassword}
                    onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                    required
                  />
                </div>
                
                {deleteError && (
                  <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
                    {deleteError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn btn-ghost" 
                    onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-danger"
                    disabled={isDeleting || !deletePassword}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Tab content map ── */
  const TAB_CONTENT = {
    account: <AccountTab />,
    appearance: <AppearanceTab />,
    password: <PasswordTab />,
    privacy: <PrivacyTab />,
  };

  /* ── Render ── */
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Manage your account preferences and settings.</p>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 0 }}>
        {/* Tab strip */}
        <div className="settings-tabs">
          {TABS.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                className={`settings-tab${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <TabIcon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active tab content */}
        {TAB_CONTENT[activeTab]}
      </div>
    </>
  );
}
