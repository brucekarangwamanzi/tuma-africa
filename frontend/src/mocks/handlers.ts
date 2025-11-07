import { rest } from 'msw';

export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          isApproved: true
        },
        token: 'mock-jwt-token'
      })
    );
  }),

  rest.get('/api/auth/me', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        isApproved: true
      })
    );
  }),

  // Admin endpoints
  rest.get('/api/admin/dashboard', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
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
            status: 'pending',
            total: 250,
            createdAt: new Date().toISOString()
          }
        ],
        chartData: {
          orders: [10, 15, 12, 18, 22, 25, 30],
          revenue: [1000, 1500, 1200, 1800, 2200, 2500, 3000]
        }
      })
    );
  }),

  // Products endpoints
  rest.get('/api/products', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        products: [
          {
            id: '1',
            name: 'Test Product',
            price: 100,
            category: 'Electronics',
            inStock: true
          }
        ],
        total: 1,
        page: 1,
        totalPages: 1
      })
    );
  }),

  // Orders endpoints
  rest.get('/api/orders', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        orders: [
          {
            id: '1',
            orderNumber: 'ORD-001',
            status: 'pending',
            total: 250,
            createdAt: new Date().toISOString()
          }
        ],
        total: 1
      })
    );
  })
];