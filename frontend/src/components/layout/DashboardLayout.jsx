import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import MobileNavbar from './MobileNavbar';
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
        <MobileNavbar onMenuClick={() => setSidebarOpen(true)} />
        <TopNavbar />
        
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
