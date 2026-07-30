import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HospitalsPage from './pages/HospitalsPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PatientsPage from './pages/PatientsPage.jsx';
import RoomsPage from './pages/RoomsPage.jsx';
import StaffPage from './pages/StaffPage.jsx';
import IVFluidsPage from './pages/IVFluidsPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import SecurityPage from './pages/SecurityPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';

const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    <Route
      path="/hospitals"
      element={
        <ProtectedRoute roles={['super_admin']}>
          <HospitalsPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/dashboard"
      element={
        <ProtectedRoute roles={['admin', 'doctor', 'nurse', 'staff']}>
          <DashboardPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/patients"
      element={
        <ProtectedRoute roles={['admin', 'doctor', 'nurse']}>
          <PatientsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/rooms"
      element={
        <ProtectedRoute roles={['admin']}>
          <RoomsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/staff"
      element={
        <ProtectedRoute roles={['admin']}>
          <StaffPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/iv-fluids"
      element={
        <ProtectedRoute roles={['admin', 'doctor', 'nurse', 'staff']}>
          <IVFluidsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/tasks"
      element={
        <ProtectedRoute roles={['admin', 'doctor', 'nurse', 'staff']}>
          <TasksPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/reports"
      element={
        <ProtectedRoute roles={['admin', 'doctor', 'nurse']}>
          <ReportsPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/security"
      element={
        <ProtectedRoute roles={['super_admin', 'admin', 'doctor', 'nurse', 'staff']}>
          <SecurityPage />
        </ProtectedRoute>
      }
    />

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default App;
