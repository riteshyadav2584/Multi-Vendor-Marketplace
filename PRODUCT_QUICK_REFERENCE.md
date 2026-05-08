# Product Management API - Quick Reference

## Quick Summary

The Product Management APIs provide full CRUD (Create, Read, Update, Delete) operations for products with role-based access control.

---

## Available Endpoints

### Create Product ✨
```
POST /api/products
Authorization: Required (Vendor/Admin only)
```
**Request**:
```json
{
  "name": "Product Name",
  "price": 99.99,
  "category": "Category",
  "description": "Optional description",
  "stock": 50,
  "image": "https://url.jpg"
}
```

**Response**: 201 Created with product object including `_id`

**Who can**: Vendors (own only), Admins (any)

---

### Get All Products 📖
```
GET /api/products
Authorization: Not required (Public)
```
**Query parameters**:
- `page=1` - Page number (default: 1)
- `limit=10` - Items per page (default: 10)
- `category=Electronics` - Filter by category
- `search=keyword` - Full-text search

**Response**: 200 OK with array of products and pagination info

**Who can**: Everyone

---

### Get Product by ID 🔍
```
GET /api/products/:id
Authorization: Not required (Public)
```
**Path parameter**: `id` - MongoDB ObjectId

**Response**: 200 OK with single product object

**Who can**: Everyone

---

### Get Products by Vendor 🛍️
```
GET /api/products/vendor/:vendorId
Authorization: Not required (Public)
```
**Path parameter**: `vendorId` - Vendor's User ID

**Response**: 200 OK with array of vendor's products

**Who can**: Everyone

---

### Get My Products 👨‍💼
```
GET /api/products/my-products
Authorization: Required (Vendor/Admin only)
```
**Response**: 200 OK with logged-in vendor's products

**Who can**: Vendors (own products), Admins (all products)

---

### Update Product ✏️
```
PUT /api/products/:id
Authorization: Required (Vendor/Admin only)
```
**Request** (partial update - send only fields to change):
```json
{
  "price": 79.99,
  "stock": 40,
  "description": "New description"
}
```

**Response**: 200 OK with updated product

**Restrictions**:
- Vendors can only update their own products
- Admins can update any product
- All validation rules apply

**Who can**: Product owner (Vendor) or Admin

---

### Delete Product 🗑️
```
DELETE /api/products/:id
Authorization: Required (Vendor/Admin only)
```
**Response**: 200 OK with success message

**Who can**: Product owner (Vendor) or Admin

---

## Validation Rules at a Glance

| Field | Required | Rules |
|-------|----------|-------|
| `name` | ✅ | 1-100 chars, no duplicates per vendor |
| `price` | ✅ | 0-999,999.99 |
| `category` | ✅ | 1-50 chars |
| `description` | ❌ | Max 500 chars |
| `stock` | ❌ | 0-1,000,000, must be whole number |
| `image` | ❌ | Valid URL, max 500 chars |

**Validation happens on**:
- Create (POST)
- Update (PUT) - only for fields being changed

---

## Common Use Cases

### Scenario 1: Vendor Creates Product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer <vendor_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gaming Laptop",
    "price": 1299.99,
    "category": "Electronics",
    "stock": 10
  }'
```

### Scenario 2: Customer Browses Products
```bash
# Get all Electronics products
curl -X GET "http://localhost:5000/api/products?category=Electronics&page=1&limit=20"

# Search for product
curl -X GET "http://localhost:5000/api/products?search=gaming"
```

### Scenario 3: Vendor Updates Own Product
```bash
curl -X PUT http://localhost:5000/api/products/<product_id> \
  -H "Authorization: Bearer <vendor_token>" \
  -H "Content-Type: application/json" \
  -d '{"price": 1199.99, "stock": 8}'
```

### Scenario 4: Vendor Deletes Product
```bash
curl -X DELETE http://localhost:5000/api/products/<product_id> \
  -H "Authorization: Bearer <vendor_token>"
```

### Scenario 5: View Specific Vendor's Products
```bash
curl -X GET "http://localhost:5000/api/products/vendor/<vendor_id>"
```

---

## Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Action description",
  "data": { /* product object or array */ },
  "pagination": { /* optional pagination info */ }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ /* validation errors if applicable */ ]
}
```

---

## HTTP Status Codes

| Code | Scenario |
|------|----------|
| 201 | Product created successfully |
| 200 | Successful GET/PUT |
| 400 | Invalid input, validation failed, duplicate name |
| 401 | Missing token, authentication required |
| 403 | Not authorized (e.g., customer trying to create) |
| 404 | Product not found |
| 500 | Server error |

---

## Authorization Matrix

| Action | Customer | Vendor | Admin |
|--------|----------|--------|-------|
| **Create** | ❌ | ✅ | ✅ |
| **Read (public)** | ✅ | ✅ | ✅ |
| **Update own** | ❌ | ✅ | ✅ |
| **Update others** | ❌ | ❌ | ✅ |
| **Delete own** | ❌ | ✅ | ✅ |
| **Delete others** | ❌ | ❌ | ✅ |
| **My products** | ❌ | ✅ | ✅ |

---

## Common Errors & Solutions

### ❌ "No token provided"
- **Problem**: Missing Authorization header
- **Solution**: Add header: `Authorization: Bearer <token>`

### ❌ "Not authorized to update this product"
- **Problem**: Vendor trying to update another vendor's product
- **Solution**: Only admins can edit other vendors' products

### ❌ "Validation failed"
- **Problem**: Invalid field values
- **Solution**: Check error messages for specific field issues

### ❌ "You already have a product with the name..."
- **Problem**: Attempting to create duplicate product name for same vendor
- **Solution**: Use different name or delete old product first

### ❌ "Product not found"
- **Problem**: Invalid or non-existent product ID
- **Solution**: Verify the product ID is correct

### ❌ "Invalid product ID format"
- **Problem**: ID is not valid MongoDB ObjectId format
- **Solution**: Use valid 24-character hex string

---

## Performance Tips

1. **Use pagination** for product lists:
   ```
   GET /api/products?page=1&limit=50
   ```

2. **Filter by category** instead of getting all:
   ```
   GET /api/products?category=Electronics
   ```

3. **Use search** for specific products:
   ```
   GET /api/products?search=gaming%20laptop
   ```

4. **Cache results** on client-side when possible

5. **Batch operations** - Create multiple products in separate requests (no bulk endpoint yet)

---

## Testing Checklist

- [ ] Create product as vendor ✅
- [ ] Get all products (public) ✅
- [ ] Get single product ✅
- [ ] Update own product ✅
- [ ] Try to update other's product (should fail) ✅
- [ ] Delete own product ✅
- [ ] Try to create as customer (should fail) ✅
- [ ] Try to update without token (should fail) ✅
- [ ] Filter by category ✅
- [ ] Search by keyword ✅
- [ ] Test pagination ✅
- [ ] Test with invalid data ✅
- [ ] Get vendor's products ✅

---

## Field Details

### `name`
- Identifies the product
- Must be unique per vendor
- Used in search and filters

### `price`
- In decimal format (e.g., 99.99)
- Cannot be negative
- Used for order calculations

### `category`
- Groups similar products
- Examples: Electronics, Clothing, Home, Books
- Used for filtering

### `description`
- Additional product details
- Displayed in product details page
- Included in full-text search

### `stock`
- Quantity available
- Used in order validation
- Can be updated anytime

### `image`
- Product picture URL
- Should be valid image URL
- Displayed in product listings

### `isActive`
- Show/hide product without deleting
- Can be toggled via update
- Inactive products not shown in lists

---

## Next Steps

1. **Read** [PRODUCT_API.md](PRODUCT_API.md) for complete API documentation
2. **Test** endpoints using [API.rest](API.rest) file
3. **Implement** frontend integration
4. **Add** product reviews/ratings endpoint
5. **Add** product images/gallery endpoint

---

## File References

- **Full Documentation**: [PRODUCT_API.md](PRODUCT_API.md)
- **Testing File**: [API.rest](API.rest)
- **Validators**: [utils/validators.js](utils/validators.js)
- **Route Handler**: [routes/products.js](routes/products.js)
- **Database Schema**: [models/Product.js](models/Product.js)
- **Middleware**: [middleware/auth.js](middleware/auth.js)

---

## Summary

✅ **Complete CRUD operations** - Create, Read, Update, Delete  
✅ **Role-based access** - Different permissions per role  
✅ **Vendor ownership** - Vendors can only manage own products  
✅ **Admin override** - Admins can manage any product  
✅ **Input validation** - Comprehensive field validation  
✅ **Search & filter** - Find products easily  
✅ **Pagination** - Handle large product lists  
✅ **Error handling** - Clear error messages  

**You're all set to manage products!** 🚀
