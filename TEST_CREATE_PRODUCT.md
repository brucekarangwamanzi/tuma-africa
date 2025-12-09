# How to Test Create Product API

## Overview

The **POST /products** endpoint allows you to create new products. This endpoint requires:
- ✅ **Super Admin** authentication (JWT token)
- ✅ Required fields: `name`, `description`, `price`, `imageUrl`, `category`

## Step-by-Step Guide

### Step 1: Start Your Server

```bash
npm run server
```

Make sure the server is running on `http://localhost:5001`

### Step 2: Open Swagger UI

Open your browser and navigate to:
```
http://localhost:5001/api-docs
```

### Step 3: Login as Super Admin

1. Find **POST /auth/login** in the Authentication section
2. Click "Try it out"
3. Enter your Super Admin credentials:
   ```json
   {
     "email": "your-super-admin@example.com",
     "password": "your-password"
   }
   ```
4. Click "Execute"
5. Copy the `accessToken` from the response

### Step 4: Authorize in Swagger UI

1. Click the **🔒 Authorize** button at the top
2. Paste your `accessToken` in the `bearerAuth` field
3. Click "Authorize", then "Close"
4. You should see "🔒 Authorized" at the top

### Step 5: Find Create Product Endpoint

1. Scroll to the **Products** section
2. Find **POST /products**
3. Click on it to expand
4. Click "Try it out"

### Step 6: Fill in Product Data

You'll see a request body editor. Use one of these examples:

#### Example 1: Basic Product
```json
{
  "name": "Wireless Bluetooth Headphones",
  "description": "High-quality wireless headphones with noise cancellation and 30-hour battery life",
  "price": 99.99,
  "originalPrice": 129.99,
  "imageUrl": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
  "category": "Electronics",
  "subcategory": "Audio",
  "featured": true,
  "status": "published"
}
```

#### Example 2: Product with Multiple Images
```json
{
  "name": "Smart Watch Pro",
  "description": "Feature-rich smartwatch with health tracking, GPS, and water resistance",
  "price": 199.99,
  "imageUrl": "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
  "images": [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    "https://images.unsplash.com/photo-1579586337278-3befd40f17ca"
  ],
  "category": "Electronics",
  "subcategory": "Wearables",
  "featured": false,
  "status": "published",
  "tags": ["smartwatch", "fitness", "gps"]
}
```

#### Example 3: Minimal Required Fields
```json
{
  "name": "Test Product",
  "description": "This is a test product description",
  "price": 49.99,
  "imageUrl": "https://via.placeholder.com/500",
  "category": "Test Category"
}
```

### Step 7: Execute the Request

1. Click the **"Execute"** button
2. Wait for the response
3. Check the response code and body

### Step 8: Check the Response

#### Success Response (201 Created):
```json
{
  "message": "Product created successfully",
  "product": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Wireless Bluetooth Headphones",
    "description": "High-quality wireless headphones...",
    "price": 99.99,
    "originalPrice": 129.99,
    "imageUrl": "https://images.unsplash.com/...",
    "category": "Electronics",
    "subcategory": "Audio",
    "featured": true,
    "status": "published",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses:

**400 Bad Request** - Validation Error:
```json
{
  "message": "Product validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Product name is required"
    }
  ]
}
```

**401 Unauthorized** - Missing/Invalid Token:
```json
{
  "message": "Unauthorized"
}
```

**403 Forbidden** - Not Super Admin:
```json
{
  "message": "Access denied. Super Admin role required"
}
```

## Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | Product name (max 200 chars) | "Wireless Headphones" |
| `description` | string | Product description (max 1000 chars) | "High-quality headphones..." |
| `price` | number | Product price (must be ≥ 0) | 99.99 |
| `imageUrl` | string | Main product image URL | "https://example.com/image.jpg" |
| `category` | string | Product category | "Electronics" |

## Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `originalPrice` | number | Original price before discount | - |
| `images` | array | Additional image URLs | [] |
| `subcategory` | string | Product subcategory | - |
| `featured` | boolean | Whether product is featured | false |
| `status` | string | "draft" or "published" | "draft" |
| `currency` | string | Currency code | "USD" |
| `tags` | array | Product tags | [] |

## Testing with cURL

If you prefer command line testing:

```bash
# 1. Login and get token
TOKEN=$(curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@example.com","password":"password"}' \
  | jq -r '.accessToken')

# 2. Create product
curl -X POST http://localhost:5001/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Product",
    "description": "Test description",
    "price": 99.99,
    "imageUrl": "https://via.placeholder.com/500",
    "category": "Electronics",
    "status": "published"
  }'
```

## Common Issues

### Issue 1: 401 Unauthorized
**Solution:** Make sure you:
- Logged in successfully
- Copied the correct `accessToken`
- Clicked "Authorize" in Swagger UI
- Token hasn't expired

### Issue 2: 403 Forbidden
**Solution:** You need Super Admin role. Check:
- Your user account has `role: "super_admin"`
- You logged in with the correct account

### Issue 3: 400 Validation Error
**Solution:** Check:
- All required fields are provided
- `name` is not empty and ≤ 200 characters
- `description` is not empty and ≤ 1000 characters
- `price` is a positive number
- `imageUrl` is a valid URL
- `category` is provided

### Issue 4: Image URL Not Working
**Solution:** Use a valid image URL:
- Test with: `https://via.placeholder.com/500`
- Or use: `https://images.unsplash.com/photo-...`
- Make sure the URL is accessible

## Quick Test Checklist

- [ ] Server is running
- [ ] Swagger UI is accessible
- [ ] Logged in as Super Admin
- [ ] Authorized with token in Swagger UI
- [ ] Filled in all required fields
- [ ] Clicked "Execute"
- [ ] Received 201 Created response
- [ ] Product appears in database

## Verify Product Was Created

After creating a product, you can verify it by:

1. **Get all products:**
   - Use **GET /products** endpoint
   - Your new product should appear in the list

2. **Get single product:**
   - Use **GET /products/{id}** endpoint
   - Use the `_id` from the create response

3. **Check database:**
   - Connect to MongoDB
   - Query the `products` collection

## Next Steps

After successfully creating a product:
- ✅ Test updating the product (PUT /products/{id})
- ✅ Test deleting the product (DELETE /products/{id})
- ✅ Test toggling featured status
- ✅ Test getting products list

Happy testing! 🚀

