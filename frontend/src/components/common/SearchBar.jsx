import React from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ placeholder, className = '' }) {
  return (
    <div className={`search-box ${className}`}>
      <Search size={16} color="#9AA1AE" strokeWidth={1.8} />
      <input type="text" placeholder={placeholder} />
      {/* If it's the main topnav search, we show the kbd shortcut. We can toggle this via props if needed. */}
      {placeholder.includes('notes') && <span className="kbd">⌘K</span>}
    </div>
  );
}
