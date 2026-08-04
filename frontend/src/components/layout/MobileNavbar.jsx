import React from 'react';
import { Menu } from 'lucide-react';
import SearchBar from '../common/SearchBar';

export default function MobileNavbar({ onMenuClick }) {
  return (
    <div className="mobile-topbar">
      <button className="icon-btn" aria-label="Open menu" onClick={onMenuClick}>
        <Menu size={18} stroke="#111827" strokeWidth={1.8} />
      </button>
      <SearchBar placeholder="Search documents..." />
    </div>
  );
}
