const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Order validation rules
const validateOrderCreation = [
  body('productName')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  
  body('productLink')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value || value === '' || value === null || value === undefined) return true; // Allow empty/falsy values
      if (typeof value !== 'string') return false;
      return /^https?:\/\/.+/.test(value); // Validate URL format if provided
    })
    .withMessage('Please provide a valid product URL'),
  
  body('quantity')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Quantity must be between 1 and 10,000'),
  
  body('unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  
  body('shippingCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping cost must be a positive number'),
  
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority value'),
  
  body('freightType')
    .optional()
    .isIn(['sea', 'air'])
    .withMessage('Freight type must be either "sea" or "air"'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  handleValidationErrors
];

const validateOrderUpdate = [
  param('orderId')
    .notEmpty()
    .withMessage('Order ID is required'),
  
  body('status')
    .optional()
    .isIn(['pending', 'processing', 'approved', 'purchased', 'warehouse', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status value'),
  
  body('trackingInfo.trackingNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Tracking number must be between 5 and 50 characters'),
  
  body('trackingInfo.carrier')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Carrier name must be between 2 and 50 characters'),
  
  handleValidationErrors
];

// Product validation rules
const validateProductCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  
  body('imageUrl')
    .isURL()
    .withMessage('Please provide a valid image URL'),
  
  handleValidationErrors
];

// Chat validation rules
const validateChatMessage = [
  body('text')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  
  body('type')
    .optional()
    .isIn(['text', 'file', 'image'])
    .withMessage('Invalid message type'),
  
  handleValidationErrors
];

// Admin settings validation rules
const validateAdminSettings = [
  body('heroSection.title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Hero title must be between 5 and 200 characters'),
  
  body('heroSection.subtitle')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Hero subtitle must be between 10 and 500 characters'),
  
  body('heroSection.backgroundType')
    .optional()
    .isIn(['image', 'video', 'color'])
    .withMessage('Invalid background type'),
  
  body('companyInfo.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  
  body('companyInfo.contact.email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  
  handleValidationErrors
];

// Query parameter validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters'),
  
  handleValidationErrors
];

// File upload validation
const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  const file = req.file || (req.files && req.files[0]);
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({ 
      message: 'Invalid file type. Only JPEG, PNG, WebP images and MP4, WebM videos are allowed.' 
    });
  }
  
  // Check file size limits
  const maxImageSize = 5 * 1024 * 1024; // 5MB for images (increased from 40KB)
  const maxVideoSize = 15 * 1024 * 1024; // 15MB for videos
  
  if (file.mimetype.startsWith('image/') && file.size > maxImageSize) {
    return res.status(400).json({ 
      message: 'Image file size must be less than 5MB' 
    });
  }
  
  if (file.mimetype.startsWith('video/') && file.size > maxVideoSize) {
    return res.status(400).json({ 
      message: 'Video file size must be less than 15MB' 
    });
  }
  
  next();
};

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateOrderCreation,
  validateOrderUpdate,
  validateProductCreation,
  validateChatMessage,
  validateAdminSettings,
  validatePagination,
  validateSearch,
  validateFileUpload
};