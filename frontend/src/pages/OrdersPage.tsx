import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Package, 
  Search, 
  Filter, 
  Eye, 
  Plus,
  Calendar,
  DollarSign,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  ShoppingCart,
  Star
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useOrderStore, getOrderId, Order } from '../store/orderStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface OrdersResponse {
  orders: Order[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const OrdersPage: React.FC = () => {
  const { user } = useAuthStore();
  const { orders, pagination, isLoading, fetchOrders } = useOrderStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    totalValue: 0
  });

  useEffect(() => {
    // Debounce to prevent rapid requests
    const timeoutId = setTimeout(() => {
      loadOrders();
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    // Calculate stats when orders change
    if (orders.length > 0) {
      const total = orders.length;
      const pending = orders.filter((o) => o.status === 'pending').length;
      const processing = orders.filter((o) => o.status === 'processing').length;
      const shipped = orders.filter((o) => o.status === 'shipped').length;
      const delivered = orders.filter((o) => o.status === 'delivered').length;
      const totalValue = orders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
      
      setStats({ total, pending, processing, shipped, delivered, totalValue });
    }
  }, [orders]);

  const loadOrders = async () => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter) params.set('status', statusFilter);
    if (priorityFilter) params.set('priority', priorityFilter);
    params.set('page', searchParams.get('page') || '1');
    params.set('limit', '10');

    await fetchOrders(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleFilterChange = (type: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(type, value);
    } else {
      params.delete(type);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      pending: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800'
      },
      processing: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800'
      },
      shipped: { 
        bg: 'bg-purple-100', 
        text: 'text-purple-800'
      },
      delivered: { 
        bg: 'bg-green-100', 
        text: 'text-green-800'
      },
      cancelled: { 
        bg: 'bg-red-100', 
        text: 'text-red-800'
      }
    };
    
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { bg: string; text: string }> = {
      low: { bg: 'bg-gray-100', text: 'text-gray-800' },
      normal: { bg: 'bg-blue-100', text: 'text-blue-800' },
      high: { bg: 'bg-orange-100', text: 'text-orange-800' },
      urgent: { bg: 'bg-red-100', text: 'text-red-800' }
    };
    
    const config = priorityConfig[priority] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-4 sm:pb-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Mobile-Optimized Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg sm:rounded-xl">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  My Orders
                </h1>
                <p className="hidden sm:block mt-1 text-sm lg:text-base text-gray-600">
                  Track and manage all your orders
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2 sm:space-x-3">
              <button
                onClick={loadOrders}
                className="flex items-center px-3 sm:px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors shadow-sm touch-manipulation"
              >
                <RefreshCw className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <Link
                to="/orders/new"
                className="flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg touch-manipulation"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                <span className="hidden sm:inline">New Order</span>
                <span className="sm:hidden">New</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards - Horizontal Scroll on Mobile */}
        <div className="mb-4 sm:mb-6">
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="p-2 sm:p-3 bg-yellow-100 rounded-full">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Processing</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.processing}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Shipped</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.shipped}</p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-100 rounded-full">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Delivered</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.delivered}</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600">${(stats.totalValue || 0).toLocaleString()}</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters - Mobile Optimized */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 mb-4 sm:mb-6">
          <div className="p-3 sm:p-4 lg:p-6">
            <form onSubmit={handleSearch} className="flex flex-col gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors text-base sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <div className="flex items-center space-x-2 bg-gray-50 rounded-lg sm:rounded-xl px-3 py-2 sm:py-2.5 border border-gray-300 flex-1 min-w-[140px]">
                  <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      handleFilterChange('status', e.target.value);
                    }}
                    className="border-none focus:ring-0 focus:outline-none bg-transparent text-sm font-medium w-full"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2 bg-gray-50 rounded-lg sm:rounded-xl px-3 py-2 sm:py-2.5 border border-gray-300 flex-1 min-w-[140px]">
                  <Star className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <select
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value);
                      handleFilterChange('priority', e.target.value);
                    }}
                    className="border-none focus:ring-0 focus:outline-none bg-transparent text-sm font-medium w-full"
                  >
                    <option value="">All Priority</option>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Orders List - Mobile Optimized */}
        <div className="space-y-3 sm:space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200">
              <div className="text-center py-12 sm:py-16 px-4 sm:px-6">
                <div className="bg-gray-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                  <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">No orders found</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">
                  {searchQuery || statusFilter || priorityFilter
                    ? 'Try adjusting your search or filters to find what you\'re looking for'
                    : 'You haven\'t placed any orders yet. Start shopping to see your orders here!'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {(searchQuery || statusFilter || priorityFilter) && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('');
                        setPriorityFilter('');
                        setSearchParams({});
                      }}
                      className="px-5 sm:px-6 py-2.5 sm:py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg sm:rounded-xl transition-colors touch-manipulation"
                    >
                      Clear Filters
                    </button>
                  )}
                  <Link 
                    to="/orders/new" 
                    className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg touch-manipulation"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2 inline" />
                    <span className="hidden sm:inline">Place Your First Order</span>
                    <span className="sm:hidden">New Order</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {orders.map((order) => (
                <Link
                  key={getOrderId(order)}
                  to={`/orders/${getOrderId(order)}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col"
                >
                  <div className="p-4 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="mb-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Package className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          #{order.orderId}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <div className="flex-shrink-0">
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Product Name */}
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 line-clamp-2 flex-1" title={order.productName}>
                      {order.productName}
                    </h3>
                    
                    {/* Order Details Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-xs">Quantity</p>
                        <p className="font-semibold text-gray-900">{order.quantity}</p>
                      </div>
                      
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-xs">Unit Price</p>
                        <p className="font-semibold text-gray-900">${(order.unitPrice || 0).toLocaleString()}</p>
                      </div>
                      
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-xs">Shipping</p>
                        <p className="font-semibold text-gray-900">${(order.shippingCost || 0).toLocaleString()}</p>
                      </div>
                      
                      <div className="p-2 bg-green-50 rounded-lg">
                        <p className="text-green-600 text-xs font-medium">Total</p>
                        <p className="font-bold text-green-700">${(order.finalAmount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {/* Priority Badge */}
                    {order.priority && (
                      <div className="mb-3">
                        {getPriorityBadge(order.priority)}
                      </div>
                    )}
                    
                    {/* Tracking Info */}
                    {order.trackingInfo?.trackingNumber && (
                      <div className="mt-auto p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-blue-900 truncate">
                              {order.trackingInfo.trackingNumber}
                            </p>
                            {order.trackingInfo.carrier && (
                              <p className="text-xs text-blue-700 truncate">
                                {order.trackingInfo.carrier}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pagination - Mobile Optimized */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-6 sm:mt-8 lg:mt-12 flex justify-center">
            <nav className="flex items-center space-x-1 sm:space-x-2 bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3">
              {pagination.hasPrev && (
                <Link
                  to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pagination.current - 1) })}`}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Link>
              )}
              
              <div className="flex items-center space-x-1 px-2 sm:px-4">
                {Array.from({ length: Math.min(3, pagination.pages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === pagination.current;
                  
                  return (
                    <Link
                      key={pageNum}
                      to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pageNum) })}`}
                      className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-xs sm:text-sm font-medium rounded-lg transition-colors touch-manipulation ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
                
                {pagination.pages > 3 && (
                  <>
                    <span className="px-1 sm:px-2 text-gray-500 text-xs sm:text-sm">...</span>
                    <Link
                      to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pagination.pages) })}`}
                      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                    >
                      {pagination.pages}
                    </Link>
                  </>
                )}
              </div>
              
              <div className="hidden sm:block px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-50 rounded-lg">
                Page {pagination.current} of {pagination.pages}
              </div>
              
              {pagination.hasNext && (
                <Link
                  to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pagination.current + 1) })}`}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                >
                  Next
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;