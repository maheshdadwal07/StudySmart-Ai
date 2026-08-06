import React, { useState } from 'react';
import {
  User, Bell, Palette, Lock, Shield,
  Mail, Phone, MapPin, Save
} from 'lucide-react';
import '../../styles/dashboard.css';
import '../../styles/auth.css';
import '../../styles/settings.css';

/* ── Toggle switch — local helper renders the pseudo-element pattern ── */
function Toggle({ id, checked, onChange }) {
  return (
    <label className="toggle-wrap" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
      <span className="toggle-track" />
    </label>
  );
}

/* ── Tabs config ── */
const TABS = [
  { id: 'account',       label: 'Account',       icon: User },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'appearance',    label: 'Appearance',     icon: Palette },
  { id: 'password',      label: 'Password',       icon: Lock },
  { id: 'privacy',       label: 'Privacy',        icon: Shield },
];

/* ── Password strength (same logic as SignUpPage) ── */
function pwStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  return s;
}
const PW_LEVELS = ['', 'weak', 'fair', 'good', 'strong'];
const PW_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

/* ============================================================
   SETTINGS PAGE
   ============================================================ */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');

  /* ── Account form state ── */
  const [account, setAccount] = useState({
    name: 'Aarav Rao',
    email: 'aarav.rao@university.edu',
    phone: '+91 98765 43210',
    location: 'Mumbai, India',
  });
  const [accountSaved, setAccountSaved] = useState(false);

  /* ── Notification toggles ── */
  const [notifs, setNotifs] = useState({
    emailDigest:    true,
    studyReminders: true,
    weeklyReport:   false,
    newFeatures:    true,
    questionResults: true,
  });

  /* ── Appearance ── */
  const [theme, setTheme] = useState('light');

  /* ── Password form state ── */
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  /* ── Privacy toggles ── */
  const [privacy, setPrivacy] = useState({
    publicProfile:  false,
    activityFeed:   false,
    analytics:      true,
  });

  /* ── Save handlers ── */
  function saveAccount(e) {
    e.preventDefault();
    setAccountSaved(true);
    setTimeout(() => setAccountSaved(false), 2500);
  }

  function savePassword(e) {
    e.preventDefault();
    if (!pwForm.current)               { setPwError('Current password is required.'); return; }
    if (!pwForm.next)                  { setPwError('New password is required.'); return; }
    if (pwForm.next.length < 8)        { setPwError('New password must be at least 8 characters.'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }
    setPwError('');
    setPwSaved(true);
    setPwForm({ current: '', next: '', confirm: '' });
    setTimeout(() => setPwSaved(false), 2500);
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
    const FIELDS = [
      { key: 'name',     label: 'Full Name',      type: 'text',  icon: User,  placeholder: 'Your full name' },
      { key: 'email',    label: 'Email Address',   type: 'email', icon: Mail,  placeholder: 'you@example.com' },
      { key: 'phone',    label: 'Phone Number',    type: 'tel',   icon: Phone, placeholder: '+1 (555) 000-0000' },
      { key: 'location', label: 'Location',        type: 'text',  icon: MapPin,placeholder: 'City, Country' },
    ];

    return (
      <form onSubmit={saveAccount}>
        <SavedBanner show={accountSaved} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {FIELDS.map(field => {
            const FieldIcon = field.icon;
            return (
              <div key={field.key} className="form-group">
                <label htmlFor={`acc-${field.key}`} className="form-label">{field.label}</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <FieldIcon size={15} strokeWidth={1.8} color="#9AA1AE" />
                  </span>
                  <input
                    id={`acc-${field.key}`}
                    type={field.type}
                    className="auth-input"
                    placeholder={field.placeholder}
                    value={account[field.key]}
                    onChange={e => setAccount(p => ({ ...p, [field.key]: e.target.value }))}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Avatar section */}
        <div style={{ marginBottom: 24, padding: '18px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Profile Picture</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="avatar" style={{ width: 52, height: 52, fontSize: 18, borderRadius: 14, flexShrink: 0 }}>AR</div>
            <div>
              <button type="button" className="btn btn-secondary" style={{ fontSize: 13, padding: '8px 16px' }}>
                Change photo
              </button>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>JPG or PNG, max 2 MB</p>
            </div>
          </div>
        </div>

        <button id="save-account" type="submit" className="btn btn-primary">
          <Save size={14} strokeWidth={2} />
          Save Account
        </button>
      </form>
    );
  }

  /* ── NOTIFICATIONS TAB ── */
  function NotificationsTab() {
    const ROWS = [
      { key: 'emailDigest',     label: 'Email digest',          desc: 'Receive a daily summary of your study activity.' },
      { key: 'studyReminders',  label: 'Study reminders',        desc: 'Get reminded to study if you haven\'t opened the app today.' },
      { key: 'weeklyReport',    label: 'Weekly progress report', desc: 'A weekly email with your learning stats and streak.' },
      { key: 'newFeatures',     label: 'New features & updates', desc: 'Be the first to know about new AI features.' },
      { key: 'questionResults', label: 'Question session results', desc: 'Get notified when your question score is ready.' },
    ];

    return (
      <div>
        {ROWS.map(row => (
          <div key={row.key} className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">{row.label}</div>
              <div className="settings-row-desc">{row.desc}</div>
            </div>
            <Toggle
              id={`notif-${row.key}`}
              checked={notifs[row.key]}
              onChange={e => setNotifs(p => ({ ...p, [row.key]: e.target.checked }))}
            />
          </div>
        ))}
      </div>
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
              onClick={() => setTheme(t.id)}
              id={`theme-${t.id}`}
            >
              <div className="appearance-preview" style={{ background: t.preview }} />
              <div className="appearance-label">{t.label}</div>
            </button>
          ))}
        </div>
        {theme !== 'light' && (
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 8 }}>
            Dark mode is coming soon. Your preference has been saved.
          </p>
        )}

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Font Size</div>
          <div style={{ display: 'flex', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 3, gap: 2, width: 'fit-content' }}>
            {['Small', 'Medium', 'Large'].map(size => (
              <button
                key={size}
                type="button"
                style={{
                  padding: '7px 18px',
                  border: 'none',
                  borderRadius: 8,
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: size === 'Medium' ? '#fff' : 'none',
                  color: size === 'Medium' ? 'var(--text)' : 'var(--text-muted)',
                  boxShadow: size === 'Medium' ? 'var(--shadow-sm)' : 'none',
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
      { key: 'current', label: 'Current password',  placeholder: 'Enter your current password', autoComplete: 'current-password' },
      { key: 'next',    label: 'New password',       placeholder: 'Min. 8 characters',           autoComplete: 'new-password' },
      { key: 'confirm', label: 'Confirm new password', placeholder: 'Repeat new password',       autoComplete: 'new-password' },
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
    const ROWS = [
      { key: 'publicProfile', label: 'Public profile',       desc: 'Allow others to view your profile and study stats.' },
      { key: 'activityFeed',  label: 'Activity feed',         desc: 'Show your recent study sessions to followers.' },
      { key: 'analytics',     label: 'Usage analytics',       desc: 'Help improve StudySmart AI by sharing anonymous usage data.' },
    ];

    return (
      <div>
        {ROWS.map(row => (
          <div key={row.key} className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">{row.label}</div>
              <div className="settings-row-desc">{row.desc}</div>
            </div>
            <Toggle
              id={`priv-${row.key}`}
              checked={privacy[row.key]}
              onChange={e => setPrivacy(p => ({ ...p, [row.key]: e.target.checked }))}
            />
          </div>
        ))}

        <div className="danger-zone">
          <h4>Danger Zone</h4>
          <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
          <button type="button" className="btn-danger" id="delete-account-btn">
            Delete my account
          </button>
        </div>
      </div>
    );
  }

  /* ── Tab content map ── */
  const TAB_CONTENT = {
    account:       <AccountTab />,
    notifications: <NotificationsTab />,
    appearance:    <AppearanceTab />,
    password:      <PasswordTab />,
    privacy:       <PrivacyTab />,
  };

  /* ── Render ── */
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Manage your account, notifications, and preferences.</p>
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
