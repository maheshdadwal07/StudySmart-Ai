import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import SearchBar from "../common/SearchBar";
import { Menu } from "lucide-react";
import "../../styles/dashboard.css";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile overlay */}
      <div
        className={`overlay ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      <div className="main">
        {/* Mobile Navbar integrated here */}
        <div className="mobile-topbar">
          <button
            className="icon-btn"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} stroke="currentColor" strokeWidth={1.8} />
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
