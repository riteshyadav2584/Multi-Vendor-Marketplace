# Multi-Vendor Marketplace - Frontend Documentation

## Overview

This is a responsive, single-page HTML/CSS/JavaScript frontend for the Multi-Vendor Marketplace. It provides customers, vendors, and admins with intuitive interfaces to manage products, orders, and commissions.

## File Structure

```
frontend/
├── index.html                 # Home page - Product listing & shopping cart
├── login.html                 # Login/Register page
├── vendor-dashboard.html      # Vendor dashboard
├── admin-dashboard.html       # Admin dashboard
├── styles.css                 # Global styles (responsive design)
├── app.js                     # Home page logic
├── auth.js                    # Authentication logic
├── vendor-dashboard.js        # Vendor dashboard logic
├── admin-dashboard.js         # Admin dashboard logic
└── README.md                  # This file
```

## Pages

### 1. Home Page (index.html)

**Features:**
- Product listing with filtering by category and sorting
- Search functionality
- Product cards with images, prices, stock info
- Shopping cart with add/remove/quantity adjustment
- Cart summary showing subtotal, commission (10%), and total
- Checkout modal with shipping address form
- Responsive for mobile, tablet, and desktop

**URL:** `http://localhost:3000/` (or open index.html)

**Functionality:**
- Browse products by category
- Search products by name
- Sort by price and popularity
- Add products to cart
- View commission breakdown in real-time
- Proceed to checkout with address and payment method

### 2. Login/Register Page (login.html)

**Features:**
- Toggle between Login and Register forms
- Registration with role selection (customer, vendor, admin)
- Vendor-specific fields (store name, description, logo)
- Email validation
- Password strength indication
- Error/success messages
- Auto-redirect based on user role

**URL:** `http://localhost:3000/login.html`

**Functionality:**
- Login with email and password
- Register new account
- Select user role (customer, vendor, admin)
- For vendors: Add store information
- Token-based authentication
- Session persistence via localStorage

### 3. Vendor Dashboard (vendor-dashboard.html)

**Features:**
- 6 tabbed navigation sections
- Overview tab with stats (products, orders, earnings, ratings)
- Product management (add, edit, delete)
- Order tracking and status updates
- Earnings reports with detailed breakdown
- Store settings management

**URL:** `http://localhost:3000/vendor-dashboard.html`

**Tabs:**
1. **Overview** - Dashboard statistics
   - Total products
   - Total orders
   - Total earnings
   - Average rating

2. **My Products** - Product management
   - List all products
   - Edit product details
   - Delete products

3. **Add Product** - Create new products
   - Name, description, category
   - Price, stock, image URL
   - Form validation

4. **Orders** - View vendor's orders
   - Filter by status
   - See customer details
   - Update order status
   - View earnings per order

5. **Earnings** - Financial reports
   - Total revenue
   - Total commission paid
   - Net earnings
   - Detailed earnings table by order

6. **Settings** - Store configuration
   - Store name and description
   - Logo URL
   - Contact email

### 4. Admin Dashboard (admin-dashboard.html)

**Features:**
- 7 tabbed management sections
- Platform-wide analytics
- User/vendor/product/order management
- Commission tracking and financial reports
- Responsive data tables with actions

**URL:** `http://localhost:3000/admin-dashboard.html`

**Tabs:**
1. **Overview** - Platform statistics
   - Total users
   - Active vendors
   - Total products
   - Total orders
   - Total commission earned
   - Total vendor payouts

2. **Users** - User management
   - View all users
   - User details and roles
   - User status management

3. **Vendors** - Vendor management
   - List all vendors
   - Products per vendor
   - Total sales tracking
   - Commission paid per vendor
   - Vendor ratings

4. **Orders** - Order management
   - View all orders
   - Filter by order status
   - Filter by payment status
   - Order details modal
   - Update order/payment status

5. **Commissions** - Commission analytics
   - Total commission earned
   - Pending payouts
   - Average commission per order
   - Commission breakdown by vendor

6. **Products** - Product management
   - View all products
   - Search products
   - Filter by category
   - Product details and analytics

7. **Reports** - Financial reporting
   - Select reporting period
   - Order count in period
   - Total revenue
   - Platform commission
   - Vendor payouts
   - Top vendors by commission

## Styling

### Responsive Design

All pages are fully responsive using CSS Grid and Flexbox:

**Breakpoints:**
- Desktop: > 768px - Full layout with sidebars
- Tablet: 481px - 768px - Single column with collapsible menus
- Mobile: ≤ 480px - Optimized for touch

### Color Scheme

```css
Primary Color: #6366f1 (Indigo)
Secondary Color: #ec4899 (Pink)
Success: #10b981 (Green)
Danger: #ef4444 (Red)
Warning: #f59e0b (Orange)
Info: #3b82f6 (Blue)
```

### Components

- **Buttons:** Primary, secondary, danger, large variants
- **Forms:** Input fields, selects, textareas, radio groups
- **Cards:** Product cards, stat cards, order cards
- **Tables:** Responsive tables with status badges
- **Modals:** For checkout, order details, product editing
- **Navigation:** Sticky navbar with responsive menu

## API Integration

### Base URL

The frontend communicates with the backend API at:
```javascript
http://localhost:5000/api
```

### Authentication

- Tokens are stored in `localStorage` with key `authToken`
- User data stored with key `currentUser`
- Cart stored with key `cart`
- Authorization header: `Bearer <token>`

### Key API Endpoints Used

**Authentication:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user

**Products:**
- `GET /products` - List all products
- `GET /products/:id` - Get product details
- `POST /products` - Create product (vendor/admin)
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `GET /products/my-products` - Vendor's products

**Orders:**
- `POST /orders` - Create order (customer)
- `GET /orders/my-orders` - Customer's orders
- `GET /orders/vendor-orders` - Vendor's orders
- `GET /orders` - All orders (admin)
- `GET /orders/:id` - Order details
- `PUT /orders/:id/status` - Update order status
- `PUT /orders/:id/payment-status` - Update payment status (admin)

## Usage Instructions

### 1. Start the Backend Server

```bash
cd backend
npm install
npm start
```

Server runs on http://localhost:5000

### 2. Open Frontend

```bash
# Open index.html in a web browser
# Or use a local server:
python -m http.server 3000
# OR
npx http-server
```

Frontend runs on http://localhost:3000 (or just open index.html)

### 3. Create Test Accounts

Navigate to login.html and register:

**Customer Account:**
- Role: Customer
- Email: customer@test.com
- Password: test123

**Vendor Account:**
- Role: Vendor
- Email: vendor@test.com
- Password: test123
- Store Name: My Store
- Store Description: Test store

**Admin Account:**
- Role: Admin
- Email: admin@test.com
- Password: test123

### 4. Test Workflow

**As Customer:**
1. Login with customer account
2. Browse products on home page
3. Add products to cart
4. View commission breakdown (10% of total)
5. Checkout with shipping address
6. View order in "My Orders"

**As Vendor:**
1. Login with vendor account
2. Go to vendor dashboard
3. Add new products
4. View incoming orders
5. Update order status (pending → confirmed → shipped → delivered)
6. Check earnings report

**As Admin:**
1. Login with admin account
2. View platform statistics
3. Manage users/vendors/products
4. View all orders across platform
5. Track commission earnings
6. Generate financial reports

## Mobile Optimization

The frontend is optimized for mobile devices:

- **Touch-friendly buttons** with adequate spacing
- **Responsive images** that scale appropriately
- **Collapsible menus** on mobile
- **Simplified forms** with large input fields
- **Bottom-aligned checkout** for thumb reach
- **Mobile-first CSS** approach

## Features Implemented

### Home Page
- ✅ Product grid with filtering
- ✅ Search functionality
- ✅ Shopping cart with persistence
- ✅ Commission display (10%)
- ✅ Checkout workflow
- ✅ Authentication UI

### Login/Register
- ✅ Form switching
- ✅ Role selection
- ✅ Vendor details form
- ✅ Error handling
- ✅ Success messages
- ✅ Auto-redirect after auth

### Vendor Dashboard
- ✅ Dashboard overview with stats
- ✅ Product management (CRUD)
- ✅ Order tracking
- ✅ Order status updates
- ✅ Earnings reports
- ✅ Store settings

### Admin Dashboard
- ✅ Platform overview
- ✅ User management structure
- ✅ Vendor management
- ✅ Order management
- ✅ Commission tracking
- ✅ Product administration
- ✅ Financial reports

## Future Enhancements

- [ ] Real-time notifications using WebSockets
- [ ] Order tracking with map integration
- [ ] Customer reviews and ratings system
- [ ] Bulk operations (export CSV, etc.)
- [ ] Advanced filtering and search
- [ ] Payment gateway integration UI
- [ ] Refund management
- [ ] Vendor dashboard analytics charts
- [ ] Dark mode theme
- [ ] Multi-language support
- [ ] PWA (Progressive Web App) support

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Performance

- Minimal external dependencies
- Fast load times (no heavy frameworks)
- Efficient API calls
- Optimized images and assets
- CSS Grid for efficient layouts

## Troubleshooting

### Pages Not Loading
- Ensure backend server is running on port 5000
- Open browser developer console (F12) for errors
- Check localStorage for token validity

### API Errors
- Verify backend API is responding
- Check network tab in DevTools
- Ensure you're logged in for protected routes

### Styling Issues
- Clear browser cache (Ctrl+Shift+Delete)
- Check if styles.css is loading
- Verify CSS variables in :root

### Authentication Issues
- Check localStorage for token and user data
- Try logging out and back in
- Clear browser storage if needed

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify backend is running and accessible
3. Check network requests in DevTools
4. Review API responses for error details
