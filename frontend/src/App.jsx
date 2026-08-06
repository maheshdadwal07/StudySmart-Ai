import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing/Landing'
import LoginPage from './pages/Auth/LoginPage'
import SignUpPage from './pages/Auth/SignUpPage'
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage'
import PricingPage from './pages/Pricing/PricingPage'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './pages/Dashboard/Dashboard'
import ProfilePage from './pages/Profile/ProfilePage'
import SettingsPage from './pages/Settings/SettingsPage'
import HistoryPage from './pages/History/HistoryPage'
import UploadsPage from './pages/Uploads/UploadsPage'
import StudyMode from './pages/StudyMode/StudyMode'
import QuestionMode from './pages/QuestionMode/QuestionMode'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"               element={<Landing />} />
      <Route path="/login"          element={<LoginPage />} />
      <Route path="/signup"         element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
