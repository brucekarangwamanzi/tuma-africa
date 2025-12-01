const express = require('express');
const Product = require('../models/Product');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const { validateProductCreation, validatePagination, validateSearch } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/products
// @desc    Get products with filtering and pagination
// @access  Public
router.get('/', optionalAuth, validatePagination, validateSearch, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    const { category, subcategory, featured, q, minPrice, maxPrice, sortBy } = req.query;
    
    // Build query
    let query = { isActive: true };
    
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

    // Get categories for filtering
    const categories = await Product.distinct('category', { isActive: true });

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

// @route   GET /api/products/featured
// @desc    Get featured products for homepage
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    const products = await Product.find({ 
      isActive: true, 
      featured: true 
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
      isActive: true
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

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      isActive: true 
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Increment view count
    product.popularity.views += 1;
    await product.save();

    res.json({ product });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// @route   POST /api/products
// @desc    Create new product
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

    // Ensure isActive is true by default for super admin created products
    if (productData.isActive === undefined) {
      productData.isActive = true;
    }
    
    // Ensure currency has a default value
    if (!productData.currency) {
      productData.currency = 'USD';
    }
    
    // If images array is provided but no imageUrl, use first image as imageUrl
    if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
      if (!productData.imageUrl) {
        productData.imageUrl = productData.images[0];
      }
    }
    
    // Ensure at least one image exists (either imageUrl or images array)
    if (!productData.imageUrl && (!productData.images || productData.images.length === 0)) {
      return res.status(400).json({ 
        message: 'At least one product image is required (either imageUrl or images array)' 
      });
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
    console.error('📦 Product data received:', req.body);
    console.error('🔍 Error stack:', error.stack);
    
    // Return more detailed error for debugging
    res.status(500).json({ 
      message: 'Failed to create product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Super Admin only)
router.put('/:id', authenticateToken, requireRole(['super_admin']), validateProductCreation, async (req, res) => {
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