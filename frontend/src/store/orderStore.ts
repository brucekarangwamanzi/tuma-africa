import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Order {
  _id: string;
  orderId: string;
  userId?: {
    _id?: string;
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
    set({ isLoading: true, error: null });
    
    try {
      const queryString = params ? `?${params.toString()}` : '';
      const response = await axios.get(`/orders${queryString}`);
      const data: OrdersResponse = response.data;
      
      set({
        orders: data.orders,
        pagination: data.pagination,
        isLoading: false
      });
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      set({
        error: error.response?.data?.message || 'Failed to fetch orders',
        isLoading: false
      });
      toast.error('Failed to load orders');
    }
  },

  fetchOrder: async (orderId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.get(`/orders/${orderId}`);
      set({
        currentOrder: response.data.order,
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
        order._id === orderId ? { ...order, status } : order
      );
      
      set({
        orders: updatedOrders,
        currentOrder: currentOrder?._id === orderId 
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
      const updatedOrders = orders.filter(order => order._id !== orderId);
      
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