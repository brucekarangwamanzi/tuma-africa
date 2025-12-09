import { render, screen, waitFor } from '../../utils/test-utils';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';
import AdminDashboard from './AdminDashboard';

// Mock the stores
jest.mock('../../store/authStore');
jest.mock('../../store/adminStore');

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseAdminStore = useAdminStore as jest.MockedFunction<typeof useAdminStore>;

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('AdminDashboard', () => {
  const mockAdminUser = {
    id: '1',
    name: 'Admin User',
    email: 'admin@test.com',
    role: 'admin'
  };

  const mockStats = {
    totalUsers: 150,
    totalOrders: 89,
    pendingOrders: 12,
    totalRevenue: 45000,
    monthlyGrowth: 15.5
  };

  const mockRecentOrders = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      customerName: 'John Doe',
      status: 'pending' as const,
      total: 250,
      createdAt: '2023-10-01T10:00:00Z'
    }
  ];

  const mockChartData = {
    orders: [10, 15, 12, 18, 22, 25, 30],
    revenue: [1000, 1500, 1200, 1800, 2200, 2500, 3000]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuthStore.mockReturnValue({
      user: mockAdminUser,
      isLoading: false,
      checkAuth: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      error: null,
      clearError: jest.fn()
    });

    mockUseAdminStore.mockReturnValue({
      stats: mockStats,
      recentOrders: mockRecentOrders,
      chartData: mockChartData,
      isLoadingDashboard: false,
      isLoadingOrders: false,
      error: null,
      fetchDashboardData: jest.fn(),
      updateOrderStatus: jest.fn(),
      clearError: jest.fn()
    });
  });

  it('renders admin dashboard with all components', async () => {
    render(<AdminDashboard />);

    // Check header
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Welcome back, Admin User/)).toBeInTheDocument();

    // Check stats cards
    expect(screen.getByText('150')).toBeInTheDocument(); // Total Users
    expect(screen.getByText('89')).toBeInTheDocument(); // Total Orders
    expect(screen.getByText('12')).toBeInTheDocument(); // Pending Orders
    expect(screen.getByText('$45,000')).toBeInTheDocument(); // Total Revenue

    // Check recent orders
    expect(screen.getByText('Recent Orders')).toBeInTheDocument();
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    mockUseAdminStore.mockReturnValue({
      stats: null,
      recentOrders: [],
      chartData: null,
      isLoadingDashboard: true,
      isLoadingOrders: false,
      error: null,
      fetchDashboardData: jest.fn(),
      updateOrderStatus: jest.fn(),
      clearError: jest.fn()
    });

    render(<AdminDashboard />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('calls fetchDashboardData on mount', () => {
    const mockFetchDashboardData = jest.fn();
    
    mockUseAdminStore.mockReturnValue({
      stats: mockStats,
      recentOrders: mockRecentOrders,
      chartData: mockChartData,
      isLoadingDashboard: false,
      isLoadingOrders: false,
      error: null,
      fetchDashboardData: mockFetchDashboardData,
      updateOrderStatus: jest.fn(),
      clearError: jest.fn()
    });

    render(<AdminDashboard />);
    expect(mockFetchDashboardData).toHaveBeenCalledTimes(1);
  });
});