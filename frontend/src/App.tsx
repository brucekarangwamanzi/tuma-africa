import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuthStore } from './store/authStore';
import { useSettingsStore } from './store/settingsStore';
import { useTheme } from './hooks/useTheme';
import './styles/theme.css';

// Layout Components
import Navbar from './components/layout/Navbar';



// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';

// Protected Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import NewOrderPage from './pages/NewOrderPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import SuperAdminCMS from './pages/admin/SuperAdminCMS';
import ProductManagementPage from './pages/admin/ProductManagementPage';
import CreateProductPage from './pages/admin/CreateProductPage';
import EditProductPage from './pages/admin/EditProductPage';
import AdminProductDetailPage from './pages/admin/ProductDetailPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import UserDetailPage from './pages/admin/UserDetailPage';
import AdminOrderManagementPage from './pages/admin/AdminOrderManagementPage';
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage';
import AdminOrderEditPage from './pages/admin/AdminOrderEditPage';
import ChatManagementPage from './pages/admin/ChatManagementPage';

// Route Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

function App() {
  const { user, checkAuth } = useAuthStore();
  const { fetchSettings } = useSettingsStore();
  
  // Initialize theme system
  useTheme();

  useEffect(() => {
    // Initialize auth state on app load
    // This will restore persisted auth state and verify tokens
    const initializeApp = async () => {
      // Check if we have persisted auth state
      const authState = useAuthStore.getState();
      
      if (authState.accessToken && authState.refreshToken) {
        // We have tokens, verify them
        await checkAuth();
      } else {
        // No tokens, ensure we're logged out
        useAuthStore.getState().clearAuth();
      }
      
      // Load settings
      fetchSettings();
    };

    initializeApp();
  }, [checkAuth, fetchSettings]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          
          {/* Auth Routes */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
          />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          
          {/* Protected User Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
          <Route path="/orders" element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          } />
          
          <Route path="/orders/new" element={
            <ProtectedRoute>
              <NewOrderPage />
            </ProtectedRoute>
          } />
          
          <Route path="/orders/:orderId" element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          <Route path="/messages" element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          } />
          
          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          
          <Route path="/admin/products" element={
            <AdminRoute>
              <ProductManagementPage />
            </AdminRoute>
          } />
          
          <Route path="/admin/products/new" element={
            <AdminRoute>
              <CreateProductPage />
            </AdminRoute>
          } />
          
          <Route path="/admin/products/:productId" element={
            <AdminRoute>
              <AdminProductDetailPage />
            </AdminRoute>
          } />
          
          <Route path="/admin/products/:productId/edit" element={
            <AdminRoute>
              <EditProductPage />
            </AdminRoute>
          } />
          
          <Route path="/admin/users" element={
            <AdminRoute>
              <UserManagementPage />
            </AdminRoute>
          } />
          
          <Route path="/admin/users/:userId" element={
            <AdminRoute>
              <UserDetailPage />
            </AdminRoute>
          } />
          
          <Route path="/admin/orders" element={
            <AdminRoute>
              <AdminOrderManagementPage />
            </AdminRoute>
          } />
          
          <Route path="/admin/orders/:orderId" element={
            <AdminRoute>
              <AdminOrderDetailPage />
            </AdminRoute>
          } />
          
          <Route path="/admin/orders/:orderId/edit" element={
            <AdminRoute>
              <AdminOrderEditPage />
            </AdminRoute>
          } />
          
          <Route path="/admin/chats" element={
            <AdminRoute>
              <ChatManagementPage />
            </AdminRoute>
          } />
          
          <Route path="/admin/settings" element={
            <AdminRoute requiredRole="super_admin">
              <SuperAdminCMS />
            </AdminRoute>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-gray-600 mb-8">Page not found</p>
                <a href="/" className="btn-primary">
                  Go Home
                </a>
              </div>
            </div>
          } />
        </Routes>
      </main>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default App;