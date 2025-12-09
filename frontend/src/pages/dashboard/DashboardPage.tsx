import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  ShoppingBag, 
  MessageCircle, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus,
  Mail
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface DashboardStats {
  orderStats: Array<{
    _id: string;
    count: number;
    totalValue: number | string; // PostgreSQL returns DECIMAL as string
  }>;
  recentOrders: Array<{
    _id: string;
    orderId: string;
    productName: string;
    status: string;
    finalAmount: number | string; // PostgreSQL returns DECIMAL as string
    createdAt: string;
  }>;
  unreadMessages: number;
  activeChats: number;
  user: {
    fullName: string;
    email: string;
    joinDate: string;
    verified: boolean;
    approved: boolean;
  };
}

// Helper function to convert string/number to number and format
const getPriceNumber = (value: number | string | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return 0;
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const formatPrice = (value: number | string | undefined | null): string => {
  try {
    const num = getPriceNumber(value);
    return num.toFixed(2);
  } catch (error) {
    console.error('Error formatting price:', error, value);
    return '0.00';
  }
};

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/users/dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-warning-600 bg-warning-100';
      case 'approved': return 'text-blue-600 bg-blue-100';
      case 'purchased': return 'text-purple-600 bg-purple-100';
      case 'warehouse': return 'text-indigo-600 bg-indigo-100';
      case 'shipped': return 'text-primary-600 bg-primary-100';
      case 'delivered': return 'text-success-600 bg-success-100';
      case 'cancelled': return 'text-error-600 bg-error-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOrderStatusCount = (status: string) => {
    return stats?.orderStats.find(stat => stat._id === status)?.count || 0;
  };

  const getTotalOrderValue = () => {
    return stats?.orderStats.reduce((total, stat) => total + getPriceNumber(stat.totalValue), 0) || 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header - Mobile Optimized */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Here's what's happening with your orders and account
          </p>
        </div>

        {/* Account Status Alerts - Mobile Optimized */}
        {!user?.verified && (
          <div className="mb-4 sm:mb-6 lg:mb-8 bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start sm:items-center">
                <Mail className="h-5 w-5 text-blue-600 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-medium text-blue-800">
                    Email Verification Required
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-700 mt-1">
                    Please check your email and verify your account to access all features.
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    await axios.post('/users/verify-email');
                    toast.success('Verification email sent! Please check your inbox.');
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Failed to send verification email');
                  }
                }}
                className="sm:ml-4 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors touch-manipulation w-full sm:w-auto"
              >
                Resend Email
              </button>
            </div>
          </div>
        )}
        
        {!user?.approved && (
          <div className="mb-4 sm:mb-6 lg:mb-8 bg-warning-50 border border-warning-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex items-start sm:items-center">
              <AlertCircle className="h-5 w-5 text-warning-600 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-warning-800">
                  Account Pending Approval
                </h3>
                <p className="text-xs sm:text-sm text-warning-700 mt-1">
                  Your account is currently under review. You'll be notified once approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats - Mobile Optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Orders</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {stats?.orderStats.reduce((total, stat) => total + stat.count, 0) || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-success-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Delivered</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {getOrderStatusCount('delivered')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-warning-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Pending</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {getOrderStatusCount('pending')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-accent-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Value</p>
                <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                  ${getTotalOrderValue().toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Recent Orders - Mobile Optimized */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Orders</h2>
                  <Link 
                    to="/orders" 
                    className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium touch-manipulation"
                  >
                    View All
                  </Link>
                </div>
              </div>
              
              <div className="p-3 sm:p-4 lg:p-6">
                {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {stats.recentOrders.map((order) => (
                      <Link
                        key={order._id}
                        to={`/orders/${order._id}`}
                        className="block border border-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all duration-200 active:scale-[0.98] touch-manipulation"
                      >
                        <div className="p-3 sm:p-4">
                          {/* Mobile-Optimized Order Card */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Product Name */}
                              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1.5 sm:mb-2 line-clamp-2">
                                {order.productName}
                              </h3>
                              
                              {/* Order Number */}
                              <p className="text-xs sm:text-sm text-gray-500 mb-2">
                                Order #{order.orderId}
                              </p>
                              
                              {/* Date and Price Row */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <p className="text-xs sm:text-sm text-gray-600">
                                  {new Date(order.createdAt).toLocaleDateString('en-US', { 
                                    month: 'numeric', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </p>
                                <p className="text-sm sm:text-base font-bold text-gray-900">
                                  ${formatPrice(order.finalAmount)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Status Badge - Right Side */}
                            <div className="flex-shrink-0">
                              <span className={`inline-flex items-center px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 px-3 sm:px-4">
                    <div className="relative mb-4 sm:mb-6">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full blur-xl opacity-50"></div>
                      </div>
                      <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 mx-auto w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center shadow-lg shadow-primary-500/30">
                        <Package className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">No orders yet</h3>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">
                      Start by placing your first order and experience seamless shipping from China to your doorstep
                    </p>
                    <Link 
                      to="/orders/new" 
                      className="group relative inline-flex items-center justify-center px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 text-sm sm:text-base lg:text-lg font-semibold text-white bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 rounded-lg sm:rounded-xl shadow-lg shadow-primary-500/40 hover:shadow-xl hover:shadow-primary-500/50 transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation overflow-hidden"
                    >
                      {/* Shine effect background */}
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                      
                      {/* Button content */}
                      <span className="relative flex items-center gap-2 sm:gap-3">
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 group-hover:rotate-90 transition-transform duration-300" />
                        <span>Place Order</span>
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Messages - Mobile Optimized */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
              <div className="space-y-2 sm:space-y-3">
                <Link
                  to="/orders/new"
                  className="flex items-center p-3 text-left w-full rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors touch-manipulation active:bg-gray-100"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <Plus className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Place New Order</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Order products from Asia</p>
                  </div>
                </Link>

                <Link
                  to="/products"
                  className="flex items-center p-3 text-left w-full rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors touch-manipulation active:bg-gray-100"
                >
                  <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <ShoppingBag className="h-5 w-5 text-accent-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Browse Products</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Explore our catalog</p>
                  </div>
                </Link>

                <Link
                  to="/messages"
                  className="flex items-center p-3 text-left w-full rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors touch-manipulation active:bg-gray-100"
                >
                  <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <MessageCircle className="h-5 w-5 text-success-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">Support Chat</p>
                      {stats && stats.unreadMessages > 0 && (
                        <span className="bg-error-500 text-white text-xs rounded-full px-2 py-1 flex-shrink-0 ml-2">
                          {stats.unreadMessages}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Get help from our team</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Account Info - Mobile Optimized */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Account Info</h2>
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600">Member since</span>
                  <span className="font-medium text-gray-900 text-xs sm:text-sm text-right">
                    {stats?.user.joinDate ? new Date(stats.user.joinDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600">Account Status</span>
                  <span className={`font-medium text-xs sm:text-sm ${user?.approved ? 'text-success-600' : 'text-warning-600'}`}>
                    {user?.approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600">Email Verified</span>
                  <span className={`font-medium text-xs sm:text-sm ${user?.verified ? 'text-success-600' : 'text-warning-600'}`}>
                    {user?.verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  to="/profile"
                  className="btn-outline w-full text-center text-sm sm:text-base py-2 sm:py-2.5 touch-manipulation"
                >
                  Manage Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;