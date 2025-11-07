import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireApproval?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireApproval = true 
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

  if (requireApproval && !user.approved && user.role === 'user') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-soft p-8 text-center">
          <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Pending Approval</h2>
          <p className="text-gray-600 mb-6">
            Your account is currently under review. You'll receive an email notification once approved by our administrators.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full"
            >
              Check Status
            </button>
            <button
              onClick={() => useAuthStore.getState().logout()}
              className="btn-outline w-full"
            >
              Logout
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Need help? Contact support at{' '}
            <a href="mailto:support@tuma-africa-cargo.com" className="text-primary-600 hover:text-primary-700">
              support@tuma-africa-cargo.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;