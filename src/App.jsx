import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext'; // 1. استيراد المزود

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import PatientDashboard from './pages/PatientDashboard';
import Screening from './pages/Screening';
import DoctorDashboard from './pages/DoctorDashboard';
import Appointments from './pages/Appointments';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import HomePage from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import Labs from './pages/Labs';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

function App() {
  return (
    // 2. تغليف التطبيق بالكامل بـ SocketProvider
    <SocketProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<DashboardLayout />}>
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/labs" element={<Labs />} />
          <Route path="/screening" element={<Screening />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
  );
}

export default App;