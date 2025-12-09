import { create } from 'zustand';
import axios from 'axios';

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

interface Order {
  _id: string;
  orderId: string;
  userId: {
    fullName: string;
    email: string;
  };
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  finalAmount: number;
  createdAt: string;
}

interface ChartData {
  orders: number[];
  revenue: number[];
}

interface AdminState {
  // Dashboard data
  stats: DashboardStats | null;
  recentOrders: Order[];
  chartData: ChartData | null;
  
  // Loading states
  isLoadingDashboard: boolean;
  isLoadingOrders: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  fetchDashboardData: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  clearError: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  // Initial state
  stats: null,
  recentOrders: [],
  chartData: null,
  isLoadingDashboard: false,
  isLoadingOrders: false,
  error: null,

  // Actions
  fetchDashboardData: async () => {
    set({ isLoadingDashboard: true, error: null });
    
    try {
      const response = await axios.get('/admin/dashboard');
      const { stats, recentOrders, monthlyRevenue } = response.data;
      
      // Transform monthlyRevenue into chartData format
      const chartData = {
        orders: monthlyRevenue?.map((item: any) => item.orders) || [],
        revenue: monthlyRevenue?.map((item: any) => item.revenue) || []
      };
      
      set({
        stats,
        recentOrders: recentOrders || [],
        chartData,
        isLoadingDashboard: false
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch dashboard data',
        isLoadingDashboard: false
      });
    }
  },

  updateOrderStatus: async (orderId: string, status: Order['status']) => {
    set({ isLoadingOrders: true, error: null });
    
    try {
      await axios.put(`/orders/${orderId}`, { status });
      
      // Update the order in the recent orders list
      const currentOrders = get().recentOrders;
      const updatedOrders = currentOrders.map(order =>
        order._id === orderId ? { ...order, status } : order
      );
      
      set({
        recentOrders: updatedOrders,
        isLoadingOrders: false
      });
      
      // Refresh dashboard stats
      get().fetchDashboardData();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update order status',
        isLoadingOrders: false
      });
    }
  },

  clearError: () => set({ error: null })
}));