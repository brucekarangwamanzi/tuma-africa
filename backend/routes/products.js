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
// @access  Private (Admin/Super Admin)
router.post('/', authenticateToken, requireRole(['admin', 'super_admin']), validateProductCreation, async (req, res) => {
  try {
    const productData = {
      ...req.body,
      createdBy: req.user._id,
      lastUpdatedBy: req.user._id
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      message: 'Failed to create product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin/Super Admin)
router.put('/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const updates = {
      ...req.body,
      lastUpdatedBy: req.user._id
    };

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (soft delete)
// @access  Private (Admin/Super Admin)
router.delete('/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false, lastUpdatedBy: req.user._id },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

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
// @desc    Get all products for admin (including inactive)
// @access  Private (Admin/Super Admin)
router.get('/admin/all', authenticateToken, requireRole(['admin', 'super_admin']), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
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