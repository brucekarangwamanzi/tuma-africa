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
import { useOrderStore, getOrderId } from '../../store/orderStore';
import { toast } from 'react-toastify';
import axios from 'axios';

// Helper function to convert price to number (handles both string and number)
const getPriceNumber = (price: number | string | undefined): number => {
  if (price === undefined || price === null) return 0;
  if (typeof price === 'number') return price;
  if (typeof price === 'string') {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const AdminOrderEditPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { currentOrder, isLoading, fetchOrder, updateOrderStatus } = useOrderStore();
  
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
      fetchOrder(orderId);
    }
  }, [orderId, fetchOrder]);

  useEffect(() => {
    if (currentOrder) {
      setFormData({
        status: currentOrder.status || '',
        priority: currentOrder.priority || 'normal',
        trackingNumber: currentOrder.trackingInfo?.trackingNumber || '',
        carrier: currentOrder.trackingInfo?.carrier || '',
        estimatedDelivery: currentOrder.trackingInfo?.estimatedDelivery ? 
          new Date(currentOrder.trackingInfo.estimatedDelivery).toISOString().split('T')[0] : '',
        notes: (currentOrder as any).notes || '',
        customerName: currentOrder.userId?.fullName || '',
        customerEmail: currentOrder.userId?.email || '',
        customerPhone: currentOrder.userId?.phone || '',
        shippingCost: getPriceNumber(currentOrder.shippingCost),
        unitPrice: getPriceNumber(currentOrder.unitPrice)
      });
    }
  }, [currentOrder]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!currentOrder || !orderId) return;
    
    setIsUpdating(true);
    try {
      // Prepare update payload
      const updatePayload: any = {
        status: formData.status,
        priority: formData.priority,
        shippingCost: formData.shippingCost,
        unitPrice: formData.unitPrice
      };

      // Add tracking info if provided
      if (formData.trackingNumber || formData.carrier || formData.estimatedDelivery) {
        updatePayload.trackingInfo = {
          trackingNumber: formData.trackingNumber || undefined,
          carrier: formData.carrier || undefined,
          estimatedDelivery: formData.estimatedDelivery ? new Date(formData.estimatedDelivery).toISOString() : undefined
        };
      }

      // Add notes if provided
      if (formData.notes) {
        updatePayload.notes = formData.notes;
      }

      // Update order via API
      await axios.put(`/orders/${orderId}`, updatePayload);
      
      // Also update status if changed
      if (formData.status !== currentOrder.status) {
        await updateOrderStatus(orderId, formData.status);
      }
      
      toast.success('Order updated successfully');
      navigate(`/admin/orders/${orderId}`);
    } catch (error: any) {
      console.error('Failed to update order:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update order';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading && !currentOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading order...</p>
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

  const finalAmount = currentOrder ? (formData.unitPrice * currentOrder.quantity) + formData.shippingCost : 0;

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
                <p className="text-gray-600 mt-1">Order ID: {currentOrder.orderId}</p>
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
                  readOnly
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Read-only (from user account)</p>
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
                  readOnly
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Read-only (from user account)</p>
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
                  readOnly
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Read-only (from user account)</p>
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
                    ${finalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <p>Quantity: {currentOrder.quantity}</p>
                <p>Subtotal: ${(formData.unitPrice * currentOrder.quantity).toFixed(2)}</p>
                <p>Shipping: ${formData.shippingCost.toFixed(2)}</p>
                <p className="font-semibold text-gray-900">Total: ${finalAmount.toFixed(2)}</p>
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