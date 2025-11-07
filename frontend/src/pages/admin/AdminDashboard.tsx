import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAdminStore } from '../../store/adminStore';
import { useAuthStore } from '../../store/authStore';

// Components
import DashboardStats from '../../components/admin/DashboardStats';
import RecentOrders from '../../components/admin/RecentOrders';
import AnalyticsChart from '../../components/admin/AnalyticsChart';

import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Icons
import { RefreshCw, Settings, Users, Package } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    stats,
    recentOrders,
    chartData,
    isLoadingDashboard,
    error,
    fetchDashboardData,
    clearError
  } = useAdminStore();

  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleViewOrder = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const handleEditOrder = (orderId: string) => {
    navigate(`/admin/orders/${orderId}/edit`);
  };

  const handleRefresh = () => {
    fetchDashboardData();
    toast.success('Dashboard data refreshed');
  };

  if (isLoadingDashboard && !stats) {
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Welcome back, {user?.fullName}! Here's what's happening with your business.
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={isLoadingDashboard}
                className="btn-secondary flex items-center"
              >
                <RefreshCw 
                  className={`w-4 h-4 mr-2 ${isLoadingDashboard ? 'animate-spin' : ''}`} 
                />
                Refresh
              </button>
              
              {user?.role === 'super_admin' && (
                <button
                  onClick={() => navigate('/admin/settings')}
                  className="btn-primary flex items-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => navigate('/admin/users')}
            className="card hover:shadow-lg transition-shadow duration-200"
          >
            <div className="card-body flex items-center">
              <Users className="w-8 h-8 text-blue-500 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Manage Users</p>
                <p className="text-sm text-gray-600">View and approve users</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => navigate('/admin/orders')}
            className="card hover:shadow-lg transition-shadow duration-200"
          >
            <div className="card-body flex items-center">
              <Package className="w-8 h-8 text-green-500 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Manage Orders</p>
                <p className="text-sm text-gray-600">Track and update orders</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => navigate('/admin/products')}
            className="card hover:shadow-lg transition-shadow duration-200"
          >
            <div className="card-body flex items-center">
              <Package className="w-8 h-8 text-purple-500 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Manage Products</p>
                <p className="text-sm text-gray-600">Add and edit products</p>
              </div>
            </div>
          </button>
        </div>

        {/* Chat Management Quick Action */}
        <div className="mt-4">
          <button
            onClick={() => navigate('/admin/chats')}
            className="w-full card hover:shadow-lg transition-shadow duration-200 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200"
          >
            <div className="card-body flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Chat Management</p>
                  <p className="text-sm text-gray-600">View and respond to customer messages</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                  New
                </span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>



        {/* Dashboard Stats */}
        {stats && <DashboardStats stats={stats} />}

        {/* Analytics and Recent Orders */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Analytics Chart */}
          <div className="xl:col-span-2">
            {chartData && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Analytics
                  </h2>
                  <div className="flex space-x-2">
                    {(['week', 'month', 'year'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setChartPeriod(period)}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          chartPeriod === period
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <AnalyticsChart data={chartData} period={chartPeriod} />
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="xl:col-span-1">
            <RecentOrders
              orders={recentOrders.slice(0, 5)} // Show only 5 recent orders
              onViewOrder={handleViewOrder}
              onEditOrder={handleEditOrder}
            />
          </div>
        </div>

        {/* Full Recent Orders Table */}
        {recentOrders.length > 5 && (
          <div className="mt-8">
            <RecentOrders
              orders={recentOrders}
              onViewOrder={handleViewOrder}
              onEditOrder={handleEditOrder}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;