import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import SearchBar from '../common/SearchBar';
import { Menu } from 'lucide-react';
import '../../styles/dashboard.css';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile overlay */}
      <div 
        className={`overlay ${sidebarOpen ? 'show' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      ></div>
      
      <div className="main">
        {/* Mobile Navbar integrated here */}
        <div className="mobile-topbar">
          <button className="icon-btn" aria-label="Open menu" onClick={() => setSidebarOpen(true)}>
            <Menu size={18} stroke="#111827" strokeWidth={1.8} />
          </button>
          <SearchBar placeholder="Search documents..." />
        </div>
        
        <TopNavbar />
        
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
