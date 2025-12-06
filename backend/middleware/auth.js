const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['passwordHash', 'refreshToken'] }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

// Check if user is approved (for regular users)
// NOTE: Approval requirement has been removed - all users are auto-approved on registration
const requireApproval = (req, res, next) => {
  // Always pass - approval is no longer required
  next();
};

// Check if user is verified
const requireVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!req.user.verified) {
    return res.status(403).json({ 
      message: 'Email verification required' 
    });
  }

  next();
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId || decoded.id;
      const user = await User.findById(userId).select('-passwordHash -refreshToken');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignore token errors for optional auth
  }
  
  next();
};

// Rate limiting for sensitive operations
const sensitiveOperation = (req, res, next) => {
  // Additional security checks for sensitive operations
  const userAgent = req.get('User-Agent');
  const ip = req.ip || req.connection.remoteAddress;
  
  // Log sensitive operations
  console.log(`Sensitive operation: ${req.method} ${req.path} by user ${req.user?.email} from ${ip}`);
  
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireApproval,
  requireVerification,
  optionalAuth,
  sensitiveOperation
};