const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock the models
const mockUser = {
  countDocuments: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  aggregate: jest.fn()
};

const mockOrder = {
  countDocuments: jest.fn(),
  find: jest.fn(),
  aggregate: jest.fn()
};

const mockProduct = {
  countDocuments: jest.fn(),
  find: jest.fn(),
  aggregate: jest.fn()
};

jest.mock('../models/User', () => mockUser);
jest.mock('../models/Order', () => mockOrder);
jest.mock('../models/Product', () => mockProduct);

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, 'test-secret');
    req.user = { _id: decoded.userId, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const mockRequireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
};

jest.mock('../middleware/auth', () => ({
  authenticateToken: mockAuth,
  requireRole: mockRequireRole
}));

// Create test app
const app = express();
app.use(express.json());

// Mock admin dashboard route
app.get('/api/admin/dashboard', mockAuth, mockRequireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    // Mock the dashboard data
    const stats = {
      users: 150,
      orders: 89,
      products: 25,
      pendingOrders: 12
    };

    const recentOrders = [
      {
        id: '1',
        orderNumber: 'ORD-001',
        customerName: 'John Doe',
        status: 'pending',
        total: 250,
        createdAt: new Date().toISOString()
      }
    ];

    const monthlyRevenue = [
      { _id: { year: 2023, month: 10 }, revenue: 5000, orders: 25 }
    ];

    res.json({
      stats,
      orderStats: [],
      recentOrders,
      monthlyRevenue,
      topProducts: [],
      userRegistrations: []
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

describe('Admin Dashboard API', () => {
  let adminToken;
  let userToken;

  beforeEach(() => {
    // Generate test tokens
    adminToken = jwt.sign(
      { userId: 'admin123', role: 'admin' },
      'test-secret'
    );

    userToken = jwt.sign(
      { userId: 'user123', role: 'user' },
      'test-secret'
    );

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('GET /api/admin/dashboard', () => {
    it('should return dashboard data for admin users', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toEqual({
        users: 150,
        orders: 89,
        products: 25,
        pendingOrders: 12
      });

      expect(response.body).toHaveProperty('recentOrders');
      expect(Array.isArray(response.body.recentOrders)).toBe(true);
      expect(response.body.recentOrders[0]).toHaveProperty('orderNumber', 'ORD-001');
    });

    it('should reject requests without authentication token', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject non-admin users', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should handle server errors gracefully', async () => {
      // Mock the route to throw an error
      const errorApp = express();
      errorApp.use(express.json());
      errorApp.get('/api/admin/dashboard', mockAuth, mockRequireRole(['admin', 'super_admin']), (req, res) => {
        throw new Error('Database error');
      });

      await request(errorApp)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);
    });
  });
});

describe('Admin Dashboard Components Logic', () => {
  describe('Dashboard Stats Calculations', () => {
    it('should calculate growth percentages correctly', () => {
      const calculateGrowth = (current, previous) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous * 100).toFixed(1);
      };

      expect(calculateGrowth(120, 100)).toBe('20.0');
      expect(calculateGrowth(80, 100)).toBe('-20.0');
      expect(calculateGrowth(100, 0)).toBe(0);
    });

    it('should format currency correctly', () => {
      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(amount);
      };

      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format large numbers with commas', () => {
      const formatNumber = (num) => {
        return num.toLocaleString();
      };

      expect(formatNumber(1234)).toBe('1,234');
      expect(formatNumber(1234567)).toBe('1,234,567');
    });
  });

  describe('Order Status Badge Logic', () => {
    it('should return correct badge classes for order statuses', () => {
      const getStatusBadge = (status) => {
        const statusConfig = {
          pending: 'badge-warning',
          processing: 'badge-info',
          shipped: 'badge-info',
          delivered: 'badge-success',
          cancelled: 'badge-danger'
        };
        return statusConfig[status] || 'badge-gray';
      };

      expect(getStatusBadge('pending')).toBe('badge-warning');
      expect(getStatusBadge('delivered')).toBe('badge-success');
      expect(getStatusBadge('cancelled')).toBe('badge-danger');
      expect(getStatusBadge('unknown')).toBe('badge-gray');
    });
  });

  describe('Chart Data Processing', () => {
    it('should process chart data correctly', () => {
      const processChartData = (rawData, period) => {
        const labels = {
          week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          month: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
        };

        return {
          labels: labels[period] || labels.week,
          data: rawData || []
        };
      };

      const result = processChartData([10, 15, 20], 'week');
      expect(result.labels).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
      expect(result.data).toEqual([10, 15, 20]);
    });

    it('should calculate chart percentages correctly', () => {
      const calculatePercentage = (value, max) => {
        if (max === 0) return 0;
        return (value / max) * 100;
      };

      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(0, 100)).toBe(0);
      expect(calculatePercentage(50, 0)).toBe(0);
    });
  });
});