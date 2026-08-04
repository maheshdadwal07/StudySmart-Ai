import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing/Landing'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './pages/Dashboard/Dashboard'
import StudyMode from './pages/StudyMode/StudyMode'
import QuestionMode from './pages/QuestionMode/QuestionMode'

function App() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* Protected Dashboard Routes */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      {/* Standalone Workspace Routes (No Sidebar) */}
      <Route path="/study-mode" element={<StudyMode />} />
      <Route path="/question-mode" element={<QuestionMode />} />
    </Routes>
  )
}

export default App
