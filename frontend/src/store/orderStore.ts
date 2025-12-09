import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-toastify';

export interface Order {
  id?: string; // PostgreSQL UUID
  _id?: string; // MongoDB ObjectId (for backward compatibility)
  orderId: string;
  userId?: {
    id?: string; // PostgreSQL UUID
    _id?: string; // MongoDB ObjectId (for backward compatibility)
    fullName?: string;
    email?: string;
    phone?: string;
  };
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

// Helper function to get order ID (supports both id and _id)
export const getOrderId = (order: Order): string => {
  return order.id || order._id || '';
};

interface OrderFormData {
  productName: string;
  productLink: string;
  quantity: number;
  unitPrice: number;
  freightType: 'sea' | 'air';
  description: string;
}

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

interface OrderState {
  // State
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  pagination: OrdersResponse['pagination'] | null;

  // Actions
  fetchOrders: (params?: URLSearchParams) => Promise<void>;
  fetchOrder: (orderId: string) => Promise<void>;
  createOrder: (orderData: OrderFormData) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  clearError: () => void;
  clearCurrentOrder: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  // Initial state
  orders: [],
  currentOrder: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  pagination: null,

  // Actions
  fetchOrders: async (params?: URLSearchParams) => {
    const state = get();
    // Prevent multiple simultaneous requests
    if (state.isLoading) {
      console.log('⏳ Already fetching orders, skipping duplicate request');
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const queryString = params ? `?${params.toString()}` : '';
      const response = await axios.get(`/orders${queryString}`);
      const data: OrdersResponse = response.data;
      
      // Map backend response to frontend format
      // Backend returns 'user' (from Sequelize association) but frontend expects 'userId'
      const mappedOrders = data.orders.map((order: any) => {
        const mapped = { ...order };
        // If backend returned 'user', map it to 'userId' for frontend consistency
        if (order.user && !order.userId) {
          mapped.userId = order.user;
        } else if (!order.userId) {
          // Fallback: if neither exists, create empty userId object
          mapped.userId = null;
        }
        return mapped;
      });
      
      set({
        orders: mappedOrders,
        pagination: data.pagination,
        isLoading: false
      });
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      
      // Don't show error toast for rate limiting (429) - user can retry
      if (error.response?.status !== 429) {
        toast.error('Failed to load orders');
      }
      
      set({
        error: error.response?.data?.message || 'Failed to fetch orders',
        isLoading: false
      });
    }
  },

  fetchOrder: async (orderId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.get(`/orders/${orderId}`);
      const order = response.data.order;
      
      // Map backend response to frontend format
      // Backend returns 'user' (from Sequelize association) but frontend expects 'userId'
      const mappedOrder: any = { ...order };
      // If backend returned 'user', map it to 'userId' for frontend consistency
      if (order.user && !order.userId) {
        mappedOrder.userId = order.user;
      } else if (!order.userId) {
        // Fallback: if neither exists, set userId to null
        mappedOrder.userId = null;
      }
      
      set({
        currentOrder: mappedOrder,
        isLoading: false
      });
    } catch (error: any) {
      console.error('Failed to fetch order:', error);
      set({
        error: error.response?.data?.message || 'Failed to fetch order',
        isLoading: false
      });
      toast.error('Failed to load order details');
    }
  },

  createOrder: async (orderData: OrderFormData) => {
    set({ isSubmitting: true, error: null });
    
    try {
      const subtotal = orderData.quantity * orderData.unitPrice;
      const payload = {
        productName: orderData.productName,
        productLink: orderData.productLink || '', // Empty string if not provided
        quantity: orderData.quantity,
        unitPrice: orderData.unitPrice,
        freightType: orderData.freightType || 'sea',
        description: orderData.description || '',
        totalPrice: subtotal,
        finalAmount: subtotal,
        shippingCost: 0, // Shipping cost will be calculated later based on freight type
        priority: 'normal' // Default priority
      };

      const response = await axios.post('/orders', payload);
      const newOrder = response.data.order;
      
      // Add to orders list if it exists
      const { orders } = get();
      set({
        orders: [newOrder, ...orders],
        isSubmitting: false
      });
      
      toast.success('Order created successfully!');
      return newOrder;
    } catch (error: any) {
      console.error('Failed to create order:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create order';
      const errorDetails = error.response?.data?.details || error.response?.data?.errors;
      
      if (errorDetails) {
        console.error('Error details:', errorDetails);
        toast.error(`${errorMessage}: ${JSON.stringify(errorDetails)}`);
      } else {
        toast.error(errorMessage);
      }
      
      set({
        error: errorMessage,
        isSubmitting: false
      });
      throw error;
    }
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    set({ isSubmitting: true, error: null });
    
    try {
      await axios.put(`/orders/${orderId}/status`, { status });
      
      // Update order in list
      const { orders, currentOrder } = get();
      const updatedOrders = orders.map(order =>
        getOrderId(order) === orderId ? { ...order, status } : order
      );
      
      set({
        orders: updatedOrders,
        currentOrder: currentOrder && getOrderId(currentOrder) === orderId 
          ? { ...currentOrder, status } 
          : currentOrder,
        isSubmitting: false
      });
      
      toast.success('Order status updated successfully');
    } catch (error: any) {
      console.error('Failed to update order status:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update order status';
      set({
        error: errorMessage,
        isSubmitting: false
      });
      toast.error(errorMessage);
    }
  },

  deleteOrder: async (orderId: string) => {
    set({ isSubmitting: true, error: null });
    
    try {
      await axios.delete(`/orders/${orderId}`);
      
      // Remove from orders list
      const { orders } = get();
      const updatedOrders = orders.filter(order => getOrderId(order) !== orderId);
      
      set({
        orders: updatedOrders,
        currentOrder: null,
        isSubmitting: false
      });
      
      toast.success('Order deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete order:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete order';
      set({
        error: errorMessage,
        isSubmitting: false
      });
      toast.error(errorMessage);
    }
  },

  clearError: () => {
    set({ error: null });
  },

  clearCurrentOrder: () => {
    set({ currentOrder: null });
  }
}));