import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PatientsPage from './pages/PatientsPage.jsx';
import RoomsPage from './pages/RoomsPage.jsx';
import StaffPage from './pages/StaffPage.jsx';
import IVFluidsPage from './pages/IVFluidsPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';

const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
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
        <ProtectedRoute roles={['admin', 'doctor', 'nurse', 'support_staff']}>
          <IVFluidsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/tasks"
      element={
        <ProtectedRoute roles={['admin', 'doctor', 'nurse', 'support_staff']}>
          <TasksPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/reports"
      element={
        <ProtectedRoute roles={['admin', 'doctor']}>
          <ReportsPage />
        </ProtectedRoute>
      }
    />

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default App;
