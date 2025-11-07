import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Package, 
  ArrowLeft, 
  Edit, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  User, 
  Phone, 
  Mail, 
  DollarSign,
  Calendar,
  FileText
} from 'lucide-react';
import { useOrderStore } from '../../store/orderStore';
import { formatDistanceToNow } from 'date-fns';

const AdminOrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { orders, isLoading, fetchOrders, updateOrderStatus } = useOrderStore();
  
  const [order, setOrder] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (orderId) {
      // Try to find order in current orders first
      const existingOrder = orders.find(o => o._id === orderId);
      if (existingOrder) {
        setOrder(existingOrder);
      } else {
        // If not found, fetch orders (this will get all orders)
        fetchOrders(new URLSearchParams());
      }
    }
  }, [orderId, orders, fetchOrders]);

  useEffect(() => {
    // Update order when orders change
    if (orderId && orders.length > 0) {
      const foundOrder = orders.find(o => o._id === orderId);
      if (foundOrder) {
        setOrder(foundOrder);
      }
    }
  }, [orderId, orders]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order || !orderId) return;
    
    if (window.confirm(`Update order ${order.orderId} status to ${newStatus}?`)) {
      setIsUpdating(true);
      try {
        await updateOrderStatus(orderId, newStatus);
        setOrder({ ...order, status: newStatus });
      } catch (error) {
        console.error('Failed to update order status:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800',
        icon: <Clock className="w-4 h-4" />
      },
      processing: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800',
        icon: <RefreshCw className="w-4 h-4" />
      },
      shipped: { 
        bg: 'bg-purple-100', 
        text: 'text-purple-800',
        icon: <Truck className="w-4 h-4" />
      },
      delivered: { 
        bg: 'bg-green-100', 
        text: 'text-green-800',
        icon: <CheckCircle className="w-4 h-4" />
      },
      cancelled: { 
        bg: 'bg-red-100', 
        text: 'text-red-800',
        icon: <AlertCircle className="w-4 h-4" />
      }
    };
    
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: null };
    
    return (
      <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  if (isLoading && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Order not found</h3>
          <p className="text-gray-600 mb-8">The order you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/admin/orders"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/orders')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
                <p className="text-gray-600 mt-1">Order ID: {order.orderId}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                to={`/admin/orders/${order._id}/edit`}
                className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Order
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Order Status</h2>
                {getStatusBadge(order.status)}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Update Status
                  </label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={isUpdating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      order.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      order.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.priority?.charAt(0).toUpperCase() + order.priority?.slice(1) || 'Normal'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Information</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{order.productName}</h3>
                  {order.description && (
                    <p className="text-gray-600 mt-1">{order.description}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Quantity</p>
                    <p className="text-lg font-semibold text-gray-900">{order.quantity}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Unit Price</p>
                    <p className="text-lg font-semibold text-gray-900">${(order.unitPrice || 0).toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Shipping</p>
                    <p className="text-lg font-semibold text-gray-900">${(order.shippingCost || 0).toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600">Total</p>
                    <p className="text-lg font-bold text-green-700">${(order.finalAmount || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Information */}
            {order.trackingInfo?.trackingNumber && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Truck className="w-6 h-6 text-blue-600 mr-3" />
                  Tracking Information
                </h2>
                
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">
                        Tracking Number: {order.trackingInfo.trackingNumber}
                      </p>
                      <p className="text-sm text-blue-700">
                        Carrier: {order.trackingInfo.carrier}
                      </p>
                    </div>
                  </div>
                  
                  {order.trackingInfo.estimatedDelivery && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <p className="text-sm text-blue-700">
                        Estimated Delivery: {new Date(order.trackingInfo.estimatedDelivery).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <User className="w-6 h-6 text-blue-600 mr-3" />
                Customer Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Customer Name</p>
                  <p className="font-medium text-gray-900">{(order as any).customerName || 'N/A'}</p>
                </div>
                
                {(order as any).customerEmail && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{(order as any).customerEmail}</p>
                    </div>
                  </div>
                )}
                
                {(order as any).customerPhone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{(order as any).customerPhone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Clock className="w-6 h-6 text-blue-600 mr-3" />
                Order Timeline
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Order Created</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()} • {formatDistanceToNow(new Date(order.createdAt))} ago
                    </p>
                  </div>
                </div>
                
                {order.updatedAt && order.updatedAt !== order.createdAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Last Updated</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.updatedAt).toLocaleDateString()} • {formatDistanceToNow(new Date(order.updatedAt))} ago
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Notes */}
            {(order as any).notes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FileText className="w-6 h-6 text-blue-600 mr-3" />
                  Order Notes
                </h2>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{(order as any).notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;