# Swagger API Documentation

## Overview

Your API is now fully documented with Swagger/OpenAPI. You can test all your API endpoints directly from the Swagger UI interface.

## Accessing Swagger UI

Once your server is running, access the Swagger documentation at:

**Development:**
```
http://localhost:5001/api-docs
```

**Production:**
```
https://your-domain.com/api-docs
```

## Features

### 1. **Interactive API Testing**
- Test all endpoints directly from the browser
- No need for Postman or other API clients
- See request/response examples

### 2. **Authentication**
- Click the "Authorize" button at the top
- Enter your JWT token (obtained from `/api/auth/login`)
- All protected endpoints will use this token automatically

### 3. **API Documentation**
- Complete endpoint documentation
- Request/response schemas
- Parameter descriptions
- Error responses

### 4. **Try It Out**
- Click "Try it out" on any endpoint
- Fill in the required parameters
- Execute the request
- See the response immediately

## API Endpoints Documented

### Authentication (`/api/auth`)
- POST `/auth/register` - Register new user
- POST `/auth/login` - Login user
- POST `/auth/refresh` - Refresh access token
- POST `/auth/logout` - Logout user
- GET `/auth/me` - Get current user
- POST `/auth/forgot-password` - Request password reset
- POST `/auth/reset-password` - Reset password

### Products (`/api/products`)
- GET `/products` - Get products with filtering
- GET `/products/featured` - Get featured products
- GET `/products/{id}` - Get single product
- POST `/products` - Create product (Super Admin)
- PUT `/products/{id}` - Update product (Super Admin)
- DELETE `/products/{id}` - Delete product (Super Admin)

### Orders (`/api/orders`)
- POST `/orders` - Create new order
- GET `/orders` - Get orders (filtered by role)
- GET `/orders/{orderId}` - Get single order
- PUT `/orders/{orderId}` - Update order (Admin)
- DELETE `/orders/{orderId}` - Cancel/Delete order

### Users (`/api/users`)
- GET `/users/profile` - Get user profile
- PUT `/users/profile` - Update user profile
- GET `/users/dashboard-stats` - Get dashboard statistics

### Chat (`/api/chat`)
- POST `/chat/messages` - Send message
- GET `/chat/messages` - Get chat messages

### Notifications (`/api/notifications`)
- GET `/notifications` - Get notifications
- GET `/notifications/unread-count` - Get unread count
- PUT `/notifications/{id}/read` - Mark as read

### Admin (`/api/admin`)
- GET `/admin/settings` - Get admin settings
- POST `/admin/settings` - Update admin settings (Super Admin)
- GET `/admin/dashboard` - Get dashboard data

### Upload (`/api/upload`)
- POST `/upload/image` - Upload image
- POST `/upload/multiple` - Upload multiple files

### Public (`/api/public`)
- GET `/public/settings` - Get public settings

## How to Use

### Step 1: Start Your Server
```bash
npm run server
# or
node backend/server.js
```

### Step 2: Open Swagger UI
Navigate to `http://localhost:5001/api-docs` in your browser

### Step 3: Get Authentication Token
1. Use the `/auth/login` endpoint
2. Enter your credentials
3. Copy the `accessToken` from the response

### Step 4: Authorize
1. Click the "Authorize" button (🔒 icon) at the top
2. Paste your token in the `bearerAuth` field
3. Click "Authorize" then "Close"

### Step 5: Test Endpoints
1. Find any endpoint you want to test
2. Click "Try it out"
3. Fill in the parameters (if any)
4. Click "Execute"
5. See the response below

## Tips

- **Filtering**: Use the search box to filter endpoints by tag or name
- **Request Duration**: See how long each request takes
- **Response Examples**: All endpoints include example responses
- **Error Handling**: See what errors each endpoint can return

## Customization

The Swagger configuration is in `backend/config/swagger.js`. You can customize:
- API title and description
- Server URLs
- Tags and categories
- Response schemas

## Troubleshooting

### Swagger UI not loading?
- Make sure the server is running
- Check that `swagger-jsdoc` and `swagger-ui-express` are installed
- Verify the route is `/api-docs` (not `/api-docs/`)

### Authentication not working?
- Make sure you've clicked "Authorize" and entered your token
- Check that your token hasn't expired
- Verify the token format: `Bearer <your-token>` (the "Bearer" prefix is added automatically)

### Endpoints not showing?
- Check that your route files are in `backend/routes/`
- Verify Swagger JSDoc comments are properly formatted
- Check server console for any errors

## Next Steps

1. **Test all your endpoints** using Swagger UI
2. **Share the documentation** with your team
3. **Export the OpenAPI spec** if needed (available at `/api-docs/swagger.json`)

Enjoy testing your APIs! 🚀

