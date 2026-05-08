# Product Management API Documentation

## Overview

The Product Management API allows vendors to create, read, update, and delete products in the marketplace. Full role-based access control ensures only authorized users can perform specific actions.

---

## API Endpoints

### 1. Create Product (POST)

**Endpoint**: `POST /api/products`

**Authentication**: Required (JWT Token)

**Authorization**: Vendor or Admin only

**Request Body**:
```json
{
  "name": "Wireless Headphones",
  "description": "High-quality noise-cancelling headphones with 30-hour battery",
  "price": 99.99,
  "category": "Electronics",
  "stock": 50,
  "image": "https://example.com/images/headphones.jpg"
}
```

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Wireless Headphones",
    "description": "High-quality noise-cancelling headphones...",
    "price": 99.99,
    "category": "Electronics",
    "stock": 50,
    "image": "https://example.com/images/headphones.jpg",
    "rating": 0,
    "reviewCount": 0,
    "isActive": true,
    "vendorId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Jane's Electronics",
      "email": "jane@example.com"
    },
    "createdAt": "2026-04-10T12:00:00Z",
    "updatedAt": "2026-04-10T12:00:00Z"
  }
}
```

**Error Responses**:

**400 Bad Request** - Validation error:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Name is required and must be a string",
    "Price must be a valid number",
    "Category is required and must be a string"
  ]
}
```

**400 Bad Request** - Duplicate product name:
```json
{
  "success": false,
  "message": "You already have a product with the name \"Wireless Headphones\""
}
```

**401 Unauthorized** - No token provided:
```json
{
  "success": false,
  "message": "No token provided. Authorization denied."
}
```

**403 Forbidden** - Customer trying to create product:
```json
{
  "success": false,
  "message": "Not authorized to access this resource"
}
```

**Field Validation Rules**:

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `name` | ✅ Yes | String | 1-100 characters, no duplicates per vendor |
| `price` | ✅ Yes | Number | 0-999,999.99 |
| `category` | ✅ Yes | String | 1-50 characters |
| `description` | ❌ No | String | 0-500 characters |
| `stock` | ❌ No | Integer | 0-1,000,000 |
| `image` | ❌ No | String (URL) | Valid URL format, max 500 chars |

---

### 2. Get All Products (GET)

**Endpoint**: `GET /api/products`

**Authentication**: Not required

**Authorization**: Public

**Query Parameters**:
```
?page=1&limit=10&category=Electronics&search=laptop
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Integer | 1 | Page number for pagination |
| `limit` | Integer | 10 | Products per page (max recommended: 100) |
| `category` | String | None | Filter by category |
| `search` | String | None | Full-text search in name/description |

**Example Request**:
```
GET /api/products?page=1&limit=10&category=Electronics
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Wireless Headphones",
      "description": "High-quality noise-cancelling...",
      "price": 99.99,
      "category": "Electronics",
      "stock": 50,
      "image": "https://example.com/headphones.jpg",
      "rating": 4.5,
      "reviewCount": 120,
      "isActive": true,
      "vendorId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane's Electronics",
        "email": "jane@example.com"
      },
      "createdAt": "2026-04-09T10:00:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "USB-C Cable",
      "description": "Durable high-speed cable...",
      "price": 12.99,
      "category": "Electronics",
      "stock": 200,
      "image": "https://example.com/cable.jpg",
      "rating": 4,
      "reviewCount": 45,
      "isActive": true,
      "vendorId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane's Electronics",
        "email": "jane@example.com"
      },
      "createdAt": "2026-04-08T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "pages": 3,
    "currentPage": 1,
    "limit": 10
  }
}
```

**Error Responses**:

**500 Internal Server Error**:
```json
{
  "success": false,
  "message": "Error fetching products"
}
```

---

### 3. Get Product by ID (GET)

**Endpoint**: `GET /api/products/:id`

**Authentication**: Not required

**Authorization**: Public

**Path Parameters**:
- `id` (string, required) - MongoDB ObjectId of the product

**Example Request**:
```
GET /api/products/507f1f77bcf86cd799439011
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Wireless Headphones",
    "description": "High-quality noise-cancelling headphones...",
    "price": 99.99,
    "category": "Electronics",
    "stock": 50,
    "image": "https://example.com/headphones.jpg",
    "rating": 4.5,
    "reviewCount": 120,
    "isActive": true,
    "vendorId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Jane's Electronics",
      "email": "jane@example.com"
    },
    "createdAt": "2026-04-09T10:00:00Z",
    "updatedAt": "2026-04-10T12:00:00Z"
  }
}
```

**Error Responses**:

**400 Bad Request** - Invalid ID format:
```json
{
  "success": false,
  "message": "Invalid product ID format"
}
```

**404 Not Found** - Product doesn't exist:
```json
{
  "success": false,
  "message": "Product not found"
}
```

---

### 4. Get Products by Vendor (GET)

**Endpoint**: `GET /api/products/vendor/:vendorId`

**Authentication**: Not required

**Authorization**: Public

**Path Parameters**:
- `vendorId` (string, required) - MongoDB ObjectId of the vendor (User)

**Example Request**:
```
GET /api/products/vendor/507f1f77bcf86cd799439012
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Wireless Headphones",
      "price": 99.99,
      "category": "Electronics",
      "stock": 50,
      "vendorId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane's Electronics",
        "email": "jane@example.com"
      }
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "USB-C Cable",
      "price": 12.99,
      "category": "Electronics",
      "stock": 200,
      "vendorId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane's Electronics",
        "email": "jane@example.com"
      }
    }
  ]
}
```

**Error Responses**:

**400 Bad Request** - Invalid vendor ID:
```json
{
  "success": false,
  "message": "Invalid vendor ID format"
}
```

---

### 5. Get My Products (GET)

**Endpoint**: `GET /api/products/my-products`

**Authentication**: Required (JWT Token)

**Authorization**: Vendor or Admin only

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Wireless Headphones",
      "price": 99.99,
      "category": "Electronics",
      "stock": 50,
      "isActive": true,
      "vendorId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane's Electronics",
        "email": "jane@example.com"
      }
    }
  ]
}
```

**Error Responses**:

**401 Unauthorized**:
```json
{
  "success": false,
  "message": "No token provided. Authorization denied."
}
```

**403 Forbidden** - Customer trying to access vendor endpoint:
```json
{
  "success": false,
  "message": "Not authorized to access this resource"
}
```

---

### 6. Update Product (PUT)

**Endpoint**: `PUT /api/products/:id`

**Authentication**: Required (JWT Token)

**Authorization**: Vendor owner or Admin only

**Path Parameters**:
- `id` (string, required) - MongoDB ObjectId of the product

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body** (Partial update allowed - send only fields to update):
```json
{
  "price": 89.99,
  "stock": 40,
  "description": "Updated description"
}
```

**Example Request**:
```
PUT /api/products/507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Wireless Headphones",
    "description": "Updated description",
    "price": 89.99,
    "category": "Electronics",
    "stock": 40,
    "image": "https://example.com/headphones.jpg",
    "isActive": true,
    "vendorId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Jane's Electronics",
      "email": "jane@example.com"
    },
    "updatedAt": "2026-04-10T15:30:00Z"
  }
}
```

**Error Responses**:

**400 Bad Request** - Invalid product ID format:
```json
{
  "success": false,
  "message": "Invalid product ID format"
}
```

**400 Bad Request** - Validation failed:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Price must be a valid number",
    "Price cannot exceed 999,999.99"
  ]
}
```

**403 Forbidden** - Not the vendor owner:
```json
{
  "success": false,
  "message": "Not authorized to update this product"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "message": "Product not found"
}
```

---

### 7. Delete Product (DELETE)

**Endpoint**: `DELETE /api/products/:id`

**Authentication**: Required (JWT Token)

**Authorization**: Vendor owner or Admin only

**Path Parameters**:
- `id` (string, required) - MongoDB ObjectId of the product

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Example Request**:
```
DELETE /api/products/507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

**Error Responses**:

**400 Bad Request** - Invalid ID:
```json
{
  "success": false,
  "message": "Invalid product ID format"
}
```

**403 Forbidden** - Not authorized:
```json
{
  "success": false,
  "message": "Not authorized to delete this product"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "message": "Product not found"
}
```

---

## Complete Request/Response Examples

### Example 1: Create Product as Vendor

**Request**:
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gaming Laptop",
    "description": "High-performance gaming laptop with RTX 4070",
    "price": 1499.99,
    "category": "Electronics",
    "stock": 5,
    "image": "https://example.com/gaming-laptop.jpg"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Gaming Laptop",
    "description": "High-performance gaming laptop with RTX 4070",
    "price": 1499.99,
    "category": "Electronics",
    "stock": 5,
    "image": "https://example.com/gaming-laptop.jpg",
    "rating": 0,
    "reviewCount": 0,
    "isActive": true,
    "vendorId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Tech Store",
      "email": "tech@example.com"
    },
    "createdAt": "2026-04-10T12:00:00Z",
    "updatedAt": "2026-04-10T12:00:00Z"
  }
}
```

### Example 2: Get all Electronics products

**Request**:
```bash
curl -X GET "http://localhost:5000/api/products?category=Electronics&page=1&limit=5"
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Gaming Laptop",
      "price": 1499.99,
      "category": "Electronics",
      "stock": 5,
      "vendorId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Tech Store"
      }
    }
  ],
  "pagination": {
    "total": 15,
    "pages": 3,
    "currentPage": 1,
    "limit": 5
  }
}
```

### Example 3: Update product price

**Request**:
```bash
curl -X PUT http://localhost:5000/api/products/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "price": 1299.99
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Gaming Laptop",
    "price": 1299.99,
    "category": "Electronics",
    "stock": 5
  }
}
```

---

## HTTP Status Codes

| Code | Meaning | Scenario |
|------|---------|----------|
| 200 | OK | Successfully fetched or updated |
| 201 | Created | Product created successfully |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Not authorized for action |
| 404 | Not Found | Product doesn't exist |
| 500 | Server Error | Internal error |

---

## Best Practices

1. **Always include JWT token** in Authorization header for protected endpoints
2. **Validate input data** before sending (client-side validation)
3. **Use pagination** for large product lists (set reasonable limits)
4. **Store product IDs** when creating for later reference
5. **Handle errors gracefully** - check `success` field and `errors` array
6. **Use search and filters** to improve user experience
7. **Implement rate limiting** on client for bulk operations
8. **Cache product data** when appropriate to reduce API calls

---

## Validation Rules

### Name
- Required
- String type
- 1-100 characters
- No duplicates per vendor

### Price
- Required
- Number type
- Range: 0 to 999,999.99
- Cannot be negative

### Category
- Required
- String type
- 1-50 characters
- Examples: Electronics, Clothing, Home & Garden

### Description
- Optional
- String type
- Max 500 characters

### Stock
- Optional
- Integer type
- Must be whole number
- Range: 0 to 1,000,000
- Cannot be negative

### Image
- Optional
- String type (URL)
- Must be valid URL format
- Max 500 characters

---

## Authorization Rules

| Action | Customer | Vendor | Admin |
|--------|----------|--------|-------|
| Create product | ❌ | ✅ Own only | ✅ Any |
| Read product | ✅ | ✅ | ✅ |
| Update product | ❌ | ✅ Own only | ✅ Any |
| Delete product | ❌ | ✅ Own only | ✅ Any |
| View all products | ✅ | ✅ | ✅ |
| View vendor products | ✅ | ✅ | ✅ |
| View own products | ❌ | ✅ | ✅ |

---

## Common Errors & Solutions

### "No token provided"
- **Cause**: Missing Authorization header
- **Solution**: Add header: `Authorization: Bearer <token>`

### "Not authorized to update this product"
- **Cause**: Trying to update another vendor's product
- **Solution**: Only vendors can update their own products, admin can update any

### "Invalid product ID format"
- **Cause**: Invalid MongoDB ObjectId
- **Solution**: Verify the ID is a valid 24-character hex string

### "Validation failed"
- **Cause**: Invalid field values
- **Solution**: Check the `errors` array for specific field issues

### "Product not found"
- **Cause**: Product ID doesn't exist
- **Solution**: Verify the product ID is correct
