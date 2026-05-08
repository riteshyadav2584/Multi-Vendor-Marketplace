# MongoDB Schemas Documentation

## Overview
The marketplace uses three main schemas: User, Product, and Order. Below is a detailed breakdown of each schema with field definitions and relationships.

---

## 1. User Schema

**File:** `models/User.js`

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ | User's full name (max 50 chars) |
| `email` | String | ✅ | Unique email address with validation |
| `password` | String | ✅ | Hashed password (min 6 chars, not returned in responses) |
| `role` | Enum | ✅ | `customer`, `vendor`, or `admin` (default: `customer`) |
| `profileImage` | String | ❌ | URL to profile picture |
| `isActive` | Boolean | ❌ | Account status (default: `true`) |
| `vendorDetails` | Object | ❌ | Only used for vendor role |
| `vendorDetails.companyName` | String | ❌ | Business name |
| `vendorDetails.companyDescription` | String | ❌ | Business description |
| `vendorDetails.businessLicense` | String | ❌ | License file/URL |
| `vendorDetails.taxId` | String | ❌ | Tax ID number |
| `vendorDetails.isApproved` | Boolean | ❌ | Vendor approval status (default: `false`) |
| `createdAt` | DateTime | Auto | Record creation timestamp |
| `updatedAt` | DateTime | Auto | Record last update timestamp |

### Example User Document

```javascript
{
  _id: ObjectId("..."),
  name: "Jane Smith",
  email: "jane.vendor@example.com",
  password: "$2a$10$hashed_password...",
  role: "vendor",
  profileImage: "https://example.com/jane.jpg",
  isActive: true,
  vendorDetails: {
    companyName: "Jane's Electronics",
    companyDescription: "High-quality electronics retailer",
    businessLicense: "LICENSE-123456",
    taxId: "TAX-789012",
    isApproved: true
  },
  createdAt: "2026-04-10T10:30:00Z",
  updatedAt: "2026-04-10T10:30:00Z"
}
```

### Methods

- `comparePassword(enteredPassword)` - Compares entered password with hashed password
- `toJSON()` - Removes password from response

---

## 2. Product Schema

**File:** `models/Product.js`

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ | Product name (max 100 chars) |
| `description` | String | ❌ | Product description (max 500 chars) |
| `price` | Number | ✅ | Product price (min: 0) |
| `image` | String | ❌ | Product image URL |
| `category` | String | ✅ | Product category (e.g., electronics, clothing) |
| `stock` | Number | ❌ | Available quantity (default: 0, min: 0) |
| `vendorId` | ObjectId | ✅ | Reference to User (vendor) |
| `rating` | Number | ❌ | Average rating (default: 0, range: 0-5) |
| `reviewCount` | Number | ❌ | Number of reviews (default: 0) |
| `isActive` | Boolean | ❌ | Product visibility (default: `true`) |
| `createdAt` | DateTime | Auto | Record creation timestamp |
| `updatedAt` | DateTime | Auto | Record last update timestamp |

### Example Product Document

```javascript
{
  _id: ObjectId("..."),
  name: "Wireless Headphones",
  description: "High-quality noise-cancelling headphones",
  price: 99.99,
  image: "https://example.com/headphones.jpg",
  category: "Electronics",
  stock: 50,
  vendorId: ObjectId("..."), // Reference to User
  rating: 4.5,
  reviewCount: 120,
  isActive: true,
  createdAt: "2026-04-09T15:20:00Z",
  updatedAt: "2026-04-10T08:45:00Z"
}
```

### Relationships

- **vendorId** → Links to User schema (references a vendor)
- Auto-populates vendor's `name` and `email` on retrieval

### Indexes

- `vendorId` - Fast filtering by vendor
- `category` - Fast filtering by category
- `name` + `description` - Full-text search support

---

## 3. Order Schema

**File:** `models/Order.js`

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `orderNumber` | String | ✅ | Unique auto-generated order ID (format: ORD-TIMESTAMP-RANDOM) |
| `userId` | ObjectId | ✅ | Reference to User (customer) |
| `items` | Array | ✅ | Array of ordered products |
| `items[].productId` | ObjectId | ✅ | Reference to Product |
| `items[].quantity` | Number | ✅ | Quantity ordered (min: 1) |
| `items[].price` | Number | ✅ | Price per unit at time of order |
| `items[].vendorId` | ObjectId | ✅ | Reference to vendor (denormalized for fast access) |
| `totalPrice` | Number | ✅ | Total order amount before commission |
| `totalCommission` | Number | ❌ | Platform commission (default: 0) |
| `totalVendorAmount` | Number | ❌ | Amount paid to vendors (default: 0) |
| `paymentMethod` | String | ✅ | `credit_card`, `debit_card`, `paypal`, `bank_transfer` |
| `paymentStatus` | String | ❌ | `pending`, `completed`, `failed`, `refunded` (default: `pending`) |
| `orderStatus` | String | ❌ | `pending`, `confirmed`, `shipped`, `delivered`, `cancelled` (default: `pending`) |
| `shippingAddress` | Object | ❌ | Delivery address |
| `shippingAddress.street` | String | ❌ | Street address |
| `shippingAddress.city` | String | ❌ | City |
| `shippingAddress.state` | String | ❌ | State/Province |
| `shippingAddress.postalCode` | String | ❌ | ZIP/Postal code |
| `shippingAddress.country` | String | ❌ | Country |
| `notes` | String | ❌ | Special order notes |
| `createdAt` | DateTime | Auto | Record creation timestamp |
| `updatedAt` | DateTime | Auto | Record last update timestamp |

### Example Order Document

```javascript
{
  _id: ObjectId("..."),
  orderNumber: "ORD-123456-789",
  userId: ObjectId("..."), // Reference to Customer User
  items: [
    {
      productId: ObjectId("..."),
      quantity: 2,
      price: 99.99,
      vendorId: ObjectId("...") // Reference to Vendor User
    },
    {
      productId: ObjectId("..."),
      quantity: 1,
      price: 49.99,
      vendorId: ObjectId("...")
    }
  ],
  totalPrice: 249.97,
  totalCommission: 25.00,
  totalVendorAmount: 224.97,
  paymentMethod: "credit_card",
  paymentStatus: "completed",
  orderStatus: "confirmed",
  shippingAddress: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    postalCode: "10001",
    country: "USA"
  },
  notes: "Please deliver after 5 PM",
  createdAt: "2026-04-10T12:00:00Z",
  updatedAt: "2026-04-10T12:00:00Z"
}
```

### Relationships

- **userId** → Links to User schema (customer who placed the order)
- **items[].productId** → Links to Product schema
- **items[].vendorId** → Links to User schema (vendor)

### Auto-Generated Fields

- **orderNumber** - Generated before save using timestamp and random number
- **totalPrice** - Calculated from items based on quantity × price

### Indexes

- `userId` - Fast lookup of customer orders
- `orderNumber` - Unique identifier lookup
- `orderStatus` - Fast filtering by order status
- `paymentStatus` - Fast filtering by payment status
- `createdAt` - For sorting by creation date

### Computed Fields

- **subtotal** - Virtual field: totalPrice - totalCommission

---

## Data Relationships Diagram

```
┌─────────────────────────────────────────────────────┐
│                     USER                             │
├─────────────────────────────────────────────────────┤
│ _id, name, email, password, role, isActive, etc.    │
│                                                       │
│ ┌──────────────── can have ───────────────┐         │
│ │ (role: vendor)                           │         │
│ │ vendorDetails: {...}                     │         │
└─┼────────────────────────────────────────┬──────────┘
  │                                        │
  │ vendorId                               │ userId
  │ (one-to-many)                          │ (one-to-many)
  ▼                                        ▼
┌─────────────────────┐          ┌──────────────────┐
│      PRODUCT        │          │      ORDER       │
├─────────────────────┤          ├──────────────────┤
│ _id                 │          │ _id              │
│ name                │          │ orderNumber      │
│ price               │          │ userId ──────┐   │
│ category            │          │ items: [     │   │
│ vendorId ──────┐    │          │   {          │   │
│ stock           │    │          │   productId  │   │
│ rating          │    │          │   quantity   │   │
└────────────────┼────┘          │   price      │   │
                 │               │   vendorId┐  │   │
                 │               │   }       │  │   │
                 │               │ ]         │  │   │
                 │               │ paymentStatus│   │
                 │               │ orderStatus  │   │
                 └──────────────────────────────┼───┘
                 (many-to-many via Order items)│
                                               │
                                    References USER(vendor)
```

---

## Usage Examples

### Creating a Product

```javascript
const Product = require('./models/Product');

const product = await Product.create({
  name: "Wireless Mouse",
  description: "Ergonomic wireless mouse",
  price: 29.99,
  category: "Electronics",
  stock: 100,
  vendorId: "60d5ec49c1234567890abcde", // Vendor's User ID
});
```

### Querying Products by Vendor

```javascript
const products = await Product.find({ vendorId: vendorId }).populate('vendorId');
```

### Creating an Order

```javascript
const Order = require('./models/Order');

const order = await Order.create({
  userId: customerId,
  items: [
    {
      productId: productId1,
      quantity: 2,
      price: 29.99,
      vendorId: vendorId1,
    },
  ],
  totalPrice: 59.98,
  paymentMethod: "credit_card",
  shippingAddress: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    postalCode: "10001",
    country: "USA",
  },
});
```

### Updating Order Status

```javascript
const order = await Order.findByIdAndUpdate(
  orderId,
  { orderStatus: "shipped", paymentStatus: "completed" },
  { new: true }
);
```

---

## Best Practices

1. **Always validate vendorId exists** before creating products
2. **Store historical prices** in Order.items to maintain accuracy
3. **Use transactions** when updating stock and creating orders
4. **Index frequently queried fields** for performance
5. **Denormalize vendorId in Order.items** for faster vendor splits calculation
6. **Use population carefully** to avoid N+1 queries
7. **Archive old orders** to maintain database performance

---

## Validation Rules Summary

| Schema | Field | Validation |
|--------|-------|-----------|
| User | email | Must be unique and valid format |
| User | password | Min 6 characters, auto-hashed |
| User | role | Enum: `customer`, `vendor`, `admin` |
| Product | price | Must be number ≥ 0 |
| Product | stock | Must be integer ≥ 0 |
| Product | rating | 0-5 range |
| Order | payment_method | Enum: credit_card, debit_card, paypal, bank_transfer |
| Order | order_status | Enum: pending, confirmed, shipped, delivered, cancelled |
| Order | payment_status | Enum: pending, completed, failed, refunded |

