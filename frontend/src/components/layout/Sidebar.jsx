import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../api/client';
import { sidebarItems, accountItems } from '../../data/dashboardData';
import { LogOut } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [docCount, setDocCount] = React.useState(0);

  React.useEffect(() => {
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

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
    navigate('/login');
  };

  const renderNavItems = (items) => {
    return items.map((item, idx) => {
      // In a real app we'd compare location.pathname to item.route.
      // Here we rely on isActive property from data, or fallback to exact match.
      const isActive = item.isActive || location.pathname === item.route;
      const Icon = item.icon;

      return (
        <Link
          key={idx}
          to={item.route}
          className={`nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Icon size={18} strokeWidth={1.7} />
          {item.title}
          {item.title === 'Uploads' && docCount > 0 ? (
            <span className="badge-count">{docCount}</span>
          ) : item.badge && item.title !== 'Uploads' ? (
            <span className="badge-count">{item.badge}</span>
          ) : null}
        </Link>
      );
    });
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
      <div className="sidebar-brand">
        <div className="logo-mark">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M4 4h11l5 5v11a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M9 12h6M9 16h6M9 8h2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        StudySmart AI
      </div>

      <nav className="sidebar-nav">
        {renderNavItems(sidebarItems)}

        <div className="nav-section-label">Account</div>
        {renderNavItems(accountItems)}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="nav-item" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}>
          <LogOut size={18} strokeWidth={1.7} />
          Logout
        </button>
        <div className="sidebar-user">
          <div className="avatar">{user?.name?.substring(0, 2).toUpperCase() || 'U'}</div>
          <div>
            <div className="name">{user?.name || 'User'}</div>
            <div className="plan">Pro Monthly plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
