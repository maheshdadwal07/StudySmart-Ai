import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  FileText,
  Play,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import SearchBar from "../common/SearchBar";
import { apiFetch } from "../../api/client";
import { useClickOutside } from "../../hooks/useClickOutside";

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
      const res = await apiFetch("/api/dashboard/notifications");
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
    navigate("/login");
  };

  const getNotifIcon = (type) => {
    if (type === "document")
      return <FileText size={16} style={{ color: "var(--info-text)" }} />;
    if (type === "study")
      return <Play size={16} style={{ color: "var(--success-text)" }} />;
    if (type === "quiz")
      return <HelpCircle size={16} style={{ color: "var(--primary)" }} />;
    return <Bell size={16} style={{ color: "var(--text-muted)" }} />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
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
          <button
            className="icon-btn"
            aria-label="Notifications"
            onClick={handleNotifClick}
            style={{ color: "var(--text)" }}
          >
            <Bell size={18} stroke="currentColor" strokeWidth={1.7} />
            {notifications.length > 0 && <span className="dot"></span>}
          </button>

          {showNotifications && (
            <div
              className="notifications-dropdown absolute right-0 top-full mt-2 w-80 rounded-xl shadow-lg z-50 overflow-hidden"
              style={{
                top: "48px",
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="px-4 py-3 flex justify-between items-center"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <h3
                  className="font-semibold text-sm"
                  style={{ color: "var(--text)" }}
                >
                  Notifications
                </h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loadingNotifications ? (
                  <div
                    className="p-6 text-center text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Loading...
                  </div>
                ) : notifications.length === 0 ? (
                  <div
                    className="p-6 text-center text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="px-4 py-3 cursor-pointer flex gap-3 items-start notif-item"
                      style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "background-color 0.2s",
                      }}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate(notif.url);
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--surface-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <div
                        className="mt-1 p-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: "var(--surface-muted)" }}
                      >
                        {getNotifIcon(notif.type)}
                      </div>
                      <div>
                        <div
                          className="text-sm font-medium"
                          style={{ color: "var(--text)" }}
                        >
                          {notif.title}
                        </div>
                        <div
                          className="text-xs mt-0.5 line-clamp-1"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {notif.description}
                        </div>
                        <div
                          className="text-[10px] mt-1"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {formatDate(notif.timestamp)}
                        </div>
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
          <div
            className="topnav-profile"
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className="avatar">
              {user?.name?.substring(0, 2).toUpperCase() || "U"}
            </div>
            <ChevronDown size={14} stroke="#6B7280" strokeWidth={2} />
          </div>

          {showProfile && (
            <div
              className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg z-50 overflow-hidden py-1 profile-dropdown"
              style={{
                top: "48px",
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="px-4 py-2 mb-1"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div
                  className="text-sm font-semibold truncate"
                  style={{ color: "var(--text)" }}
                >
                  {user?.name || "User"}
                </div>
                <div
                  className="text-xs truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {user?.email || ""}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowProfile(false);
                  navigate("/profile");
                }}
                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 profile-dropdown-item"
                style={{ color: "var(--text)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--surface-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <User size={14} /> Profile
              </button>
              <button
                onClick={() => {
                  setShowProfile(false);
                  navigate("/settings");
                }}
                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 profile-dropdown-item"
                style={{ color: "var(--text)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--surface-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <Settings size={14} /> Settings
              </button>
              <div
                className="my-1"
                style={{ borderTop: "1px solid var(--border)" }}
              ></div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 font-medium profile-dropdown-item"
                style={{ color: "var(--error-text)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--error-bg)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
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
