import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../ui/LoadingSpinner';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin';
}

const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  requiredRole = 'admin' 
}) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  const hasRequiredRole = () => {
    if (requiredRole === 'super_admin') {
      return user.role === 'super_admin';
    }
    return user.role === 'admin' || user.role === 'super_admin';
  };

  if (!hasRequiredRole()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-soft p-8 text-center">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this area. {requiredRole === 'super_admin' ? 'Super admin' : 'Admin'} privileges are required.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="btn-primary w-full"
            >
              Go Back
            </button>
            <button
              onClick={() => useAuthStore.getState().logout()}
              className="btn-outline w-full"
            >
              Logout
            </button>
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Current Role:</strong> {user.role}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Required Role:</strong> {requiredRole === 'super_admin' ? 'Super Admin' : 'Admin or Super Admin'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;