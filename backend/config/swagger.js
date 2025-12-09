const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tuma-Africa Link Cargo API',
      version: '1.0.0',
      description: 'API documentation for Tuma-Africa Link Cargo - A comprehensive cargo and product ordering platform connecting African customers with Asian suppliers.',
      contact: {
        name: 'Tuma-Africa Support',
        email: 'support@tuma-africa-cargo.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || `http://localhost:${process.env.PORT || 5001}/api`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /auth/login endpoint'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message'
            },
            error: {
              type: 'string',
              description: 'Detailed error (only in development)'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID'
            },
            fullName: {
              type: 'string',
              description: 'User full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
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
              description: 'Admin approval status'
            },
            profileImage: {
              type: 'string',
              description: 'Profile image URL'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints'
      },
      {
        name: 'Products',
        description: 'Product management endpoints'
      },
      {
        name: 'Orders',
        description: 'Order management endpoints'
      },
      {
        name: 'Users',
        description: 'User profile endpoints'
      },
      {
        name: 'Chat',
        description: 'Chat and messaging endpoints'
      },
      {
        name: 'Notifications',
        description: 'Notification endpoints'
      },
      {
        name: 'Admin',
        description: 'Admin management endpoints'
      },
      {
        name: 'Upload',
        description: 'File upload endpoints'
      },
      {
        name: 'Public',
        description: 'Public endpoints'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './server.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

