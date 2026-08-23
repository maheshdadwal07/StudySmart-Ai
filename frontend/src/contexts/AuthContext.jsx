import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, setAccessToken } from '../api/client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await apiFetch('/api/auth/refresh', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.access_token);
          
          // Fetch user info
          const userRes = await apiFetch('/api/auth/me');
          if (userRes.ok) {
            const userData = await userRes.json();
            setUser(userData);
          }
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errorData = await res.json();
      let errorMsg = 'Login failed';
      if (typeof errorData.detail === 'string') {
        errorMsg = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMsg = errorData.detail.map(e => e.msg).join(', ');
      } else if (errorData.detail && typeof errorData.detail === 'object') {
        if (errorData.detail.error_type === 'email_unverified') {
          throw new Error('UNVERIFIED_EMAIL');
        }
        errorMsg = errorData.detail.message || errorData.detail.error || 'Login failed';
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    setAccessToken(data.access_token);

    // Fetch user info
    const userRes = await apiFetch('/api/auth/me');
    if (userRes.ok) {
      const userData = await userRes.json();
      setUser(userData);
    }
  };

  const register = async (name, email, password) => {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    if (!res.ok) {
      const errorData = await res.json();
      let errorMsg = 'Registration failed';
      if (typeof errorData.detail === 'string') {
        errorMsg = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMsg = errorData.detail.map(e => e.msg).join(', ');
      }
      throw new Error(errorMsg);
    }

    // Do NOT auto-login after successful registration.
    // The component should handle redirecting to the verification page.
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
