import React, { useState, useEffect, useRef } from 'react';
import { Bell, ChevronDown, User, Settings, LogOut, FileText, Play, HelpCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../common/SearchBar';
import { apiFetch } from '../../api/client';
import { useClickOutside } from '../../hooks/useClickOutside';

export default function TopNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useClickOutside(notifRef, () => setShowNotifications(false));
  useClickOutside(profileRef, () => setShowProfile(false));

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const res = await apiFetch('/api/dashboard/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items || []);
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleNotifClick = () => {
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNotifIcon = (type) => {
    if (type === 'document') return <FileText size={16} className="text-blue-500" />;
    if (type === 'study') return <Play size={16} className="text-green-500" />;
    if (type === 'quiz') return <HelpCircle size={16} className="text-purple-500" />;
    return <Bell size={16} className="text-gray-500" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins || 1}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="topnav">
      <SearchBar placeholder="Search documents, notes, questions..." />

      <div className="topnav-right">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button className="icon-btn" aria-label="Notifications" onClick={handleNotifClick}>
            <Bell size={18} stroke="#374151" strokeWidth={1.7} />
            {notifications.length > 0 && <span className="dot"></span>}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden" style={{ top: '48px' }}>
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">No new notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer flex gap-3 items-start"
                      onClick={() => {
                        setShowNotifications(false);
                        navigate(notif.url);
                      }}
                    >
                      <div className="mt-1 p-2 rounded-full bg-gray-100 flex-shrink-0">
                        {getNotifIcon(notif.type)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{notif.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{notif.description}</div>
                        <div className="text-[10px] text-gray-400 mt-1">{formatDate(notif.timestamp)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <div className="topnav-profile" onClick={() => setShowProfile(!showProfile)}>
            <div className="avatar">{user?.name?.substring(0, 2).toUpperCase() || 'U'}</div>
            <ChevronDown size={14} stroke="#6B7280" strokeWidth={2} />
          </div>
          
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden py-1" style={{ top: '48px' }}>
              <div className="px-4 py-2 mb-1 border-b border-gray-100">
                <div className="text-sm font-semibold text-gray-800 truncate">{user?.name || 'User'}</div>
                <div className="text-xs text-gray-500 truncate">{user?.email || ''}</div>
              </div>
              <button 
                onClick={() => { setShowProfile(false); navigate('/profile'); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <User size={14} /> Profile
              </button>
              <button 
                onClick={() => { setShowProfile(false); navigate('/settings'); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Settings size={14} /> Settings
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
