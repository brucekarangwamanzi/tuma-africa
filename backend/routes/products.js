const express = require('express');
const Product = require('../models/Product');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const { validateProductCreation, validatePagination, validateSearch } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get products with filtering and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: subcategory
 *         schema:
 *           type: string
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, popular, rating, newest]
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: string
 *                 pagination:
 *                   type: object
 *   post:
 *     summary: Create new product (Super Admin only)
 *     description: |
 *       Create a new product in the catalog. This endpoint requires Super Admin role.
 *       
 *       **Business Logic:**
 *       - New products are **visible to all users by default** (status: 'published', isActive: true)
 *       - Only admins can edit products after creation
 *       - Only admins can change product status using PUT /api/products/:id/status
 *       
 *       **Required Fields:**
 *       - `name`: Product name (max 200 characters)
 *       - `price`: Product price (must be positive number)
 *       - `imageUrl`: Main product image URL
 *       - `category`: Product category
 *       - `description`: Product description (max 1000 characters)
 *       
 *       **Optional Fields:**
 *       - `originalPrice`: Original price before discount
 *       - `images`: Array of additional image URLs
 *       - `subcategory`: Product subcategory
 *       - `featured`: Whether product is featured (default: false)
 *       - `status`: Product status - "draft" or "published" (default: "published" - visible to all)
 *       - `currency`: Currency code (default: "USD")
 *       - `tags`: Array of product tags
 *       - `specifications`: Product specifications object
 *       - `supplier`: Supplier information
 *       - `stock`: Stock information
 *       - `shipping`: Shipping information
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - imageUrl
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *                 example: "Wireless Bluetooth Headphones"
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 description: Product description
 *                 example: "High-quality wireless headphones with noise cancellation"
 *                 maxLength: 1000
 *               price:
 *                 type: number
 *                 description: Product price
 *                 example: 99.99
 *                 minimum: 0
 *               originalPrice:
 *                 type: number
 *                 description: Original price before discount
 *                 example: 129.99
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: Main product image URL
 *                 example: "https://example.com/images/headphones.jpg"
 *               images:
 *                 type: array
 *                 description: Additional product images
 *                 items:
 *                   type: string
 *                   format: uri
 *                 example: ["https://example.com/images/headphones-1.jpg", "https://example.com/images/headphones-2.jpg"]
 *               category:
 *                 type: string
 *                 description: Product category
 *                 example: "Electronics"
 *               subcategory:
 *                 type: string
 *                 description: Product subcategory
 *                 example: "Audio"
 *               featured:
 *                 type: boolean
 *                 description: Whether product is featured
 *                 default: false
 *                 example: true
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *                 description: 'Product status - default is published (visible to all users)'
 *                 default: published
 *                 example: "published"
 *               currency:
 *                 type: string
 *                 description: Currency code
 *                 default: "USD"
 *                 example: "USD"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["wireless", "bluetooth", "audio"]
 *           examples:
 *             example1:
 *               summary: Basic product
 *               value:
 *                 name: "Wireless Bluetooth Headphones"
 *                 description: "High-quality wireless headphones with noise cancellation and 30-hour battery life"
 *                 price: 99.99
 *                 originalPrice: 129.99
 *                 imageUrl: "https://example.com/images/headphones.jpg"
 *                 category: "Electronics"
 *                 subcategory: "Audio"
 *                 featured: true
 *                 status: "published"
 *             example2:
 *               summary: Product with multiple images
 *               value:
 *                 name: "Smart Watch Pro"
 *                 description: "Feature-rich smartwatch with health tracking"
 *                 price: 199.99
 *                 imageUrl: "https://example.com/images/watch-main.jpg"
 *                 images:
 *                   - "https://example.com/images/watch-1.jpg"
 *                   - "https://example.com/images/watch-2.jpg"
 *                   - "https://example.com/images/watch-3.jpg"
 *                 category: "Electronics"
 *                 subcategory: "Wearables"
 *                 featured: false
 *                 status: "draft"
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product created successfully"
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Product validation failed"
 *               errors:
 *                 - field: "name"
 *                   message: "Product name is required"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Super Admin role required
 */
// @route   GET /api/products
// @desc    Get products with filtering and pagination
// @access  Public
router.get('/', optionalAuth, validatePagination, validateSearch, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    const { category, subcategory, featured, q, minPrice, maxPrice, sortBy } = req.query;
    
    // NEW BUSINESS LOGIC: Show all active products to all users
    // Products are visible by default when created
    // Only admins can change status to hide products
    let query = { 
      isActive: true // Show all active products (visible to all users)
    };
    
    if (category) query.category = { $regex: category, $options: 'i' };
    if (subcategory) query.subcategory = { $regex: subcategory, $options: 'i' };
    if (featured === 'true') query.featured = true;
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    if (q) {
      query.$text = { $search: q };
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'price_asc':
        sort.price = 1;
        break;
      case 'price_desc':
        sort.price = -1;
        break;
      case 'popular':
        sort = { 'popularity.orders': -1, 'popularity.views': -1 };
        break;
      case 'rating':
        sort = { 'popularity.rating': -1 };
        break;
      case 'newest':
        sort.createdAt = -1;
        break;
      default:
        sort = { featured: -1, 'popularity.orders': -1 };
    }

    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-createdBy -lastUpdatedBy');

    const total = await Product.countDocuments(query);

    // Get categories for filtering (only published products)
    const categories = await Product.distinct('category', query);

    res.json({
      products,
      categories,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

/**
 * @swagger
 * /products/featured:
 *   get:
 *     summary: Get featured products for homepage
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *     responses:
 *       200:
 *         description: Featured products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
// @route   GET /api/products/featured
// @desc    Get featured products for homepage
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
      const products = await Product.find({ 
      featured: true,
      isActive: true // Show all active featured products
    })
    .sort({ 'popularity.orders': -1, createdAt: -1 })
    .limit(limit)
    .select('name description price originalPrice imageUrl category popularity');

    res.json({ products });

  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ message: 'Failed to fetch featured products' });
  }
});

// @route   POST /api/products/by-ids
// @desc    Get products by array of IDs
// @access  Public
router.post('/by-ids', async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ message: 'Product IDs array is required' });
    }

    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true // Show all active products
    }).select('name description price originalPrice imageUrl category popularity');

    // Sort products in the order of the provided IDs
    const sortedProducts = productIds
      .map(id => products.find(p => p._id.toString() === id))
      .filter(Boolean);

    res.json({ products: sortedProducts });

  } catch (error) {
    console.error('Get products by IDs error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get single product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const productId = req.params.id;
    const userRole = req.user?.role;
    
    console.log('📦 GET /api/products/:id - Request received');
    console.log('   Product ID:', productId);
    console.log('   User:', req.user?.email || 'Anonymous');
    console.log('   User Role:', userRole || 'None');
    
    // First, try to find the product without isActive filter (to check if it exists)
    let product = await Product.findById(productId);

    if (!product) {
      console.log('❌ Product not found in database:', productId);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('✅ Product found:', {
      id: product._id,
      name: product.name,
      isActive: product.isActive,
      status: product.status
    });

    // If product is inactive and user is not admin/super_admin, return 404
    // This allows admins to view inactive products for management
    if (!product.isActive && (!req.user || !['admin', 'super_admin'].includes(userRole))) {
      console.log('⚠️ Product is inactive and user is not admin');
      return res.status(404).json({ 
        message: 'Product not found or no longer available',
        reason: 'Product is inactive'
      });
    }

    // Increment view count only for active products or admin views
    if (product.isActive || (req.user && ['admin', 'super_admin'].includes(userRole))) {
      product.popularity.views += 1;
      await product.save();
      console.log('📊 View count incremented');
    }

    console.log('✅ Sending product to client');
    res.json({ product });

  } catch (error) {
    console.error('❌ Get product error:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    
    // Check if it's an invalid ObjectId
    if (error.name === 'CastError' || error.kind === 'ObjectId') {
      console.log('❌ Invalid ObjectId format');
      return res.status(404).json({ message: 'Invalid product ID' });
    }
    
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// @route   POST /api/products
// @desc    Create new product (visible to all users by default)
// @access  Private (Super Admin only)
router.post('/', authenticateToken, requireRole(['super_admin']), validateProductCreation, async (req, res) => {
  try {
    console.log('📦 POST /api/products - Request received');
    console.log('👤 User:', req.user?.email, 'Role:', req.user?.role);
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    const productData = {
      ...req.body,
      createdBy: req.user._id,
      lastUpdatedBy: req.user._id
    };

    // Handle status field - map to isActive
    // NEW BUSINESS LOGIC: All products are visible to users by default
    // Only admins can change status later
    if (productData.status) {
      // If status is explicitly provided, use it
      productData.isActive = productData.status === 'published';
    } else if (productData.isActive !== undefined) {
      // If only isActive is provided (frontend sends this), derive status from it
      productData.status = productData.isActive ? 'published' : 'draft';
      // Ensure isActive matches the derived status
      productData.isActive = productData.status === 'published';
    } else {
      // NEW: Default to published so all users can see it immediately
      productData.status = 'published';
      productData.isActive = true; // Visible to all users by default
    }
    
    // Ensure currency has a default value
    if (!productData.currency) {
      productData.currency = 'USD';
    }
    
    // If images array is provided but no imageUrl, use first image as imageUrl
    if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
      if (!productData.imageUrl || productData.imageUrl.trim() === '') {
        productData.imageUrl = productData.images[0];
      }
    }
    
    // Ensure at least one image exists (either imageUrl or images array)
    if (!productData.imageUrl || productData.imageUrl.trim() === '') {
      if (!productData.images || !Array.isArray(productData.images) || productData.images.length === 0) {
        return res.status(400).json({ 
          message: 'At least one product image is required (either imageUrl or images array)' 
        });
      }
      // If we have images but no imageUrl, use the first one
      productData.imageUrl = productData.images[0];
    }

    console.log('💾 Product data to save:', JSON.stringify(productData, null, 2));

    const product = new Product(productData);
    await product.save();

    console.log('✅ Product saved to database:', product._id);

    // Populate createdBy and lastUpdatedBy for response
    await product.populate('createdBy', 'fullName email');
    await product.populate('lastUpdatedBy', 'fullName email');

    console.log('✅ Product populated and ready to send');

    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('❌ Create product error:', error);
    console.error('📋 Error details:', error.message);
    console.error('📦 Product data received:', JSON.stringify(req.body, null, 2));
    console.error('🔍 Error stack:', error.stack);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map((err) => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ 
        message: 'Product validation failed',
        errors: validationErrors,
        error: error.message
      });
    }
    
    // Return more detailed error for debugging
    res.status(500).json({ 
      message: 'Failed to create product',
      error: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      errorName: error.name
    });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product (Admin/Super Admin can edit)
 *     description: |
 *       Update product information. Admin and Super Admin can edit products.
 *       
 *       **Note:** Status changes are NOT allowed through this endpoint.
 *       Use PUT /api/products/:id/status to change product status.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       403:
 *         description: Only Admin/Super Admin can edit products
 *       404:
 *         description: Product not found
 */
// @route   PUT /api/products/:id
// @desc    Update product (Admin and Super Admin can edit)
// @access  Private (Admin/Super Admin)
router.put('/:id', authenticateToken, requireRole(['admin', 'super_admin']), validateProductCreation, async (req, res) => {
  try {
    console.log('🔄 PUT /api/products/:id - Request received');
    console.log('👤 User:', req.user?.email, 'Role:', req.user?.role);
    console.log('📋 Product ID:', req.params.id);
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    const updates = {
      ...req.body,
      lastUpdatedBy: req.user._id
    };

    // Ensure price is a number
    if (updates.price !== undefined) {
      updates.price = parseFloat(updates.price);
      if (isNaN(updates.price) || updates.price < 0) {
        return res.status(400).json({ message: 'Price must be a valid positive number' });
      }
    }

    // Note: Status and isActive changes are NOT allowed through regular update
    // Admins must use PUT /api/products/:id/status endpoint to change status
    // Remove status and isActive from updates if they were sent
    delete updates.status;
    delete updates.isActive;

    console.log('💾 Updates to apply:', JSON.stringify(updates, null, 2));

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      console.error('❌ Product not found:', req.params.id);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('✅ Product updated in database:', product._id);

    // Populate createdBy and lastUpdatedBy for response
    await product.populate('createdBy', 'fullName email');
    await product.populate('lastUpdatedBy', 'fullName email');

    console.log('✅ Product populated and ready to send');

    res.json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('❌ Update product error:', error);
    console.error('📋 Error details:', error.message);
    console.error('🔍 Error stack:', error.stack);
    
    res.status(500).json({ 
      message: 'Failed to update product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (soft delete)
// @access  Private (Admin/Super Admin)
/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete product (Super Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
// @route   PUT /api/products/:id/status
// @desc    Change product status (Admin/Super Admin only)
// @access  Private (Admin/Super Admin)
/**
 * @swagger
 * /products/{id}/status:
 *   put:
 *     summary: Change product status (Admin/Super Admin only)
 *     description: |
 *       Change product visibility status. Only Admin and Super Admin can change status.
 *       - "published": Product is visible to all users (isActive: true)
 *       - "draft": Product is hidden from users (isActive: false)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *                 description: Product status
 *                 example: "draft"
 *     responses:
 *       200:
 *         description: Product status changed successfully
 *       400:
 *         description: Invalid status value
 *       403:
 *         description: Only Admin/Super Admin can change status
 *       404:
 *         description: Product not found
 */
router.put('/:id/status', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['draft', 'published'].includes(status)) {
      return res.status(400).json({ 
        message: 'Status is required and must be "draft" or "published"' 
      });
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update status and isActive
    product.status = status;
    product.isActive = status === 'published';
    product.lastUpdatedBy = req.user._id;
    
    await product.save();
    await product.populate('lastUpdatedBy', 'fullName email');

    console.log(`✅ Product ${product._id} status changed to ${status} by ${req.user.email}`);

    res.json({
      message: `Product status changed to ${status}`,
      product
    });

  } catch (error) {
    console.error('Change product status error:', error);
    res.status(500).json({ message: 'Failed to change product status' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (Super Admin only)
// @access  Private (Super Admin only)
router.delete('/:id', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Actually delete the product from database
    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

// @route   POST /api/products/:id/toggle-featured
// @desc    Toggle product featured status
// @access  Private (Admin/Super Admin)
router.post('/:id/toggle-featured', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.featured = !product.featured;
    product.lastUpdatedBy = req.user._id;
    await product.save();

    res.json({
      message: `Product ${product.featured ? 'featured' : 'unfeatured'} successfully`,
      featured: product.featured
    });

  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// @route   GET /api/products/admin/all
// @desc    Get all products for super admin (including inactive)
// @access  Private (Super Admin only)
router.get('/admin/all', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    // Allow higher limit for admin (up to 1000)
    const limit = Math.min(parseInt(req.query.limit) || 20, 1000);
    const skip = (page - 1) * limit;
    
    const { category, featured, isActive, q } = req.query;
    
    let query = {};
    
    if (category) query.category = { $regex: category, $options: 'i' };
    if (featured !== undefined) query.featured = featured === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .populate('createdBy', 'fullName')
      .populate('lastUpdatedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          featured: { $sum: { $cond: ['$featured', 1, 0] } },
          totalViews: { $sum: '$popularity.views' },
          totalOrders: { $sum: '$popularity.orders' }
        }
      }
    ]);

    res.json({
      products,
      stats: stats[0] || {},
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get admin products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

module.exports = router;