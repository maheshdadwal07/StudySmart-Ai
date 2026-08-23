import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../api/client';
import {
  FileText, TrendingUp, HelpCircle, BookOpen,
  MapPin, Mail, Phone, GraduationCap, Target,
  Calendar, Edit2, Check, X
} from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import '../styles/dashboard.css';
import '../styles/auth.css';

/* ── Profile stat cards ── */
const PROFILE_STATS = [
  {
    title: 'Documents Uploaded',
    value: '—',
    trend: null, trendDir: null,
    icon: FileText,
    iconBg: 'rgba(79,70,229,0.09)', iconColor: '#4F46E5',
    progress: null, progressColor: null,
  },
  {
    title: 'Learning Progress',
    value: '—',
    trend: null, trendDir: null,
    icon: TrendingUp,
    iconBg: 'rgba(34,197,94,0.09)', iconColor: '#22C55E',
    progress: null,
    progressColor: 'linear-gradient(90deg,var(--primary),var(--accent))',
  },
  {
    title: 'Questions Generated',
    value: '—',
    trend: null, trendDir: null,
    icon: HelpCircle,
    iconBg: 'rgba(6,182,212,0.09)', iconColor: '#06B6D4',
    progress: null, progressColor: null,
  },
  {
    title: 'Study Sessions',
    value: '—',
    trend: null, trendDir: null,
    icon: BookOpen,
    iconBg: 'rgba(245,158,11,0.09)', iconColor: '#F59E0B',
    progress: null, progressColor: null,
  },
];

/* ── Recent activity (mirrors doc-row pattern from dashboard) ── */
const RECENT_ACTIVITY = [];

/* doc-icon SVG per file type — same colours as dashboard.css doc-icon.* */
const DOC_ICONS = {
  pdf: { bg: 'rgba(79,70,229,0.08)', border: 'rgba(79,70,229,0.15)', stroke: '#4F46E5' },
  ppt: { bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.15)', stroke: '#06B6D4' },
  docx: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.15)', stroke: '#22C55E' },
};

function DocTypeIcon({ type }) {
  const c = DOC_ICONS[type] || DOC_ICONS.pdf;
  return (
    <div style={{ width: 40, height: 40, borderRadius: 11, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <FileText size={16} strokeWidth={1.6} color={c.stroke} />
    </div>
  );
}

/* ── Form field arrays for view / edit modes ── */
const PERSONAL_FIELDS = [
  { key: 'name', label: 'Full Name', type: 'text', icon: FileText, placeholder: 'Your full name' },
  { key: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'you@example.com' },
  { key: 'phone', label: 'Phone', type: 'tel', icon: Phone, placeholder: '+1 (555) 000-0000' },
  { key: 'location', label: 'Location', type: 'text', icon: MapPin, placeholder: 'City, Country' },
];

const PERSONAL_VIEW = [
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'phone', label: 'Phone', icon: Phone },
  { key: 'location', label: 'Location', icon: MapPin },
];

const ACADEMIC_FIELDS = [
  { key: 'university', label: 'University / Institution', type: 'text', icon: GraduationCap, placeholder: 'University name' },
  { key: 'field', label: 'Field of Study', type: 'text', icon: BookOpen, placeholder: 'e.g. Computer Science' },
  { key: 'level', label: 'Current Level', type: 'text', icon: Target, placeholder: 'e.g. Undergraduate — 3rd Year' },
  { key: 'goal', label: 'Study Goal', type: 'text', icon: Target, placeholder: 'e.g. Exam Preparation' },
];

const ACADEMIC_VIEW = [
  { key: 'university', label: 'University', icon: GraduationCap },
  { key: 'field', label: 'Field', icon: BookOpen },
  { key: 'level', label: 'Level', icon: Target },
  { key: 'goal', label: 'Goal', icon: Target },
];

/* ============================================================
   PROFILE PAGE
   ============================================================ */
export default function ProfilePage() {
  const { user } = useAuth();
  const [docCount, setDocCount] = useState(0);

  const INITIAL = {
    name: user?.name || 'User',
    email: user?.email || '',
    phone: '',
    location: '',
    university: '',
    field: '',
    level: '',
    goal: '',
    bio: '',
  };

  const saved = INITIAL;

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await apiFetch('/api/documents');
        if (res.ok) {
          const data = await res.json();
          setDocCount(data.documents ? data.documents.length : 0);
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (user) fetchCount();
  }, [user]);

  const stats = PROFILE_STATS.map(s => 
    s.title === 'Documents Uploaded' ? { ...s, value: docCount.toString() } : s
  );

  // Editing disabled since no backend endpoint exists
  const isEditing = false;

  /* ── Info row (view mode) ── */
  function InfoRow({ icon: Icon, label, value }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={14} strokeWidth={1.8} color="#6B7280" />
        </div>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#9AA1AE', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)', marginTop: 2 }}>{value || '—'}</div>
        </div>
      </div>
    );
  }

  /* ── Form field (edit mode) ── */
  function FieldRow({ f }) {
    const FIcon = f.icon;
    return (
      <div className="form-group">
        <label htmlFor={`prof-${f.key}`} className="form-label">{f.label}</label>
        <div className="input-wrap">
          <span className="input-icon">
            <FIcon size={15} strokeWidth={1.8} color="#9AA1AE" />
          </span>
          <input
            id={`prof-${f.key}`}
            type={f.type}
            className="auth-input"
            placeholder={f.placeholder}
            value={form[f.key]}
            onChange={field(f.key)}
          />
        </div>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <>
      {/* Page head */}
      <div className="page-head">
        <div>
          <h1>My Profile</h1>
          <p>Manage your personal information and academic details.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Editing currently unavailable</span>
        </div>
      </div>

      {/* Profile header card */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: 20, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
              {saved.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>

          {/* Identity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text)', margin: 0 }}>
                {saved.name}
              </h2>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'rgba(79,70,229,0.09)', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(79,70,229,0.18)' }}>
                Pro Monthly
              </span>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '5px 0 0' }}>
              StudySmart User
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={12} strokeWidth={1.8} />
              Member
            </p>
          </div>
        </div>

        {saved.bio && (
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 18, lineHeight: 1.65, maxWidth: 600, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
            {saved.bio}
          </p>
        )}
      </div>

      {/* Stat grid — reuse StatCard */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
      </div>

      {/* 2-column layout */}
      <div className="grid-2col">

        {/* LEFT — Personal + Academic info */}
        <div>
          {/* Personal Information */}
          <div className="panel">
            <div className="panel-head">
              <h3>Personal Information</h3>
            </div>

            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {PERSONAL_FIELDS.map(f => <FieldRow key={f.key} f={f} />)}
                <div className="form-group">
                  <label htmlFor="prof-bio" className="form-label">Bio</label>
                  <textarea
                    id="prof-bio"
                    className="auth-input"
                    style={{ paddingLeft: 14, paddingTop: 10, height: 90, resize: 'vertical' }}
                    placeholder="A short bio about yourself…"
                    value={form.bio}
                    onChange={field('bio')}
                  />
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 4 }}>
                {PERSONAL_VIEW.map(item => (
                  <InfoRow key={item.key} icon={item.icon} label={item.label} value={saved[item.key]} />
                ))}
                <div style={{ paddingTop: 14 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#9AA1AE', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Bio</div>
                  <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.65 }}>{saved.bio || '—'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Academic Information */}
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-head">
              <h3>Academic Information</h3>
            </div>

            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {ACADEMIC_FIELDS.map(f => <FieldRow key={f.key} f={f} />)}
              </div>
            ) : (
              <div style={{ marginTop: 4 }}>
                {ACADEMIC_VIEW.map(item => (
                  <InfoRow key={item.key} icon={item.icon} label={item.label} value={saved[item.key]} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Recent Activity */}
        <div>
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-head">
              <h3>Recent Activity</h3>
              <span className="link">View all</span>
            </div>

            {RECENT_ACTIVITY.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 13.5 }}>Activity history will be available soon.</p>
              </div>
            ) : (
              RECENT_ACTIVITY.map((item, i) => (
                <div key={i} className="doc-row">
                  <DocTypeIcon type={item.type} />
                  <div className="doc-info">
                    <div className="doc-name">{item.name}</div>
                    <div className="doc-meta">{item.meta}</div>
                  </div>
                  <span className={`doc-tag ${item.tagClass}`}>{item.tag}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </>
  );
}
