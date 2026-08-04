import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing/Landing'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './pages/Dashboard/Dashboard'

function App() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* Protected Dashboard Routes (simulated for now) */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Future routes will go here, e.g. <Route path="/study-mode" ... /> */}
      </Route>
    </Routes>
  )
}

export default App
