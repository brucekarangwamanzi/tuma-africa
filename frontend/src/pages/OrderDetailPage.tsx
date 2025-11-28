import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Package, 
  ArrowLeft, 
  Calendar,
  DollarSign,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Edit,
  Trash2,
  ExternalLink,
  Download,
  MessageCircle,
  Star,
  User
} from 'lucide-react';
import { useOrderStore } from '../store/orderStore';
import { formatDistanceToNow } from 'date-fns';
import ProductLocationMap from '../components/admin/ProductLocationMap';

interface Order {
  _id: string;
  orderId: string;
  productName: string;
  productLink: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  shippingCost: number;
  finalAmount: number;
  status: string;
  priority: string;
  freightType?: 'sea' | 'air';
  description?: string;
  trackingInfo?: {
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: string;
    updates?: Array<{
      status: string;
      location: string;
      timestamp: string;
      description: string;
    }>;
  };
  stageHistory?: Array<{
    stage: string;
    timestamp: string;
    updatedBy?: string;
    notes?: string;
    attachments?: string[];
  }>;
  createdAt: string;
  updatedAt: string;
}

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { currentOrder: order, isLoading, fetchOrder, updateOrderStatus, isSubmitting } = useOrderStore();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId, fetchOrder]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    await updateOrderStatus(order._id, newStatus);
  };

  const handleContactSupport = () => {
    if (!order) return;
    // Navigate to messages page with product link pre-filled
    const productLink = order.productLink || '';
    const messageText = productLink 
      ? `Hi, I need support regarding my order ${order.orderId}.\n\nProduct Link: ${productLink}`
      : `Hi, I need support regarding my order ${order.orderId}.`;
    
    navigate(`/messages?prefill=${encodeURIComponent(messageText)}`);
  };

  const handleDownloadInvoice = () => {
    if (!order) return;
    
    // Create invoice HTML
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice - ${order.orderId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 40px; }
          .invoice-details { margin-bottom: 30px; }
          .invoice-details table { width: 100%; border-collapse: collapse; }
          .invoice-details td { padding: 8px; border-bottom: 1px solid #eee; }
          .invoice-details td:first-child { font-weight: bold; width: 150px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          .items-table th { background-color: #f5f5f5; font-weight: bold; }
          .total-section { margin-top: 30px; text-align: right; }
          .total-row { font-size: 18px; font-weight: bold; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <p>Order ID: ${order.orderId}</p>
          <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        
        <div class="invoice-details">
          <table>
            <tr><td>Product Name:</td><td>${order.productName}</td></tr>
            <tr><td>Quantity:</td><td>${order.quantity}</td></tr>
            <tr><td>Unit Price:</td><td>$${order.unitPrice.toFixed(2)}</td></tr>
            <tr><td>Subtotal:</td><td>$${order.totalPrice.toFixed(2)}</td></tr>
            <tr><td>Shipping:</td><td>$${order.shippingCost.toFixed(2)}</td></tr>
            <tr><td>Freight Type:</td><td>${order.freightType ? (order.freightType === 'sea' ? 'Sea Freight' : 'Air Freight') : 'N/A'}</td></tr>
            <tr><td>Status:</td><td>${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</td></tr>
          </table>
        </div>
        
        <div class="total-section">
          <div class="total-row">Total: $${order.finalAmount.toFixed(2)}</div>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${order.orderId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Also try to print as PDF if possible
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handleRateOrder = () => {
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (!order || rating === 0) return;
    
    try {
      // Here you would typically send the rating to the backend
      // For now, we'll just show a success message
      alert(`Thank you for your ${rating}-star rating!`);
      setShowRatingModal(false);
      setRating(0);
      setRatingComment('');
    } catch (error) {
      console.error('Failed to submit rating:', error);
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

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { bg: string; text: string }> = {
      low: { bg: 'bg-gray-100', text: 'text-gray-800' },
      normal: { bg: 'bg-blue-100', text: 'text-blue-800' },
      high: { bg: 'bg-orange-100', text: 'text-orange-800' },
      urgent: { bg: 'bg-red-100', text: 'text-red-800' }
    };
    
    const config = priorityConfig[priority] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
      </span>
    );
  };

  if (isLoading) {
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
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/orders"
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
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Orders
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center mb-4 lg:mb-0">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl mr-4">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">{order.orderId}</h1>
                <p className="mt-2 text-lg text-gray-600">
                  Order placed {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {getStatusBadge(order.status)}
              {getPriorityBadge(order.priority)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Product Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Package className="w-6 h-6 text-blue-600 mr-3" />
                  Product Details
                </h2>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <Edit className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{order.productName}</h3>
                  {order.description && (
                    <p className="text-gray-600 mb-4">{order.description}</p>
                  )}
                  {order.productLink && (
                    <a 
                      href={order.productLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Product Page
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Package className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="text-lg font-semibold text-gray-900">{order.quantity}</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Unit Price</p>
                    <p className="text-lg font-semibold text-gray-900">${(order.unitPrice || 0).toLocaleString()}</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Truck className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Shipping</p>
                    <p className="text-lg font-semibold text-gray-900">${(order.shippingCost || 0).toLocaleString()}</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-600">Total</p>
                    <p className="text-lg font-bold text-green-700">${(order.finalAmount || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Location Map */}
            <ProductLocationMap
              currentStatus={order.status}
              trackingInfo={order.trackingInfo}
              stageHistory={order.stageHistory}
            />

            {/* Tracking Information */}
            {order.trackingInfo?.trackingNumber && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-6">
                  <MapPin className="w-6 h-6 text-purple-600 mr-3" />
                  Tracking Information
                </h2>

                <div className="bg-purple-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-purple-900">
                        {order.trackingInfo.carrier}: {order.trackingInfo.trackingNumber}
                      </p>
                      {order.trackingInfo.estimatedDelivery && (
                        <p className="text-sm text-purple-700 mt-1">
                          Estimated delivery: {new Date(order.trackingInfo.estimatedDelivery).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      Track Package
                    </button>
                  </div>
                </div>

                {order.trackingInfo.updates && order.trackingInfo.updates.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Tracking Updates</h3>
                    <div className="space-y-3">
                      {order.trackingInfo.updates.map((update, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900">{update.status}</p>
                              <p className="text-sm text-gray-500">
                                {formatDistanceToNow(new Date(update.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600">{update.location}</p>
                            {update.description && (
                              <p className="text-sm text-gray-500 mt-1">{update.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Order Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-6">
                <Clock className="w-6 h-6 text-blue-600 mr-3" />
                Order Timeline
              </h2>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Order Placed</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {order.status !== 'pending' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Order Processing</p>
                      <p className="text-sm text-gray-500">Order is being prepared</p>
                    </div>
                  </div>
                )}

                {(order.status === 'shipped' || order.status === 'delivered') && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Truck className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Order Shipped</p>
                      <p className="text-sm text-gray-500">Package is on its way</p>
                    </div>
                  </div>
                )}

                {order.status === 'delivered' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Order Delivered</p>
                      <p className="text-sm text-gray-500">Package has been delivered</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button 
                  onClick={handleContactSupport}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Support
                </button>
                
                <button 
                  onClick={handleDownloadInvoice}
                  className="w-full flex items-center justify-center px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </button>
                
                <button 
                  onClick={handleRateOrder}
                  className="w-full flex items-center justify-center px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Rate Order
                </button>
              </div>
              
              {/* Rating Modal */}
              {showRatingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Rate Your Order</h3>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">How would you rate this order?</p>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`p-2 rounded-lg transition-colors ${
                              star <= rating
                                ? 'text-yellow-400 bg-yellow-50'
                                : 'text-gray-300 hover:text-yellow-400'
                            }`}
                          >
                            <Star className={`w-6 h-6 ${star <= rating ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Comments (Optional)
                      </label>
                      <textarea
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Share your experience..."
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setShowRatingModal(false);
                          setRating(0);
                          setRatingComment('');
                        }}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitRating}
                        disabled={rating === 0}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Submit Rating
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${(order.totalPrice || 0).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">${(order.shippingCost || 0).toLocaleString()}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-green-600">${(order.finalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Customer Information
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Order ID</p>
                  <p className="font-medium text-gray-900">{order.orderId}</p>
                </div>
                
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-medium text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-600">Last Updated</p>
                  <p className="font-medium text-gray-900">
                    {formatDistanceToNow(new Date(order.updatedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;