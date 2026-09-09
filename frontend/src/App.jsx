import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Landing from './pages/Landing'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PricingPage from './pages/PricingPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './pages/Dashboard'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import HistoryPage from './pages/HistoryPage'
import UploadsPage from './pages/UploadsPage'
import StudyMode from './pages/StudyMode'
import QuestionMode from './pages/QuestionMode'

function App() {
  const { user } = useAuth();

  useEffect(() => {
    // 1. Apply Theme
    let theme = 'light';
    if (user?.preferences?.theme) {
      theme = user.preferences.theme;
    }
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      
      const listener = (e) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }

    // 2. Apply Font Size
    let fontScale = 1; // Medium
    const fontSizePref = user?.preferences?.fontSize || 'Medium';
    if (fontSizePref === 'Small') fontScale = 0.95;
    else if (fontSizePref === 'Large') fontScale = 1.05;
    
    document.documentElement.style.fontSize = `calc(16px * ${fontScale})`;

  }, [user?.preferences?.theme, user?.preferences?.fontSize]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"               element={<Landing />} />
      <Route path="/login"          element={<LoginPage />} />
      <Route path="/signup"         element={<SignUpPage />} />
      <Route path="/verify-email"   element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/pricing"        element={<PricingPage />} />

      {/* Dashboard routes (shared layout: sidebar + topnav) */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history"   element={<HistoryPage />} />
        <Route path="/uploads"   element={<UploadsPage />} />
        <Route path="/profile"   element={<ProfilePage />} />
        <Route path="/settings"  element={<SettingsPage />} />
      </Route>

      {/* Standalone workspace routes (no sidebar) */}
      <Route path="/study-mode"    element={<StudyMode />} />
      <Route path="/question-mode" element={<QuestionMode />} />
    </Routes>
  )
}

export default App
