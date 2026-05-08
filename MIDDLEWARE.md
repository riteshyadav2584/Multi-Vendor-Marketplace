# Middleware Implementation Summary

## What's Implemented

### ✅ JWT Authentication System

**Location**: [middleware/auth.js](middleware/auth.js)

Two core middleware functions:

#### 1. `authMiddleware`
- Extracts JWT token from `Authorization: Bearer <token>` header
- Verifies token signature using `JWT_SECRET`
- Validates token hasn't expired
- Attaches decoded user data to `req.user`
- Returns 401 if invalid or missing

```javascript
// Usage in routes
router.get('/protected', authMiddleware, handler)
```

**Available in handler:**
```javascript
req.user = {
  id: "user_id",
  email: "user@example.com",
  role: "customer|vendor|admin"
}
```

#### 2. `authorize(...roles)`
- Higher-order function that takes role(s)
- Returns middleware that checks user role
- Returns 401 if not authenticated
- Returns 403 if role not permitted

```javascript
// Usage in routes
router.post('/admin-only',
  authMiddleware,
  authorize('admin'),
  handler
)

// Multiple roles
router.post('/vendor-area',
  authMiddleware,
  authorize('vendor', 'admin'),
  handler
)
```

---

## Protected Routes Created

### Products Routes ([routes/products.js](routes/products.js))

| Method | Endpoint | Auth | Roles | Purpose |
|--------|----------|------|-------|---------|
| POST | `/products` | ✅ | vendor, admin | Create new product |
| GET | `/products` | ❌ | public | List all products with filters |
| GET | `/products/:id` | ❌ | public | Get product details |
| PUT | `/products/:id` | ✅ | vendor, admin | Update product (owner only) |
| DELETE | `/products/:id` | ✅ | vendor, admin | Delete product (owner only) |
| GET | `/products/vendor/:vendorId` | ❌ | public | Get vendor's products |
| GET | `/products/my-products` | ✅ | vendor, admin | Get logged-in vendor's products |

**Key Features:**
- Vendor can only edit/delete own products
- Admin can edit/delete any product
- Public read access
- Full-text search support
- Category filtering
- Pagination support

### Orders Routes ([routes/orders.js](routes/orders.js))

| Method | Endpoint | Auth | Roles | Purpose |
|--------|----------|------|-------|---------|
| POST | `/orders` | ✅ | customer | Create new order |
| GET | `/orders/my-orders` | ✅ | customer | Get user's orders |
| GET | `/orders/vendor-orders` | ✅ | vendor | Get orders containing user's products |
| GET | `/orders` | ✅ | admin | Get all orders (paginated) |
| GET | `/orders/:id` | ✅ | any | Get order (customer, involved vendor, or admin) |
| PUT | `/orders/:id/status` | ✅ | vendor, admin | Update order status |
| PUT | `/orders/:id/payment-status` | ✅ | admin | Update payment status |

**Key Features:**
- Automatic order number generation (ORD-TIMESTAMP-RANDOM)
- Automatic price calculation from items
- Stock validation
- Vendor split calculation
- Role-based data access (customer sees own only, vendor sees involved only, admin sees all)
- Multiple status tracking (order + payment)

### Authentication Routes ([routes/auth.js](routes/auth.js))

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login, get JWT token |
| GET | `/auth/me` | ✅ | Get current user |
| GET | `/auth/admin-only` | ✅ admin | Test admin authorization |
| GET | `/auth/vendor-only` | ✅ vendor | Test vendor authorization |

---

## Token Generation

**Location**: [routes/auth.js](routes/auth.js)

```javascript
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
```

**When called:**
- After successful registration
- After successful login

**Token valid for**: 7 days (can be modified in code)

---

## Authorization Patterns

### Pattern 1: Public Route
```javascript
router.get('/products', async (req, res) => {
  // Anyone can access
});
```

### Pattern 2: Authenticated Only (Any Role)
```javascript
router.get('/me',
  authMiddleware,
  async (req, res) => {
    // user must be logged in
    const userId = req.user.id;
  }
);
```

### Pattern 3: Specific Role(s)
```javascript
router.post('/products',
  authMiddleware,
  authorize('vendor', 'admin'),
  async (req, res) => {
    // Only vendor and admin
  }
);
```

### Pattern 4: Single Role
```javascript
router.delete('/products/:id',
  authMiddleware,
  authorize('admin'),
  async (req, res) => {
    // Only admin
  }
);
```

### Pattern 5: Ownership Check
```javascript
router.put('/products/:id',
  authMiddleware,
  authorize('vendor', 'admin'),
  async (req, res) => {
    const product = await Product.findById(req.params.id);

    // Extra: Vendor can only edit own products
    if (product.vendorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }
  }
);
```

---

## Error Handling

### 401 Unauthorized
**When returned**: No/invalid token, or token expired

```json
{
  "success": false,
  "message": "No token provided. Authorization denied."
}
```

### 403 Forbidden
**When returned**: User authenticated but insufficient role

```json
{
  "success": false,
  "message": "Not authorized to access this resource"
}
```

---

## File Structure

```
backend/
├── middleware/
│   └── auth.js                 ← JWT middleware
├── routes/
│   ├── auth.js                 ← Token generation
│   ├── products.js             ← Protected product routes
│   └── orders.js               ← Protected order routes
├── models/
│   ├── User.js
│   ├── Product.js
│   └── Order.js
├── index.js                    ← Route registration
├── JWT_AUTH_GUIDE.md           ← Complete JWT guide
└── API.rest                    ← REST client testing
```

---

## Testing

### Using VS Code REST Client

1. Open [API.rest](API.rest)
2. Register 3 users (customer, vendor, admin)
3. Copy tokens to top variables
4. Test protected endpoints
5. Try to access endpoints you shouldn't (get 403)

### Using cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vendor@example.com","password":"vendorpass123"}'

# Copy token from response

# Create product with token
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "name": "Laptop",
    "price": 999.99,
    "category": "Electronics",
    "stock": 10
  }'
```

### Using Postman

1. In "Auth" tab, select "Bearer Token"
2. Paste token from login response
3. Send requests - token auto-included in header

---

## Security Configuration

### Required in `.env`
```env
JWT_SECRET=your_strong_random_secret_key_here_change_this_ASAP
```

### Recommendations
- ✅ Use long random string for JWT_SECRET
- ✅ Change JWT_SECRET immediately after deployment
- ✅ Use HTTPS in production
- ✅ Store tokens securely on client
- ✅ Implement token refresh logic
- ✅ Log authentication events
- ✅ Rate limit login attempts

---

## Features

✅ JWT token generation on register/login  
✅ Token verification on protected routes  
✅ Automatic token expiration (7 days)  
✅ Role-based access control (customer, vendor, admin)  
✅ Ownership verification (vendor can only access own)  
✅ Admin can access everything  
✅ Token in Authorization header (Bearer scheme)  
✅ Clear error messages for debugging  
✅ Populated vendor data on product queries  
✅ Middleware chain design  

---

## Next Steps

Consider implementing:
- [ ] Token refresh endpoint
- [ ] Email verification for registration
- [ ] Two-factor authentication
- [ ] Password reset flow
- [ ] Account lockout after failed attempts
- [ ] Permission matrix for fine-grained control
- [ ] Audit logging for sensitive operations
- [ ] API key authentication for services
