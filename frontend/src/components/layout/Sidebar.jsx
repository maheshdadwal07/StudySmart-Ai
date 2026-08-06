import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { sidebarItems, accountItems } from '../../data/dashboardData';
import { LogOut } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

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
          {item.badge && <span className="badge-count">{item.badge}</span>}
        </Link>
      );
    });
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
      <div className="sidebar-brand">
        <div className="logo-mark">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M4 4h11l5 5v11a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M9 12h6M9 16h6M9 8h2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
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
        <Link to="/login" className="nav-item">
          <LogOut size={18} strokeWidth={1.7} />
          Logout
        </Link>
        <div className="sidebar-user">
          <div className="avatar">AR</div>
          <div>
            <div className="name">Aarav Rao</div>
            <div className="plan">Pro Monthly plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
