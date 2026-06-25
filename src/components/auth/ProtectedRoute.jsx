import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen text-teal-600">Loading...</div>; // Could replace with a spinner component
    }

    if (!isAuthenticated) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
        // Redirect if role is not authorized
        // We can redirect to their respective dashboard based on role, or just to home
        if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
        if (user.role === 'doctor') return <Navigate to="/doctor-dashboard" replace />;
        if (user.role === 'patient') return <Navigate to="/patient-dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
