# Quick Start Guide

## 1. Prerequisites
- MongoDB running locally or a connection string
- Node.js installed

## 2. Configuration
- `.env` file is already created with development settings
- Update `MONGODB_URI` if using a different MongoDB instance
- Change `JWT_SECRET` to a strong random string (especially for production)

## 3. Start the Server

### Option A: Development Mode (with auto-reload)
```bash
npm run dev
```

### Option B: Production Mode
```bash
npm start
```

You should see:
```
Server is running on port 5000
MongoDB Connected: localhost
```

## 4. Test the API

### Using cURL (terminal/command line):

**Register a user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpass123",
    "role": "customer"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

### Using Postman:
1. Create a new POST request to `http://localhost:5000/api/auth/register`
2. Set Body > raw > JSON
3. Paste the registration data (see above)
4. Click Send
5. Copy the token from the response
6. Use that token in the Authorization header for protected routes

### Using VS Code REST Client:
1. Open `API.rest` file
2. Click "Send Request" above each request
3. Update `@token` variable with the token from registration response

## 5. Key Files

| File | Purpose |
|------|---------|
| `index.js` | Main server entry point |
| `models/User.js` | Database schema for users |
| `routes/auth.js` | Authentication API endpoints |
| `middleware/auth.js` | JWT verification & role authorization |
| `config/database.js` | MongoDB connection setup |
| `.env` | Environment variables (change JWT_SECRET!) |

## 6. Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Create new user |
| POST | `/api/auth/login` | ❌ | Login user, get token |
| GET | `/api/auth/me` | ✅ | Get current user |
| GET | `/api/auth/admin-only` | ✅ Admin | Admin-only endpoint |
| GET | `/api/auth/vendor-only` | ✅ Vendor | Vendor-only endpoint |
| GET | `/api/health` | ❌ | Server health check |

## 7. Common Issues

**MongoDB Connection Error:**
- Check if MongoDB is running
- Verify MONGODB_URI in .env file
- Default: `mongodb://localhost:27017/multivendor-marketplace`

**Port 5000 Already in Use:**
- Change PORT in .env to another number (e.g., 5001, 3000)
- Or kill the process using port 5000

**CORS Errors:**
- CORS is enabled for all origins (*)
- Change in `index.js` if needed

**Token Expired:**
- Tokens last 7 days
- Get a new token by logging in again

## 8. Next Steps

Ready to expand? Consider adding:
- Product routes (CRUD operations)
- Order management
- Category management
- Inventory management
- Payment processing
- More detailed error handling
- Request validation middleware

See `README.md` for complete documentation.
