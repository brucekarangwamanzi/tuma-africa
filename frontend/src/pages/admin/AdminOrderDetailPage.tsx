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
  FileText,
  MessageCircle
} from 'lucide-react';
import { useOrderStore, getOrderId } from '../../store/orderStore';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminOrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { currentOrder, isLoading, fetchOrder, updateOrderStatus } = useOrderStore();
  
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId, fetchOrder]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!currentOrder || !orderId) return;
    
    if (window.confirm(`Update order ${currentOrder.orderId} status to ${newStatus}?`)) {
      setIsUpdating(true);
      try {
        await updateOrderStatus(orderId, newStatus);
        // Refetch order to get updated data
        await fetchOrder(orderId);
      } catch (error) {
        console.error('Failed to update order status:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleStartConversation = async () => {
    if (!currentOrder) {
      toast.error('Order information not available');
      return;
    }

    // Extract user ID - handle multiple formats
    let userId: string | null = null;
    let customerName = 'Customer';

    if (currentOrder.userId) {
      // Case 1: userId is a string (direct ID)
      if (typeof currentOrder.userId === 'string') {
        userId = currentOrder.userId;
      }
      // Case 2: userId is an object with id or _id
      else if (typeof currentOrder.userId === 'object') {
        userId = currentOrder.userId.id || currentOrder.userId._id || null;
        customerName = currentOrder.userId.fullName || 'Customer';
      }
    }
    // Case 3: Check if user object exists directly (from backend - Sequelize returns 'user')
    else if ((currentOrder as any).user) {
      const user = (currentOrder as any).user;
      if (typeof user === 'string') {
        userId = user;
      } else if (typeof user === 'object') {
        userId = user.id || user._id || null;
        customerName = user.fullName || 'Customer';
      }
    }

    if (!userId) {
      console.error('Customer ID extraction failed. Order data:', {
        userId: currentOrder.userId,
        user: (currentOrder as any).user,
        orderId: getOrderId(currentOrder)
      });
      toast.error('Customer ID not found. Please refresh the page and try again.');
      return;
    }

    try {
      // Create or find chat with this user
      const response = await axios.post('/chat/admin/create-with-user', {
        userId: userId,
        orderId: getOrderId(currentOrder),
        title: `Support for Order ${currentOrder.orderId} - ${customerName}`
      });

      const { chat } = response.data;
      
      // Navigate to chat management page with the chat ID
      navigate(`/admin/chats?chatId=${chat.id || chat._id}`);
      toast.success('Opening conversation with customer...');
    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      toast.error(error.response?.data?.message || 'Failed to start conversation');
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

  if (isLoading && !currentOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!currentOrder) {
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
                <p className="text-gray-600 mt-1">Order ID: {currentOrder.orderId}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                to={`/admin/orders/${getOrderId(currentOrder)}/edit`}
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
                {getStatusBadge(currentOrder.status)}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Update Status
                  </label>
                  <select
                    value={currentOrder.status}
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
                      currentOrder.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      currentOrder.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      currentOrder.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {currentOrder.priority?.charAt(0).toUpperCase() + currentOrder.priority?.slice(1) || 'Normal'}
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
                  <h3 className="font-semibold text-gray-900 text-lg">{currentOrder.productName}</h3>
                  {currentOrder.description && (
                    <p className="text-gray-600 mt-1">{currentOrder.description}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Quantity</p>
                    <p className="text-lg font-semibold text-gray-900">{currentOrder.quantity}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Unit Price</p>
                    <p className="text-lg font-semibold text-gray-900">${(currentOrder.unitPrice || 0).toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Shipping</p>
                    <p className="text-lg font-semibold text-gray-900">${(currentOrder.shippingCost || 0).toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600">Total</p>
                    <p className="text-lg font-bold text-green-700">${(currentOrder.finalAmount || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Information */}
            {currentOrder.trackingInfo?.trackingNumber && (
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
                        Tracking Number: {currentOrder.trackingInfo.trackingNumber}
                      </p>
                      <p className="text-sm text-blue-700">
                        Carrier: {currentOrder.trackingInfo.carrier}
                      </p>
                    </div>
                  </div>
                  
                  {currentOrder.trackingInfo.estimatedDelivery && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <p className="text-sm text-blue-700">
                        Estimated Delivery: {new Date(currentOrder.trackingInfo.estimatedDelivery).toLocaleDateString()}
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
              
              {(() => {
                // Get user data - handle both userId (object) and user (object) formats
                const userData = currentOrder.userId || (currentOrder as any).user;
                const isUserObject = userData && typeof userData === 'object' && !Array.isArray(userData);
                
                return userData ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">
                            Customer Name
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            {isUserObject ? (userData.fullName || 'Unknown Customer') : 'Unknown Customer'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {isUserObject && userData.email && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium text-gray-900">{userData.email}</p>
                        </div>
                      </div>
                    )}
                    
                    {isUserObject && userData.phone && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="w-5 h-5 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium text-gray-900">{userData.phone}</p>
                        </div>
                      </div>
                    )}

                    {isUserObject && userData.address && (
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-medium text-gray-900">
                            {[
                              userData.address.street,
                              userData.address.city,
                              userData.address.state,
                              userData.address.country,
                              userData.address.postalCode
                            ].filter(Boolean).join(', ') || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    )}

                    {isUserObject && userData.role && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <User className="w-5 h-5 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Account Type</p>
                          <p className="font-medium text-gray-900 capitalize">{userData.role}</p>
                        </div>
                      </div>
                    )}

                    {isUserObject && (userData.approved !== undefined || userData.isActive !== undefined) && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Account Status</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {userData.approved ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                Approved
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                                Pending Approval
                              </span>
                            )}
                            {userData.isActive ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {isUserObject && userData.createdAt && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Member Since</p>
                          <p className="font-medium text-gray-900">
                            {formatDistanceToNow(new Date(userData.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* View Full Profile Link */}
                    {isUserObject && userData.id && (
                      <Link
                        to={`/admin/users/${userData.id}`}
                        className="block w-full text-center px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
                      >
                        View Full Profile
                      </Link>
                    )}

                    {/* Start Conversation Button */}
                    <button
                      onClick={handleStartConversation}
                      className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Start Conversation
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Customer information not available</p>
                  </div>
                );
              })()}
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
                      {currentOrder.createdAt && !isNaN(new Date(currentOrder.createdAt).getTime())
                        ? `${new Date(currentOrder.createdAt).toLocaleDateString()} • ${formatDistanceToNow(new Date(currentOrder.createdAt))} ago`
                        : 'Date not available'}
                    </p>
                  </div>
                </div>
                
                {currentOrder.updatedAt && currentOrder.updatedAt !== currentOrder.createdAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Last Updated</p>
                      <p className="text-sm text-gray-600">
                        {currentOrder.updatedAt && !isNaN(new Date(currentOrder.updatedAt).getTime())
                          ? `${new Date(currentOrder.updatedAt).toLocaleDateString()} • ${formatDistanceToNow(new Date(currentOrder.updatedAt))} ago`
                          : 'Date not available'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Notes */}
            {(currentOrder as any).notes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FileText className="w-6 h-6 text-blue-600 mr-3" />
                  Order Notes
                </h2>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{(currentOrder as any).notes}</p>
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