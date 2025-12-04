import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Package, 
  Search, 
  Filter, 
  Eye,
  Edit,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Users,
  DollarSign,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { useOrderStore, getOrderId } from '../../store/orderStore';
import { formatDistanceToNow } from 'date-fns';
import OrderStatusChart from '../../components/admin/OrderStatusChart';
import OrderTimelineChart from '../../components/admin/OrderTimelineChart';

const AdminOrderManagementPage: React.FC = () => {
  const {
    orders,
    pagination,
    isLoading,
    fetchOrders,
    updateOrderStatus
  } = useOrderStore();

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
    cancelled: 0,
    totalValue: 0,
    avgOrderValue: 0
  });

  useEffect(() => {
    loadOrders();
  }, [searchParams]);

  useEffect(() => {
    // Calculate stats when orders change
    if (orders.length > 0) {
      const total = orders.length;
      const pending = orders.filter(o => o.status === 'pending').length;
      const processing = orders.filter(o => o.status === 'processing').length;
      const shipped = orders.filter(o => o.status === 'shipped').length;
      const delivered = orders.filter(o => o.status === 'delivered').length;
      const cancelled = orders.filter(o => o.status === 'cancelled').length;
      const totalValue = orders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
      const avgOrderValue = total > 0 ? totalValue / total : 0;
      
      setStats({ total, pending, processing, shipped, delivered, cancelled, totalValue, avgOrderValue });
    }
  }, [orders]);

  const loadOrders = async () => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter) params.set('status', statusFilter);
    if (priorityFilter) params.set('priority', priorityFilter);
    params.set('page', searchParams.get('page') || '1');
    params.set('limit', '20');

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

  const handleStatusUpdate = async (orderId: string, newStatus: string, orderNumber: string) => {
    if (window.confirm(`Update order ${orderNumber} status to ${newStatus}?`)) {
      await updateOrderStatus(orderId, newStatus);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800',
        icon: <Clock className="w-3 h-3" />
      },
      processing: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800',
        icon: <RefreshCw className="w-3 h-3" />
      },
      shipped: { 
        bg: 'bg-purple-100', 
        text: 'text-purple-800',
        icon: <Truck className="w-3 h-3" />
      },
      delivered: { 
        bg: 'bg-green-100', 
        text: 'text-green-800',
        icon: <CheckCircle className="w-3 h-3" />
      },
      cancelled: { 
        bg: 'bg-red-100', 
        text: 'text-red-800',
        icon: <AlertCircle className="w-3 h-3" />
      }
    };
    
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: null };
    
    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
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

  if (isLoading && !orders.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center mb-4 lg:mb-0">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl mr-4">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Order Management</h1>
                <p className="mt-2 text-lg text-gray-600">
                  Track and manage all customer orders with visual analytics
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={loadOrders}
                className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Shipped</p>
                <p className="text-2xl font-bold text-purple-600">{stats.shipped}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">${(stats.totalValue || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order</p>
                <p className="text-2xl font-bold text-indigo-600">${(stats.avgOrderValue || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Order Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <PieChart className="w-6 h-6 text-blue-600 mr-3" />
                Order Status Distribution
              </h2>
            </div>
            <OrderStatusChart stats={stats} />
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <BarChart3 className="w-6 h-6 text-green-600 mr-3" />
                Order Timeline (Last 7 Days)
              </h2>
            </div>
            <OrderTimelineChart orders={orders} />
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by order ID, customer name, or product..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-3 py-3 border border-gray-300">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      handleFilterChange('status', e.target.value);
                    }}
                    className="border-none focus:ring-0 focus:outline-none bg-transparent text-sm font-medium"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-3 py-3 border border-gray-300">
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  <select
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value);
                      handleFilterChange('priority', e.target.value);
                    }}
                    className="border-none focus:ring-0 focus:outline-none bg-transparent text-sm font-medium"
                  >
                    <option value="">All Priority</option>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="text-center py-16 px-6">
                <div className="bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No orders found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {searchQuery || statusFilter || priorityFilter
                    ? 'Try adjusting your search or filters to find what you\'re looking for'
                    : 'No orders have been placed yet'}
                </p>
                {(searchQuery || statusFilter || priorityFilter) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('');
                      setPriorityFilter('');
                      setSearchParams({});
                    }}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {orders.map((order) => (
                <div key={getOrderId(order)} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col">
                  <div className="p-4 flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Package className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 truncate max-w-[120px]">
                            {order.orderId}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        {getStatusBadge(order.status)}
                        {getPriorityBadge(order.priority)}
                      </div>
                    </div>
                    
                    {/* Customer Information */}
                    {(order.userId || (order as any).user) && (
                      <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
                        <div className="flex items-start space-x-2">
                          <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-blue-900 uppercase mb-1.5">
                              Customer Information
                            </p>
                            <p className="text-sm font-bold text-gray-900 truncate mb-2">
                              {(order.userId || (order as any).user)?.fullName || 'Unknown Customer'}
                            </p>
                            {((order.userId || (order as any).user)?.email) && (
                              <div className="flex items-center space-x-1.5 mb-1">
                                <Mail className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                <p className="text-xs text-gray-700 truncate">
                                  {(order.userId || (order as any).user)?.email}
                                </p>
                              </div>
                            )}
                            {((order.userId || (order as any).user)?.phone) && (
                              <div className="flex items-center space-x-1.5">
                                <Phone className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                <p className="text-xs text-gray-700 truncate">
                                  {(order.userId || (order as any).user)?.phone}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Product Name */}
                    <div className="mb-3">
                      <h4 className="font-semibold text-sm text-gray-900 truncate" title={order.productName}>
                        {order.productName}
                      </h4>
                      {order.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1">{order.description}</p>
                      )}
                    </div>
                    
                    {/* Order Details - 4 columns in card */}
                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-xs">Qty</p>
                        <p className="font-semibold text-gray-900">{order.quantity}</p>
                      </div>
                      
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-xs">Unit</p>
                        <p className="font-semibold text-gray-900">${(order.unitPrice || 0).toLocaleString()}</p>
                      </div>
                      
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-xs">Ship</p>
                        <p className="font-semibold text-gray-900">${(order.shippingCost || 0).toLocaleString()}</p>
                      </div>
                      
                      <div className="p-2 bg-green-50 rounded-lg">
                        <p className="text-green-600 text-xs font-medium">Total</p>
                        <p className="font-bold text-green-700">${(order.finalAmount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {/* Tracking Info */}
                    {order.trackingInfo?.trackingNumber && (
                      <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-blue-900 truncate">
                              {order.trackingInfo.trackingNumber}
                            </p>
                            <p className="text-xs text-blue-700 truncate">
                              {order.trackingInfo.carrier}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions Footer */}
                  <div className="p-4 pt-0 border-t border-gray-100 space-y-2">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(getOrderId(order), e.target.value, order.orderId)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs font-medium"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    
                    <div className="flex space-x-2">
                      <Link
                        to={`/admin/orders/${getOrderId(order)}`}
                        className="flex-1 flex items-center justify-center px-2 py-1.5 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Link>
                      
                      <Link
                        to={`/admin/orders/${getOrderId(order)}/edit`}
                        className="flex-1 flex items-center justify-center px-2 py-1.5 text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-xs font-medium"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center space-x-1 bg-white rounded-xl shadow-sm border border-gray-200 p-2">
              {pagination.hasPrev && (
                <Link
                  to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pagination.current - 1) })}`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Previous
                </Link>
              )}
              
              <div className="flex items-center space-x-1 px-4">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === pagination.current;
                  
                  return (
                    <Link
                      key={pageNum}
                      to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pageNum) })}`}
                      className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
              </div>
              
              <div className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg">
                Page {pagination.current} of {pagination.pages}
              </div>
              
              {pagination.hasNext && (
                <Link
                  to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pagination.current + 1) })}`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
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

export default AdminOrderManagementPage;