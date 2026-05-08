# Order Management API Documentation

## Overview

The Order Management API enables customers to purchase products, automatically calculates a 10% platform commission, determines vendor earnings, and provides order tracking for all user roles.

---

## Commission Structure

### How Commission Works

**Commission Rate**: 10% of total order value

**Calculation Formula**:
```
totalCommission = totalPrice × 0.10
vendorAmount = totalPrice - totalCommission
```

**Example**:
```
Customer buys products for $100
Platform Commission (10%):  $10.00
Vendor Earnings:            $90.00
```

**Multi-Vendor Order Example**:
```
Customer buys from Vendor A: $50
Customer buys from Vendor B: $30
Total Order Value:          $80

Platform Commission (10%):  $8.00
Vendor A Earnings:          $45.00 (from their $50 items)
Vendor B Earnings:          $27.00 (from their $30 items)
```

### Commission Fields in Orders

```json
{
  "totalPrice": 100.00,
  "totalCommission": 10.00,
  "totalVendorAmount": 90.00,
  "commissionBreakdown": {
    "totalPrice": 100.00,
    "commissionRate": "10%",
    "commissionAmount": 10.00,
    "vendorEarnings": 90.00
  }
}
```

---

## API Endpoints

### 1. Create Order (POST)

**Endpoint**: `POST /api/orders`

**Authentication**: Required (JWT Token)

**Authorization**: Customer only

**Request Body**:
```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
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
  },
  "notes": "Please deliver after 5 PM"
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
  "message": "Order created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "orderNumber": "ORD-123456-789",
    "userId": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "John Customer",
      "email": "john@example.com"
    },
    "items": [
      {
        "productId": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Wireless Headphones",
          "price": 99.99
        },
        "quantity": 2,
        "price": 99.99,
        "vendorId": {
          "_id": "507f1f77bcf86cd799439021",
          "name": "Tech Store",
          "email": "tech@example.com"
        }
      }
    ],
    "totalPrice": 199.98,
    "totalCommission": 20.00,
    "totalVendorAmount": 179.98,
    "paymentMethod": "credit_card",
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "USA"
    },
    "createdAt": "2026-04-10T12:00:00Z",
    "commission": {
      "rate": "10%",
      "amount": 20.00,
      "vendorEarnings": 179.98
    }
  }
}
```

**Field Validation Rules**:

| Field | Required | Type | Rules |
|-------|----------|------|-------|
| `items` | ✅ Yes | Array | At least 1 item, products must exist |
| `items[].productId` | ✅ Yes | ObjectId | Valid product ID |
| `items[].quantity` | ✅ Yes | Integer | ≥ 1, stock must be available |
| `paymentMethod` | ✅ Yes | String | credit_card, debit_card, paypal, bank_transfer |
| `shippingAddress` | ❌ No | Object | Street, city, state, postal code, country |
| `notes` | ❌ No | String | Optional special instructions |

**Error Responses**:

**400 Bad Request** - Empty items:
```json
{
  "success": false,
  "message": "Order must contain at least one item"
}
```

**400 Bad Request** - Insufficient stock:
```json
{
  "success": false,
  "message": "Insufficient stock for Wireless Headphones"
}
```

**404 Not Found** - Product doesn't exist:
```json
{
  "success": false,
  "message": "Product 507f1f77bcf86cd799439999 not found"
}
```

**403 Forbidden** - Customer role required:
```json
{
  "success": false,
  "message": "Not authorized to access this resource"
}
```

---

### 2. Get My Orders (GET)

**Endpoint**: `GET /api/orders/my-orders`

**Authentication**: Required (JWT Token)

**Authorization**: Customer only

**Query Parameters**: None

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "orderNumber": "ORD-123456-789",
      "userId": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "John Customer",
        "email": "john@example.com"
      },
      "items": [
        {
          "productId": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Wireless Headphones",
            "price": 99.99,
            "image": "https://example.com/headphones.jpg"
          },
          "quantity": 2,
          "price": 99.99,
          "vendorId": {
            "_id": "507f1f77bcf86cd799439021",
            "name": "Tech Store",
            "email": "tech@example.com"
          }
        }
      ],
      "totalPrice": 199.98,
      "totalCommission": 20.00,
      "totalVendorAmount": 179.98,
      "paymentMethod": "credit_card",
      "paymentStatus": "pending",
      "orderStatus": "pending",
      "createdAt": "2026-04-10T12:00:00Z",
      "commissionBreakdown": {
        "totalPrice": 199.98,
        "commissionRate": "10%",
        "commissionAmount": 20.00,
        "vendorEarnings": 179.98
      }
    }
  ]
}
```

---

### 3. Get Vendor Orders (GET)

**Endpoint**: `GET /api/orders/vendor-orders`

**Authentication**: Required (JWT Token)

**Authorization**: Vendor only

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "orderNumber": "ORD-123456-789",
      "userId": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "John Customer",
        "email": "john@example.com"
      },
      "items": [
        {
          "productId": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Wireless Headphones",
            "price": 99.99,
            "image": "https://example.com/headphones.jpg"
          },
          "quantity": 2,
          "price": 99.99,
          "vendorId": {
            "_id": "507f1f77bcf86cd799439021",
            "name": "Tech Store",
            "email": "tech@example.com"
          }
        }
      ],
      "totalPrice": 199.98,
      "totalCommission": 20.00,
      "totalVendorAmount": 179.98,
      "createdAt": "2026-04-10T12:00:00Z",
      "vendorBreakdown": {
        "vendorItemsTotal": 199.98,
        "commissionRate": "10%",
        "commissionPaid": 20.00,
        "vendorEarnings": 179.98
      }
    }
  ]
}
```

**vendorBreakdown Fields**:
- **vendorItemsTotal**: Total value of this vendor's items in the order
- **commissionRate**: Platform commission rate (10%)
- **commissionPaid**: Amount the vendor pays to platform
- **vendorEarnings**: Amount the vendor keeps

---

### 4. Get All Orders (GET) - Admin Only

**Endpoint**: `GET /api/orders`

**Authentication**: Required (JWT Token)

**Authorization**: Admin only

**Query Parameters**:
```
?status=pending&page=1&limit=20
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | String | None | pending, confirmed, shipped, delivered, cancelled |
| `page` | Integer | 1 | Page number for pagination |
| `limit` | Integer | 20 | Orders per page |

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "orderNumber": "ORD-123456-789",
      "totalPrice": 199.98,
      "totalCommission": 20.00,
      "totalVendorAmount": 179.98,
      "commissionBreakdown": {
        "totalPrice": 199.98,
        "commissionRate": "10%",
        "totalCommission": 20.00,
        "totalVendorEarnings": 179.98
      },
      "paymentStatus": "pending",
      "orderStatus": "pending"
    }
  ],
  "pagination": {
    "total": 150,
    "pages": 8,
    "currentPage": 1,
    "limit": 20
  }
}
```

---

### 5. Get Order by ID (GET)

**Endpoint**: `GET /api/orders/:id`

**Authentication**: Required (JWT Token)

**Authorization**: Order customer, involved vendor, or admin

**Path Parameters**:
- `id` (string, required) - MongoDB ObjectId of the order

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "orderNumber": "ORD-123456-789",
    "userId": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "John Customer",
      "email": "john@example.com"
    },
    "items": [
      {
        "productId": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Wireless Headphones",
          "price": 99.99,
          "image": "https://example.com/headphones.jpg"
        },
        "quantity": 2,
        "price": 99.99,
        "vendorId": {
          "_id": "507f1f77bcf86cd799439021",
          "name": "Tech Store",
          "email": "tech@example.com"
        }
      }
    ],
    "totalPrice": 199.98,
    "totalCommission": 20.00,
    "totalVendorAmount": 179.98,
    "paymentMethod": "credit_card",
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "createdAt": "2026-04-10T12:00:00Z"
  }
}
```

---

### 6. Update Order Status (PUT)

**Endpoint**: `PUT /api/orders/:id/status`

**Authentication**: Required (JWT Token)

**Authorization**: Involved vendor or admin

**Request Body**:
```json
{
  "orderStatus": "shipped"
}
```

**Valid Order Statuses**:
- `pending` - Order received but not confirmed
- `confirmed` - Customer payment confirmed
- `shipped` - Items shipped to customer
- `delivered` - Items received by customer
- `cancelled` - Order cancelled

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "orderNumber": "ORD-123456-789",
    "orderStatus": "shipped",
    "totalPrice": 199.98,
    "totalCommission": 20.00,
    "totalVendorAmount": 179.98
  }
}
```

**Error Responses**:

**400 Bad Request** - Invalid status:
```json
{
  "success": false,
  "message": "Invalid order status"
}
```

**403 Forbidden** - Vendor not in order:
```json
{
  "success": false,
  "message": "Not authorized to update this order"
}
```

---

### 7. Update Payment Status (PUT) - Admin Only

**Endpoint**: `PUT /api/orders/:id/payment-status`

**Authentication**: Required (JWT Token)

**Authorization**: Admin only

**Request Body**:
```json
{
  "paymentStatus": "completed"
}
```

**Valid Payment Statuses**:
- `pending` - Awaiting payment processing
- `completed` - Payment successful
- `failed` - Payment failed
- `refunded` - Payment refunded to customer

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Payment status updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "orderNumber": "ORD-123456-789",
    "paymentStatus": "completed",
    "totalPrice": 199.98,
    "totalCommission": 20.00,
    "totalVendorAmount": 179.98
  }
}
```

---

## Commission Examples

### Example 1: Single Vendor Order

**Scenario**: Customer buys 2 items from one vendor

```
Product A: $50.00 × 1 = $50.00
Product B: $30.00 × 1 = $30.00
Total Price:              $80.00

Commission (10%):         $8.00
Vendor Earnings:          $72.00
```

**Response Data**:
```json
{
  "totalPrice": 80.00,
  "totalCommission": 8.00,
  "totalVendorAmount": 72.00,
  "commission": {
    "rate": "10%",
    "amount": 8.00,
    "vendorEarnings": 72.00
  }
}
```

### Example 2: Multi-Vendor Order

**Scenario**: Customer buys from multiple vendors in one order

```
Vendor A Products:
  - Item 1: $50.00 × 1 = $50.00
  - Item 2: $25.00 × 2 = $50.00
  Subtotal:               $100.00

Vendor B Products:
  - Item 3: $100.00 × 1 = $100.00
  Subtotal:               $100.00

Total Order Price:        $200.00
Platform Commission (10%): $20.00
Total Vendor Earnings:    $180.00

Breakdown:
  Vendor A Earnings: $100.00 - $10.00 = $90.00
  Vendor B Earnings: $100.00 - $10.00 = $90.00
```

**Vendor A sees** (via GET /api/orders/vendor-orders):
```json
{
  "vendorBreakdown": {
    "vendorItemsTotal": 100.00,
    "commissionRate": "10%",
    "commissionPaid": 10.00,
    "vendorEarnings": 90.00
  }
}
```

---

## HTTP Status Codes

| Code | Scenario |
|------|----------|
| 201 | Order created successfully |
| 200 | Successful GET or PUT |
| 400 | Invalid input, validation error, insufficient stock |
| 401 | Missing/invalid token |
| 403 | Not authorized (customer only, vendor not in order, etc.) |
| 404 | Order or product not found |
| 500 | Server error |

---

## Authorization Matrix

| Operation | Customer | Vendor | Admin |
|-----------|----------|--------|-------|
| **Create order** | ✅ | ❌ | ❌ |
| **View own orders** | ✅ | ❌ | N/A |
| **View orders with own items** | N/A | ✅ | N/A |
| **View all orders** | ❌ | ❌ | ✅ |
| **View order details** | ✅ Own | ✅ If vendor | ✅ |
| **Update order status** | ❌ | ✅ If vendor | ✅ |
| **Update payment status** | ❌ | ❌ | ✅ |

---

## Common Workflows

### Workflow 1: Customer Places Order

```
1. Customer views products
2. Customer adds items to cart
3. Customer checks out
4. Frontend calls: POST /api/orders
5. Order created with commission calculated
6. Response includes:
   - orderNumber (auto-generated)
   - totalPrice
   - totalCommission (10%)
   - totalVendorAmount
7. Order status: pending
8. Payment status: pending
```

### Workflow 2: Vendor Fulfills Order

```
1. Vendor logs in → gets token
2. Vendor views pending orders (GET /api/orders/vendor-orders)
3. Orders show vendorBreakdown with earnings info
4. Vendor prepares items for shipment
5. Vendor updates status: PUT /api/orders/<id>/status
6. Body: { "orderStatus": "shipped" }
7. Payment reflects vendor's 90% cut (after commission)
```

### Workflow 3: Admin Views Commission Summary

```
1. Admin logs in → gets token
2. Admin views all orders (GET /api/orders)
3. Each order shows:
   - totalPrice
   - totalCommission (platform keeps this)
   - totalVendorAmount (vendors receive this)
4. Admin can track total commission earned
5. Admin can generate financial reports
```

---

## Commission Calculation Details

### Precision Handling

All monetary calculations use:
- 2 decimal place precision
- Rounding: banker's rounding (round to nearest even)
- No floating-point errors

```javascript
// Example calculation
const totalPrice = 199.98;
const commissionRate = 0.10;
const totalCommission = Math.round(totalPrice * commissionRate * 100) / 100;
// Result: 20.00 (not 19.998)
```

### Multi-Vendor Commission

Each vendor's commission is calculated separately:

```javascript
// For each vendor in the order
const vendorItemsTotal = vendorItems.reduce(
  (sum, item) => sum + (item.price * item.quantity), 0
);
const vendorCommission = vendorItemsTotal * 0.10;
const vendorEarnings = vendorItemsTotal - vendorCommission;
```

---

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Order must contain at least one item" | Empty items array | Add at least 1 product |
| "Product X not found" | Invalid product ID | Verify product ID exists |
| "Insufficient stock for X" | Not enough inventory | Reduce quantity or choose another product |
| "Invalid payment method" | Unsupported method | Use: credit_card, debit_card, paypal, bank_transfer |
| "Not authorized to update this order" | Vendor not in order | Only vendors who sold items can update |

---

## Summary

The Order API provides:
- ✅ Complete order management
- ✅ Automatic 10% commission calculation
- ✅ Vendor earnings tracking
- ✅ Multi-vendor order support
- ✅ Payment and order status management
- ✅ Role-based access control
- ✅ Comprehensive error handling

All commission calculations are automatic and transparent!
