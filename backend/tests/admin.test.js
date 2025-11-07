const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');

describe('Admin Routes', () => {
  let adminToken;
  let superAdminToken;
  let adminUser;
  let superAdminUser;

  beforeEach(async () => {
    // Create admin user
    adminUser = new User({
      fullName: 'Admin User',
      email: 'admin@test.com',
      phone: '+1234567890',
      passwordHash: 'hashedpassword',
      role: 'admin',
      approved: true,
      verified: true
    });
    await adminUser.save();

    // Create super admin user
    superAdminUser = new User({
      fullName: 'Super Admin User',
      email: 'superadmin@test.com',
      phone: '+1234567891',
      passwordHash: 'hashedpassword',
      role: 'super_admin',
      approved: true,
      verified: true
    });
    await superAdminUser.save();

    // Generate tokens
    adminToken = jwt.sign(
      { userId: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'test-secret'
    );

    superAdminToken = jwt.sign(
      { userId: superAdminUser._id, role: superAdminUser.role },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Create test data
    const testUser = new User({
      fullName: 'Test User',
      email: 'user@test.com',
      phone: '+1234567892',
      passwordHash: 'hashedpassword',
      role: 'user',
      approved: true,
      verified: true
    });
    await testUser.save();

    const testProduct = new Product({
      name: 'Test Product',
      description: 'Test Description',
      category: 'Electronics',
      price: 100,
      imageUrl: 'https://example.com/image.jpg',
      isActive: true,
      popularity: { orders: 5, views: 50 }
    });
    await testProduct.save();

    const testOrder = new Order({
      userId: testUser._id,
      productName: 'Test Product',
      productLink: 'https://example.com/product',
      quantity: 2,
      unitPrice: 100,
      totalPrice: 200,
      finalAmount: 250,
      status: 'pending',
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
        postalCode: '12345'
      }
    });
    await testOrder.save();
  });

  describe('GET /api/admin/dashboard', () => {
    it('should return dashboard data for admin', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('users');
      expect(response.body.stats).toHaveProperty('orders');
      expect(response.body.stats).toHaveProperty('products');
      expect(response.body.stats).toHaveProperty('pendingOrders');
      
      expect(response.body).toHaveProperty('recentOrders');
      expect(Array.isArray(response.body.recentOrders)).toBe(true);
      
      expect(response.body).toHaveProperty('monthlyRevenue');
      expect(Array.isArray(response.body.monthlyRevenue)).toBe(true);
    });

    it('should return dashboard data for super admin', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats.users).toBe(1); // Only regular user
      expect(response.body.stats.orders).toBe(1);
      expect(response.body.stats.products).toBe(1);
      expect(response.body.stats.pendingOrders).toBe(1);
    });

    it('should reject unauthorized requests', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .expect(401);
    });

    it('should reject non-admin users', async () => {
      const userToken = jwt.sign(
        { userId: 'user123', role: 'user' },
        process.env.JWT_SECRET || 'test-secret'
      );

      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return paginated users list', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.pagination).toHaveProperty('current');
      expect(response.body.pagination).toHaveProperty('total');
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=user')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users.every(user => user.role === 'user')).toBe(true);
    });

    it('should search users by name or email', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=Test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/admin/users/:userId/approve', () => {
    it('should approve a user', async () => {
      const user = await User.findOne({ role: 'user' });
      
      const response = await request(app)
        .put(`/api/admin/users/${user._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: true })
        .expect(200);

      expect(response.body.message).toContain('approved successfully');
      expect(response.body.user.approved).toBe(true);
    });

    it('should disapprove a user', async () => {
      const user = await User.findOne({ role: 'user' });
      
      const response = await request(app)
        .put(`/api/admin/users/${user._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: false })
        .expect(200);

      expect(response.body.message).toContain('disapproved successfully');
      expect(response.body.user.approved).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .put(`/api/admin/users/${fakeId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: true })
        .expect(404);
    });
  });

  describe('GET /api/admin/analytics', () => {
    it('should return analytics data', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('orderAnalytics');
      expect(response.body).toHaveProperty('dailyTrends');
      expect(response.body).toHaveProperty('productPerformance');
      expect(response.body).toHaveProperty('userEngagement');
    });

    it('should accept different time periods', async () => {
      const response = await request(app)
        .get('/api/admin/analytics?period=7d')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.period).toBe('7d');
    });
  });
});