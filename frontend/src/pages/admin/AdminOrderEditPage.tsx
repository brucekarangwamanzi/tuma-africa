import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, 
  ArrowLeft, 
  Save, 
  Truck, 
  MapPin, 
  Clock, 
  User, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useOrderStore } from '../../store/orderStore';
import { toast } from 'react-toastify';

const AdminOrderEditPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { orders, isLoading, fetchOrders, updateOrderStatus } = useOrderStore();
  
  const [order, setOrder] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    priority: '',
    trackingNumber: '',
    carrier: '',
    estimatedDelivery: '',
    notes: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingCost: 0,
    unitPrice: 0
  });

  useEffect(() => {
    if (orderId) {
      const existingOrder = orders.find(o => o._id === orderId);
      if (existingOrder) {
        setOrder(existingOrder);
        setFormData({
          status: existingOrder.status || '',
          priority: existingOrder.priority || 'normal',
          trackingNumber: existingOrder.trackingInfo?.trackingNumber || '',
          carrier: existingOrder.trackingInfo?.carrier || '',
          estimatedDelivery: existingOrder.trackingInfo?.estimatedDelivery ? 
            new Date(existingOrder.trackingInfo.estimatedDelivery).toISOString().split('T')[0] : '',
          notes: (existingOrder as any).notes || '',
          customerName: (existingOrder as any).customerName || '',
          customerEmail: (existingOrder as any).customerEmail || '',
          customerPhone: (existingOrder as any).customerPhone || '',
          shippingCost: existingOrder.shippingCost || 0,
          unitPrice: existingOrder.unitPrice || 0
        });
      } else {
        fetchOrders(new URLSearchParams());
      }
    }
  }, [orderId, orders, fetchOrders]);

  useEffect(() => {
    if (orderId && orders.length > 0) {
      const foundOrder = orders.find(o => o._id === orderId);
      if (foundOrder) {
        setOrder(foundOrder);
        setFormData({
          status: foundOrder.status || '',
          priority: foundOrder.priority || 'normal',
          trackingNumber: foundOrder.trackingInfo?.trackingNumber || '',
          carrier: foundOrder.trackingInfo?.carrier || '',
          estimatedDelivery: foundOrder.trackingInfo?.estimatedDelivery ? 
            new Date(foundOrder.trackingInfo.estimatedDelivery).toISOString().split('T')[0] : '',
          notes: (foundOrder as any).notes || '',
          customerName: (foundOrder as any).customerName || '',
          customerEmail: (foundOrder as any).customerEmail || '',
          customerPhone: (foundOrder as any).customerPhone || '',
          shippingCost: foundOrder.shippingCost || 0,
          unitPrice: foundOrder.unitPrice || 0
        });
      }
    }
  }, [orderId, orders]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!order || !orderId) return;
    
    setIsUpdating(true);
    try {
      // For now, we'll just update the status since that's what the store supports
      // In a real app, you'd have a more comprehensive update API
      await updateOrderStatus(orderId, formData.status);
      
      toast.success('Order updated successfully');
      navigate(`/admin/orders/${orderId}`);
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Failed to update order');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading order...</p>
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
          <p className="text-gray-600 mb-8">The order you're trying to edit doesn't exist.</p>
          <button
            onClick={() => navigate('/admin/orders')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const finalAmount = (formData.unitPrice * order.quantity) + formData.shippingCost;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/admin/orders/${orderId}`)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Order</h1>
                <p className="text-gray-600 mt-1">Order ID: {order.orderId}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/admin/orders/${orderId}`)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Order Status & Priority */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Status & Priority</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <User className="w-6 h-6 text-blue-600 mr-3" />
              Customer Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter customer name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <DollarSign className="w-6 h-6 text-green-600 mr-3" />
              Pricing Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.shippingCost}
                  onChange={(e) => handleInputChange('shippingCost', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount
                </label>
                <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-lg font-bold text-green-700">
                    ${finalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <p>Quantity: {order.quantity}</p>
                <p>Subtotal: ${(formData.unitPrice * order.quantity).toLocaleString()}</p>
                <p>Shipping: ${formData.shippingCost.toLocaleString()}</p>
                <p className="font-semibold text-gray-900">Total: ${finalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Tracking Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Truck className="w-6 h-6 text-purple-600 mr-3" />
              Tracking Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={formData.trackingNumber}
                  onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter tracking number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carrier
                </label>
                <select
                  value={formData.carrier}
                  onChange={(e) => handleInputChange('carrier', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select carrier</option>
                  <option value="FedEx">FedEx</option>
                  <option value="UPS">UPS</option>
                  <option value="USPS">USPS</option>
                  <option value="DHL">DHL</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Delivery
                </label>
                <input
                  type="date"
                  value={formData.estimatedDelivery}
                  onChange={(e) => handleInputChange('estimatedDelivery', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Order Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Notes</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any internal notes about this order..."
              />
            </div>
          </div>

          {/* Warning Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Note</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Currently, only status updates are fully supported. Other changes will be saved locally but may not persist on the server until full order update API is implemented.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderEditPage;