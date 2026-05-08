# Multi-Vendor Marketplace API

A Node.js Express server for a multi-vendor marketplace with user authentication, role-based access control, and MongoDB integration.

## Features

- ✅ User registration and login
- ✅ JWT-based authentication
- ✅ Role-based access control (Customer, Vendor, Admin)
- ✅ MongoDB integration with Mongoose
- ✅ Password hashing with bcryptjs
- ✅ CORS support
- ✅ Error handling middleware
- ✅ User profile management

## Project Structure

```
backend/
├── config/
│   └── database.js           # MongoDB connection configuration
├── middleware/
│   └── auth.js               # JWT authentication & authorization middleware
├── models/
│   └── User.js               # User schema with roles and vendor details
├── routes/
│   └── auth.js               # Authentication routes (register, login, profile)
├── index.js                  # Main server file
├── package.json              # Dependencies
└── .env.example              # Environment variables template
```

## Installation

### Prerequisites
- Node.js (v14+)
- MongoDB (running locally or connection string)
- npm or yarn

### Setup

1. **Install dependencies** (already done):
```bash
npm install
```

2. **Create `.env` file** from `.env.example`:
```bash
cp .env.example .env
```

3. **Update `.env` with your values**:
```env
MONGODB_URI=mongodb://localhost:27017/multivendor-marketplace
JWT_SECRET=your_super_secret_jwt_key_change_this
PORT=5000
NODE_ENV=development
```

## Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### 1. Register User
- **URL**: `/auth/register`
- **Method**: `POST`
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "customer"
}
```
- **Valid roles**: `customer`, `vendor`, `admin` (defaults to `customer`)
- **Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "isActive": true,
      "createdAt": "2026-04-10T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 2. Login User
- **URL**: `/auth/login`
- **Method**: `POST`
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response**: Returns user object and JWT token (valid for 7 days)

#### 3. Get Current User (Protected)
- **URL**: `/auth/me`
- **Method**: `GET`
- **Headers**:
```
Authorization: Bearer <your_token_here>
```
- **Response**: Current user details

#### 4. Admin Only Route (Protected)
- **URL**: `/auth/admin-only`
- **Method**: `GET`
- **Headers**:
```
Authorization: Bearer <admin_token>
```
- **Response**: Only accessible by users with `admin` role

#### 5. Vendor Only Route (Protected)
- **URL**: `/auth/vendor-only`
- **Method**: `GET`
- **Headers**:
```
Authorization: Bearer <vendor_token>
```
- **Response**: Only accessible by users with `vendor` role

#### 6. Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Response**: Server status

## User Model Schema

```javascript
{
  name: String (required, max 50 chars),
  email: String (required, unique, valid email format),
  password: String (required, min 6 chars, hashed),
  role: String (enum: ['customer', 'vendor', 'admin'], default: 'customer'),
  profileImage: String (optional),
  isActive: Boolean (default: true),
  vendorDetails: {
    companyName: String,
    companyDescription: String,
    businessLicense: String,
    taxId: String,
    isApproved: Boolean (default: false)
  },
  timestamps: true (createdAt, updatedAt)
}
```

## Authentication Flow

1. **Register**: User provides name, email, password, and role
2. **Password**: Automatically hashed using bcryptjs before storing
3. **Token**: JWT token issued upon successful registration/login
4. **Token Format**: `Authorization: Bearer <token>`
5. **Token Validity**: 7 days
6. **Protected Routes**: Include token in Authorization header to access protected endpoints

## Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Customer** | Basic user, can browse products, place orders |
| **Vendor** | Can manage products, view sales, vendor-only routes |
| **Admin** | Full system access, admin-only routes |

## Error Handling

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Optional error details"
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Server Error

## Testing with Postman/cURL

### Example: Register a Customer
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Dot",
    "email": "jane@example.com",
    "password": "securepass123",
    "role": "customer"
  }'
```

### Example: Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "securepass123"
  }'
```

### Example: Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/multivendor-marketplace` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your_secret_key_here` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |

## Security Notes

- ⚠️ Change `JWT_SECRET` in production to a strong, random string
- ⚠️ Never commit `.env` file to version control
- ⚠️ Use HTTPS in production
- ⚠️ Implement rate limiting for production
- ⚠️ Passwords are automatically hashed before storage
- ⚠️ Password fields are excluded from API responses

## Next Steps

Future enhancements can include:
- Email verification for new accounts
- Password reset functionality
- Refresh tokens
- Google/OAuth authentication
- Product management routes
- Order management routes
- Review and rating system
- Payment integration

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify connection string format

### JWT Token Errors
- Token may have expired (7-day validity)
- Check token format: `Bearer <token>`
- Ensure `JWT_SECRET` matches between registration and validation

### Port Already in Use
- Change `PORT` in `.env` to another available port
- Or kill the process using the current port

## Support

For issues or questions, please check the code comments or review the API documentation above.
