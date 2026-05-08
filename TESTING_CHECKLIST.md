# JWT Authentication Testing Checklist

## Pre-Testing Setup

- [ ] MongoDB is running locally or connection string in .env
- [ ] `.env` file has `JWT_SECRET` set
- [ ] Dependencies installed: `npm install`
- [ ] Server started: `npm run dev`
- [ ] Server running on `http://localhost:5000`

---

## Test 1: Authentication Endpoints

### Register Customer
- [ ] POST `/api/auth/register`
- [ ] Body: `{ "name": "John Customer", "email": "customer@test.com", "password": "pass123", "role": "customer" }`
- [ ] Expected: 201 Created
- [ ] Response has `token` field
- [ ] **Copy token as `@customerToken`**

### Register Vendor
- [ ] POST `/api/auth/register`
- [ ] Body: `{ "name": "Jane Vendor", "email": "vendor@test.com", "password": "pass123", "role": "vendor" }`
- [ ] Expected: 201 Created
- [ ] Response has `token` field
- [ ] **Copy token as `@vendorToken`**

### Register Admin
- [ ] POST `/api/auth/register`
- [ ] Body: `{ "name": "Admin User", "email": "admin@test.com", "password": "pass123", "role": "admin" }`
- [ ] Expected: 201 Created
- [ ] Response has `token` field
- [ ] **Copy token as `@adminToken`**

### Login
- [ ] POST `/api/auth/login`
- [ ] Body: `{ "email": "customer@test.com", "password": "pass123" }`
- [ ] Expected: 200 OK
- [ ] Returns new token
- [ ] Token different from registration token (JWT includes timestamp)

### Get Current User
- [ ] GET `/api/auth/me`
- [ ] Header: `Authorization: Bearer <customerToken>`
- [ ] Expected: 200 OK
- [ ] Returns current user info
- [ ] User role matches registered role

### Test Token Expiration (Authentication)
- [ ] GET `/api/auth/me`
- [ ] Header: `Authorization: Bearer invalid_token`
- [ ] Expected: 401 Unauthorized
- [ ] Message: "Token is not valid"

### Test Missing Token
- [ ] GET `/api/auth/me`
- [ ] No Authorization header
- [ ] Expected: 401 Unauthorized
- [ ] Message: "No token provided"

---

## Test 2: Role-Based Access Control

### Admin-Only Route
- [ ] GET `/api/auth/admin-only` with `@adminToken`
- [ ] Expected: 200 OK
- [ ] Endpoint accessible

### Admin-Only Route with Vendor
- [ ] GET `/api/auth/admin-only` with `@vendorToken`
- [ ] Expected: 403 Forbidden
- [ ] Message: "Not authorized"

### Admin-Only Route with Customer
- [ ] GET `/api/auth/admin-only` with `@customerToken`
- [ ] Expected: 403 Forbidden
- [ ] Message: "Not authorized"

### Vendor-Only Route
- [ ] GET `/api/auth/vendor-only` with `@vendorToken`
- [ ] Expected: 200 OK
- [ ] Endpoint accessible

### Vendor-Only Route with Customer
- [ ] GET `/api/auth/vendor-only` with `@customerToken`
- [ ] Expected: 403 Forbidden

---

## Test 3: Product Routes

### Get All Products (Public)
- [ ] GET `/api/products`
- [ ] No auth required
- [ ] Expected: 200 OK
- [ ] Returns empty array (no products yet)

### Create Product as Vendor
- [ ] POST `/api/products`
- [ ] Header: `Authorization: Bearer <vendorToken>`
- [ ] Body: `{ "name": "Laptop", "price": 999.99, "category": "Electronics", "stock": 5 }`
- [ ] Expected: 201 Created
- [ ] Response has product with vendor info populated
- [ ] **Note the product `_id`**

### Create Product as Customer
- [ ] POST `/api/products`
- [ ] Header: `Authorization: Bearer <customerToken>`
- [ ] Body: `{ "name": "Phone", "price": 499.99, "category": "Electronics", "stock": 10 }`
- [ ] Expected: 403 Forbidden
- [ ] Message: "Not authorized"

### Get All Products (Now Should See Product)
- [ ] GET `/api/products`
- [ ] Expected: 200 OK
- [ ] Returns array with 1 product
- [ ] Product has vendor info populated

### Get Product by ID
- [ ] GET `/api/products/<product_id>`
- [ ] Expected: 200 OK
- [ ] Returns full product details

### Get My Products (Vendor)
- [ ] GET `/api/products/my-products`
- [ ] Header: `Authorization: Bearer <vendorToken>`
- [ ] Expected: 200 OK
- [ ] Returns products created by this vendor

### Get My Products (Customer)
- [ ] GET `/api/products/my-products`
- [ ] Header: `Authorization: Bearer <customerToken>`
- [ ] Expected: 403 Forbidden

### Update Product (Vendor Owner)
- [ ] PUT `/api/products/<product_id>`
- [ ] Header: `Authorization: Bearer <vendorToken>`
- [ ] Body: `{ "price": 899.99, "stock": 3 }`
- [ ] Expected: 200 OK
- [ ] Product updated with new price/stock

### Update Product (Different Vendor)
- [ ] Create second vendor, get their token
- [ ] PUT `/api/products/<first_vendor_product_id>`
- [ ] Header: `Authorization: Bearer <second_vendorToken>`
- [ ] Expected: 403 Forbidden
- [ ] Message: "Not authorized"

### Delete Product (Vendor Owner)
- [ ] Create another product as vendor
- [ ] DELETE `/api/products/<product_id>`
- [ ] Header: `Authorization: Bearer <vendorToken>`
- [ ] Expected: 200 OK
- [ ] Product deleted

### Delete Product Without Auth
- [ ] DELETE `/api/products/<product_id>`
- [ ] No auth header
- [ ] Expected: 401 Unauthorized

---

## Test 4: Order Routes

### Create Order as Customer
- [ ] Use product ID from Test 3
- [ ] POST `/api/orders`
- [ ] Header: `Authorization: Bearer <customerToken>`
- [ ] Body:
```json
{
  "items": [
    {
      "productId": "<product_id>",
      "quantity": 2
    }
  ],
  "paymentMethod": "credit_card",
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA"
  }
}
```
- [ ] Expected: 201 Created
- [ ] Order has auto-generated `orderNumber` (ORD-...)
- [ ] **Note the order `_id`**

### Create Order as Vendor
- [ ] POST `/api/orders` with `@vendorToken`
- [ ] Same body as above
- [ ] Expected: 403 Forbidden
- [ ] Only customers can create orders

### Get My Orders (Customer)
- [ ] GET `/api/orders/my-orders`
- [ ] Header: `Authorization: Bearer <customerToken>`
- [ ] Expected: 200 OK
- [ ] Returns orders created by this customer

### Get My Orders (Vendor)
- [ ] GET `/api/orders/my-orders`
- [ ] Header: `Authorization: Bearer <vendorToken>`
- [ ] Expected: 403 Forbidden
- [ ] Customers only

### Get Vendor Orders (Vendor)
- [ ] GET `/api/orders/vendor-orders`
- [ ] Header: `Authorization: Bearer <vendorToken>`
- [ ] Expected: 200 OK
- [ ] Returns orders containing this vendor's products

### Get All Orders (Admin)
- [ ] GET `/api/orders`
- [ ] Header: `Authorization: Bearer <adminToken>`
- [ ] Expected: 200 OK
- [ ] Returns all orders

### Get All Orders (Vendor)
- [ ] GET `/api/orders`
- [ ] Header: `Authorization: Bearer <vendorToken>`
- [ ] Expected: 403 Forbidden
- [ ] Admin only

### Get Order by ID (Order Customer)
- [ ] GET `/api/orders/<order_id>`
- [ ] Header: `Authorization: Bearer <customerToken>` (who placed order)
- [ ] Expected: 200 OK

### Get Order by ID (Vendor in Order)
- [ ] GET `/api/orders/<order_id>`
- [ ] Header: `Authorization: Bearer <vendorToken>` (vendor in items)
- [ ] Expected: 200 OK

### Get Order by ID (Different Customer)
- [ ] Create second customer, get their token
- [ ] GET `/api/orders/<order_from_first_customer>`
- [ ] Header: `Authorization: Bearer <second_customerToken>`
- [ ] Expected: 403 Forbidden

### Update Order Status (Vendor)
- [ ] PUT `/api/orders/<order_id>/status`
- [ ] Header: `Authorization: Bearer <vendorToken>`
- [ ] Body: `{ "orderStatus": "shipped" }`
- [ ] Expected: 200 OK
- [ ] Status updated

### Update Order Status (Unrelated Vendor)
- [ ] Create second vendor
- [ ] PUT `/api/orders/<order_id>/status`
- [ ] Header: `Authorization: Bearer <second_vendorToken>`
- [ ] Body: `{ "orderStatus": "shipped" }`
- [ ] Expected: 403 Forbidden

### Update Payment Status (Admin)
- [ ] PUT `/api/orders/<order_id>/payment-status`
- [ ] Header: `Authorization: Bearer <adminToken>`
- [ ] Body: `{ "paymentStatus": "completed" }`
- [ ] Expected: 200 OK

### Update Payment Status (Vendor)
- [ ] PUT `/api/orders/<order_id>/payment-status`
- [ ] Header: `Authorization: Bearer <vendorToken>`
- [ ] Body: `{ "paymentStatus": "completed" }`
- [ ] Expected: 403 Forbidden
- [ ] Admin only

---

## Test 5: Edge Cases

### Invalid JSON
- [ ] POST `/api/auth/register`
- [ ] Send malformed JSON
- [ ] Expected: 400 or 500 error

### Missing Required Fields
- [ ] POST `/api/auth/register`
- [ ] Body: `{ "email": "test@test.com" }` (missing name, password)
- [ ] Expected: 400 Bad Request

### Invalid Email Format
- [ ] POST `/api/auth/register`
- [ ] Body: `{ "name": "Test", "email": "invalid-email", "password": "pass123" }`
- [ ] Expected: 400 Bad Request

### Duplicate Email
- [ ] POST `/api/auth/register` twice with same email
- [ ] Expected: 400 Bad Request (second time)
- [ ] Message: "User with this email already exists"

### Negative Price
- [ ] POST `/api/products`
- [ ] Body: `{ "name": "Test", "price": -10, ... }`
- [ ] Expected: 400 Bad Request

### Non-Existent Product
- [ ] GET `/api/products/invalid_id`
- [ ] Expected: 404 Not Found

### Non-Existent Order
- [ ] GET `/api/orders/invalid_id`
- [ ] Expected: 404 Not Found or 403 (authorization depends on implementation)

### Insufficient Stock
- [ ] Create product with stock: 1
- [ ] Create order with quantity: 5
- [ ] Expected: 400 Bad Request
- [ ] Message: "Insufficient stock"

---

## Test 6: Pagination & Filtering

### Products Pagination
- [ ] GET `/api/products?page=1&limit=10`
- [ ] Expected: 200 OK
- [ ] Response has pagination info

### Products Category Filter
- [ ] GET `/api/products?category=Electronics`
- [ ] Expected: 200 OK
- [ ] Only Electronics products returned

### Orders Pagination (Admin)
- [ ] GET `/api/orders?page=1&limit=5`
- [ ] Header: `Authorization: Bearer <adminToken>`
- [ ] Expected: 200 OK
- [ ] Returns paginated orders

---

## Test 7: Data Consistency

### Product Vendor Populated
- [ ] GET `/api/products`
- [ ] Expected: Product has vendor object (not just ID)
- [ ] Vendor has `name` and `email`

### Order Items Populated
- [ ] GET `/api/orders/my-orders`
- [ ] Expected: Items have populated productId details
- [ ] Items have populated vendorId details

### User Data Not Exposed
- [ ] Login returns user object
- [ ] Expected: Password field NOT in response
- [ ] Only public user info returned

---

## Summary Results

| Test Area | Status | Notes |
|-----------|--------|-------|
| Authentication | ⬜ | |
| RBAC | ⬜ | |
| Products | ⬜ | |
| Orders | ⬜ | |
| Edge Cases | ⬜ | |
| Pagination | ⬜ | |
| Data Consistency | ⬜ | |

**Overall Status**: ⬜ Not Started | 🟨 In Progress | ✅ Complete

---

## Notes

Use this section to record findings:

```
Test Date: 
Tester: 
Environment: 
Issues Found:
  - 
  - 
  - 

Recommendations:
  - 
  - 
  - 
```
