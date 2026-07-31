import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

// Where a user lands if they hit a route their role can't use. Super admins
// live entirely in /hospitals; patients live in /portal; everyone else has
// a hospital dashboard.
const defaultRouteFor = (role) => {
  if (role === 'super_admin') return '/hospitals';
  if (role === 'patient') return '/portal';
  return '/dashboard';
};

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-mist">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={defaultRouteFor(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
