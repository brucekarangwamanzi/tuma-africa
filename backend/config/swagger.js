const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tuma-Africa Link Cargo API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for Tuma-Africa Link Cargo - A cargo and product ordering platform connecting African customers with Asian suppliers.',
      contact: {
        name: 'API Support',
        email: 'support@tuma-africa.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5001/api',
        description: 'Development server'
      },
      {
        url: 'https://tuma-africa-backend.onrender.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID'
            },
            fullName: {
              type: 'string',
              description: 'Full name of the user'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            phone: {
              type: 'string',
              description: 'User phone number'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'super_admin'],
              description: 'User role'
            },
            verified: {
              type: 'boolean',
              description: 'Email verification status'
            },
            approved: {
              type: 'boolean',
              description: 'Account approval status'
            },
            profileImage: {
              type: 'string',
              description: 'Profile image URL'
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Product ID'
            },
            name: {
              type: 'string',
              description: 'Product name'
            },
            description: {
              type: 'string',
              description: 'Product description'
            },
            price: {
              type: 'number',
              description: 'Product price'
            },
            originalPrice: {
              type: 'number',
              description: 'Original price before discount'
            },
            imageUrl: {
              type: 'string',
              description: 'Main product image URL'
            },
            images: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of product image URLs'
            },
            category: {
              type: 'string',
              description: 'Product category'
            },
            subcategory: {
              type: 'string',
              description: 'Product subcategory'
            },
            featured: {
              type: 'boolean',
              description: 'Whether product is featured'
            },
            status: {
              type: 'string',
              enum: ['draft', 'published'],
              description: 'Product status'
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Order ID'
            },
            orderId: {
              type: 'string',
              description: 'Custom order identifier'
            },
            userId: {
              type: 'string',
              description: 'User ID who placed the order'
            },
            productName: {
              type: 'string',
              description: 'Name of the product ordered'
            },
            productLink: {
              type: 'string',
              description: 'Link to the product'
            },
            quantity: {
              type: 'number',
              description: 'Quantity ordered'
            },
            unitPrice: {
              type: 'number',
              description: 'Price per unit'
            },
            totalPrice: {
              type: 'number',
              description: 'Total price (quantity * unitPrice)'
            },
            shippingCost: {
              type: 'number',
              description: 'Shipping cost'
            },
            finalAmount: {
              type: 'number',
              description: 'Final amount (totalPrice + shippingCost)'
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
              description: 'Order status'
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high', 'urgent'],
              description: 'Order priority'
            },
            freightType: {
              type: 'string',
              enum: ['air', 'sea', 'land'],
              description: 'Freight type'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message'
            },
            error: {
              type: 'string',
              description: 'Detailed error information (development only)'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Users',
        description: 'User profile management endpoints'
      },
      {
        name: 'Products',
        description: 'Product catalog management endpoints'
      },
      {
        name: 'Orders',
        description: 'Order management endpoints'
      },
      {
        name: 'Chat',
        description: 'Real-time chat and messaging endpoints'
      },
      {
        name: 'Notifications',
        description: 'Notification management endpoints'
      },
      {
        name: 'Admin',
        description: 'Admin dashboard and settings endpoints'
      },
      {
        name: 'Upload',
        description: 'File upload endpoints'
      },
      {
        name: 'Public',
        description: 'Public endpoints (no authentication required)'
      }
    ]
  },
  apis: [
    './backend/routes/*.js',
    './backend/server.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

