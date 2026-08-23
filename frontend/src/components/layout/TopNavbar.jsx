import React from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import SearchBar from '../common/SearchBar';

export default function TopNavbar() {
  const { user } = useAuth();
  return (
    <div className="topnav">
      <SearchBar placeholder="Search documents, notes, questions..." />

      <div className="topnav-right">
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={18} stroke="#374151" strokeWidth={1.7} />
          <span className="dot"></span>
        </button>
        <div className="topnav-profile">
          <div className="avatar">{user?.name?.substring(0, 2).toUpperCase() || 'U'}</div>
          <ChevronDown size={14} stroke="#6B7280" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
