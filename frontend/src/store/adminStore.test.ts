import { renderHook, act } from '@testing-library/react';
import { useAdminStore } from './adminStore';

// Mock axios
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    delete: jest.fn()
  }
}));

import axios from 'axios';
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('AdminStore', () => {
  beforeEach(() => {
    // Reset store state
    useAdminStore.setState({
      stats: null,
      recentOrders: [],
      chartData: null,
      isLoadingDashboard: false,
      isLoadingOrders: false,
      error: null
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('fetchDashboardData', () => {
    it('should fetch dashboard data successfully', async () => {
      const mockData = {
        stats: {
          totalUsers: 150,
          totalOrders: 89,
          pendingOrders: 12,
          totalRevenue: 45000,
          monthlyGrowth: 15.5
        },
        recentOrders: [
          {
            id: '1',
            orderNumber: 'ORD-001',
            customerName: 'John Doe',
            status: 'pending' as const,
            total: 250,
            createdAt: '2023-10-01T10:00:00Z'
          }
        ],
        chartData: {
          orders: [10, 15, 12, 18, 22, 25, 30],
          revenue: [1000, 1500, 1200, 1800, 2200, 2500, 3000]
        }
      };

      mockAxios.get.mockResolvedValueOnce({ data: mockData });

      const { result } = renderHook(() => useAdminStore());

      await act(async () => {
        await result.current.fetchDashboardData();
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/admin/dashboard');
      expect(result.current.stats).toEqual(mockData.stats);
      expect(result.current.recentOrders).toEqual(mockData.recentOrders);
      expect(result.current.chartData).toEqual(mockData.chartData);
      expect(result.current.isLoadingDashboard).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});