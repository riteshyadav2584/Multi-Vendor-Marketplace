# JWT Authentication Guide

## Overview

This guide explains how JWT (JSON Web Tokens) authentication is implemented in the marketplace API, what middleware is used, and how to protect routes with role-based access control.

---

## Table of Contents

1. [How JWT Works](#how-jwt-works)
2. [Middleware Components](#middleware-components)
3. [Protected Routes](#protected-routes)
4. [Role-Based Access Control](#role-based-access-control)
5. [Implementation Examples](#implementation-examples)
6. [Testing JWT Routes](#testing-jwt-routes)

---

## How JWT Works

### Token Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER REGISTRATION/LOGIN                                  │
│    POST /api/auth/register or /api/auth/login              │
│    ├─ Email & Password validated                           │
│    └─ Password hashed (if new registration)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. TOKEN GENERATED                                          │
│    jwt.sign({ id, email, role }, JWT_SECRET, {            │
│      expiresIn: '7d'                                        │
│    })                                                       │
│                                                             │
│    Token Format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. TOKEN RETURNED TO CLIENT                                 │
│    {                                                        │
│      success: true,                                         │
│      data: {                                                │
│        user: {...},                                         │
│        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  │
│      }                                                      │
│    }                                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CLIENT STORES TOKEN                                      │
│    localStorage, sessionStorage, or memory                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. CLIENT MAKES AUTHENTICATED REQUEST                       │
│    GET /api/auth/me                                         │
│    Headers: {                                               │
│      Authorization: "Bearer eyJhbGci..."                   │
│    }                                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. SERVER VERIFIES TOKEN                                    │
│    Middleware: authMiddleware                               │
│    ├─ Extract token from header                            │
│    ├─ Verify signature using JWT_SECRET                    │
│    ├─ Check expiration                                     │
│    └─ Attach decoded user to req.user                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. REQUEST PROCESSED                                        │
│    Route handler executes with user context                │
│    │                                                        │
│    ├─ Can access: req.user.id, req.user.email, req.user.role
│    └─ Returns protected resource                           │
└─────────────────────────────────────────────────────────────┘
```

### Token Structure

A JWT has three parts separated by dots (`.`):

```
header.payload.signature

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJlbWFpbCI6Impva2VAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Header**: Metadata about the token (algorithm: HS256, type: JWT)
**Payload**: User data (id, email, role)
**Signature**: Hash of header + payload + secret key

---

## Middleware Components

### 1. `authMiddleware` - JWT Verification

**Location:** [middleware/auth.js](middleware/auth.js)

```javascript
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // User info available in route
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token is not valid',
    });
  }
};
```

**Purpose**: Verifies JWT token and attaches user data to request

**Deployment**: Applied to protected routes
- Checks `Authorization` header for token in format: `Bearer <token>`
- Validates token signature using `JWT_SECRET`
- Validates token hasn't expired (default: 7 days)
- Attaches decoded user to `req.user`

**Returns**:
- ✅ Calls `next()` if token valid → route handler executes
- ❌ 401 if no token or invalid
- ❌ 401 if token expired

### 2. `authorize` - Role-Based Access Control

**Location:** [middleware/auth.js](middleware/auth.js)

```javascript
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource',
      });
    }

    next();
  };
};
```

**Purpose**: Restricts route access to specific roles

**Usage**: `authorize('admin', 'vendor')` - allows admin and vendor roles

**Returns**:
- ✅ Calls `next()` if user role matches
- ❌ 401 if user not authenticated
- ❌ 403 if user role not authorized

---

## Protected Routes

### Route Structure

Protected routes are organized as:

```
router.METHOD(path, authMiddleware, [authorize(...roles)], handler)
```

### Examples

#### Public Route (No Auth)
```javascript
router.post('/register', async (req, res) => {
  // Anyone can access
});
```

#### Protected Route (Auth Required, Any Role)
```javascript
router.get('/me', authMiddleware, async (req, res) => {
  // Logged-in users can access
  const userId = req.user.id;
  const userEmail = req.user.email;
  const userRole = req.user.role;
});
```

#### Role-Restricted Route (Vendor & Admin Only)
```javascript
router.post(
  '/',
  authMiddleware,
  authorize('vendor', 'admin'),
  async (req, res) => {
    // Only vendor and admin users can access
  }
);
```

#### Role-Restricted Route (Admin Only)
```javascript
router.delete(
  '/:id',
  authMiddleware,
  authorize('admin'),
  async (req, res) => {
    // Only admin users can access
  }
);
```

---

## Role-Based Access Control

### User Roles

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| **Customer** | Browse products, place orders, view own orders | Manage products, view others' orders, admin actions |
| **Vendor** | Create/edit/delete own products, view own sales, update own orders | Access admin panel, delete other vendors' products |
| **Admin** | Everything | None (has full access) |

### Middleware Chain

The middleware chain ensures:

1. **`authMiddleware`** runs first - validates token
2. **`authorize(...roles)`** runs second - checks user role
3. **Route handler** runs last - processes request

If any middleware fails, chain stops and error is returned.

### Example: Creating a Product

```javascript
// Middleware Chain Execution
router.post(
  '/products',
  authMiddleware,        // ① Check if token valid
  authorize('vendor', 'admin'),  // ② Check if user is vendor or admin
  async (req, res) => {  // ③ Create product
    // req.user available here with { id, email, role }
    const product = await Product.create({
      ...req.body,
      vendorId: req.user.id, // Use authenticated user's ID
    });
  }
);
```

**Flow**:
- No token? → 401 Unauthorized
- Token invalid? → 401 Unauthorized
- Token valid but role is 'customer'? → 403 Forbidden
- Token valid and role is 'vendor'/'admin'? → Create product

---

## Implementation Examples

### Example 1: Create Protected Endpoint

```javascript
const express = require('express');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// Vendor-only: Create a product
router.post('/products',
  authMiddleware,
  authorize('vendor', 'admin'),
  async (req, res) => {
    try {
      // req.user contains { id, email, role }
      const product = await Product.create({
        ...req.body,
        vendorId: req.user.id,
      });
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Customer-only: Get my orders
router.get('/my-orders',
  authMiddleware,
  authorize('customer'),
  async (req, res) => {
    const orders = await Order.find({ userId: req.user.id });
    res.json({ success: true, data: orders });
  }
);

// Admin-only: Get all users
router.get('/users',
  authMiddleware,
  authorize('admin'),
  async (req, res) => {
    const users = await User.find();
    res.json({ success: true, data: users });
  }
);

module.exports = router;
```

### Example 2: Authorization Check in Handler

```javascript
router.put('/products/:id',
  authMiddleware,
  authorize('vendor', 'admin'),
  async (req, res) => {
    const product = await Product.findById(req.params.id);

    // Extra check: Vendor can only edit own products
    if (product.vendorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this product',
      });
    }

    // Update product
    product.name = req.body.name;
    await product.save();
    res.json({ success: true, data: product });
  }
);
```

### Example 3: Token Generation

```javascript
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// On login
const token = generateToken(user);
res.json({
  success: true,
  data: {
    user: user,
    token: token,
  },
});
```

---

## Testing JWT Routes

### 1. Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Vendor",
    "email": "vendor@example.com",
    "password": "pass123",
    "role": "vendor"
  }'

# Copy token from response

# Access protected route with token
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token_from_above>"

# Try to create product (vendor-only)
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_from_above>" \
  -d '{
    "name": "Laptop",
    "price": 999.99,
    "category": "Electronics",
    "stock": 10
  }'
```

### 2. Using Postman

1. **Register and get token:**
   - POST `http://localhost:5000/api/auth/register`
   - Body (JSON): `{ "name": "...", "email": "...", "password": "...", "role": "..." }`
   - Copy token from response

2. **Add token to requests:**
   - Go to "Auth" tab
   - Type: "Bearer Token"
   - Token: Paste token from step 1

3. **Test protected endpoints:**
   - GET `http://localhost:5000/api/auth/me`
   - GET `http://localhost:5000/api/products`
   - POST `http://localhost:5000/api/products` (vendor only)

### 3. Using VS Code REST Client

Create `test.rest` file:

```rest
@baseUrl = http://localhost:5000/api
@token = your_token_here

### Register as Vendor
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "name": "John Vendor",
  "email": "john@example.com",
  "password": "pass123",
  "role": "vendor"
}

### Create Product (requires token)
POST {{baseUrl}}/products
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "name": "Laptop",
  "price": 999.99,
  "category": "Electronics",
  "stock": 10
}

### Get My Orders (customer-only)
GET {{baseUrl}}/orders/my-orders
Authorization: Bearer {{token}}

### Get All Orders (admin-only)
GET {{baseUrl}}/orders
Authorization: Bearer {{token}}
```

---

## Error Responses

### 401 Unauthorized
Returned when:
- No token provided
- Invalid token
- Token expired
- Not authenticated when authentication required

```json
{
  "success": false,
  "message": "No token provided. Authorization denied."
}
```

### 403 Forbidden
Returned when:
- User authenticated but doesn't have required role
- User doesn't have permission for resource

```json
{
  "success": false,
  "message": "Not authorized to access this resource"
}
```

---

## Security Best Practices

✅ **Do**:
- Store tokens securely (localStorage, sessionStorage, or HttpOnly cookie)
- Send token in Authorization header: `Bearer <token>`
- Use HTTPS in production
- Change `JWT_SECRET` to strong random value in production
- Never commit `.env` file
- Validate token expiration on client
- Implement token refresh mechanism

❌ **Don't**:
- Store token in URL or query parameters
- Use weak `JWT_SECRET` (change from default)
- Store sensitive data in JWT payload
- Trust client-side role validation alone
- Use expired tokens

---

## Environment Configuration

Required in `.env`:

```env
JWT_SECRET=your_super_secret_key_change_this_in_production
```

Token expires after **7 days** by default.

To change expiration, modify in [routes/auth.js](routes/auth.js):

```javascript
const generateToken = (user) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '30d', // Change to 30 days
  });
};
```

---

## Troubleshooting

### Issue: "No token provided"
**Cause**: Missing Authorization header
**Solution**: Include header: `Authorization: Bearer <token>`

### Issue: "Token is not valid"
**Cause**: Invalid signature or token format
**Solution**: Ensure token is copied correctly from login response

### Issue: "Token expired"
**Cause**: Token older than 7 days
**Solution**: Login again to get new token

### Issue: "Not authorized to access this resource"
**Cause**: User role doesn't match required roles
**Solution**: Register with correct role or use admin account

### Issue: Middleware doesn't run
**Cause**: Incorrect middleware ordering
**Solution**: Must be: `authMiddleware` then `authorize` then handler

---

## Summary

| Component | Purpose | Location |
|-----------|---------|----------|
| `generateToken()` | Create JWT | routes/auth.js |
| `authMiddleware` | Verify JWT | middleware/auth.js |
| `authorize()` | Check role | middleware/auth.js |
| `req.user` | Access authenticated user | Available after authMiddleware |

The three-step process:
1. User logs in → Token generated
2. Token sent in Authorization header → authMiddleware verifies
3. Route checks role → authorize ensures permission
4. Handler executes with user context → requser available
