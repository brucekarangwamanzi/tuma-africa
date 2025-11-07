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
  Plus
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface DashboardStats {
  orderStats: Array<{
    _id: string;
    count: number;
    totalValue: number;
  }>;
  recentOrders: Array<{
    _id: string;
    orderId: string;
    productName: string;
    status: string;
    finalAmount: number;
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
    return stats?.orderStats.reduce((total, stat) => total + stat.totalValue, 0) || 0;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your orders and account
          </p>
        </div>

        {/* Account Status Alert */}
        {!user?.approved && (
          <div className="mb-8 bg-warning-50 border border-warning-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-warning-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-warning-800">
                  Account Pending Approval
                </h3>
                <p className="text-sm text-warning-700 mt-1">
                  Your account is currently under review. You'll be notified once approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-soft p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.orderStats.reduce((total, stat) => total + stat.count, 0) || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-soft p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getOrderStatusCount('delivered')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-soft p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getOrderStatusCount('pending')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-soft p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${getTotalOrderValue().toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-soft">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                  <Link to="/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    View All
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentOrders.map((order) => (
                      <div key={order._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900 truncate">
                              {order.productName}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Order #{order.orderId}</span>
                            <span>${order.finalAmount.toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-600 mb-4">Start by placing your first order</p>
                    <Link to="/orders/new" className="btn-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Place Order
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Messages */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-soft p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/orders/new"
                  className="flex items-center p-3 text-left w-full rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                    <Plus className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Place New Order</p>
                    <p className="text-sm text-gray-600">Order products from Asia</p>
                  </div>
                </Link>

                <Link
                  to="/products"
                  className="flex items-center p-3 text-left w-full rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center mr-3">
                    <ShoppingBag className="h-5 w-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Browse Products</p>
                    <p className="text-sm text-gray-600">Explore our catalog</p>
                  </div>
                </Link>

                <Link
                  to="/chat"
                  className="flex items-center p-3 text-left w-full rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center mr-3">
                    <MessageCircle className="h-5 w-5 text-success-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">Support Chat</p>
                      {stats && stats.unreadMessages > 0 && (
                        <span className="bg-error-500 text-white text-xs rounded-full px-2 py-1">
                          {stats.unreadMessages}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Get help from our team</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-lg shadow-soft p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Info</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Member since</span>
                  <span className="font-medium text-gray-900">
                    {stats?.user.joinDate ? new Date(stats.user.joinDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Status</span>
                  <span className={`font-medium ${user?.approved ? 'text-success-600' : 'text-warning-600'}`}>
                    {user?.approved ? 'Approved' : 'Pending Approval'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email Verified</span>
                  <span className={`font-medium ${user?.verified ? 'text-success-600' : 'text-warning-600'}`}>
                    {user?.verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  to="/profile"
                  className="btn-outline w-full text-center"
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