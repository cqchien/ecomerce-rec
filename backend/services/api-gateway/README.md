# API Gateway

API Gateway service for the e-commerce microservices platform, providing unified entry point, authentication, rate limiting, and request routing.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Routing](#routing)
- [Security](#security)
- [Usage Examples](#usage-examples)

## ✨ Features

- **Unified Entry Point**: Single endpoint for all microservices
- **Authentication & Authorization**: JWT-based authentication with refresh tokens
- **Request Routing**: Intelligent routing to backend microservices
- **Rate Limiting**: Protect services from abuse with configurable limits
- **CORS Support**: Configurable CORS for frontend applications
- **Request/Response Transformation**: Sanitize and transform requests/responses
- **Health Monitoring**: Monitor health of all backend services
- **Error Handling**: Centralized error handling and logging
- **Security**: Helmet.js security headers, request validation
- **Caching**: Redis caching for sessions and rate limiting

## 🏗️ Architecture

```
Client Request
     ↓
API Gateway (Port 3000)
     ├── Authentication (JWT)
     ├── Rate Limiting
     ├── Request Validation
     └── Route to Service
          ├── User Service (3003)
          ├── Cart Service (3004)
          ├── Order Service (3005)
          ├── Payment Service (3006)
          ├── Product Service (50051)
          └── Inventory Service (50052)
```

## 🛠️ Tech Stack

- **Framework**: NestJS 10.x
- **HTTP Client**: @nestjs/axios (Axios wrapper)
- **Authentication**: @nestjs/jwt, passport-jwt
- **Rate Limiting**: @nestjs/throttler
- **Cache**: Redis (ioredis 5.3.2)
- **Security**: Helmet.js
- **Validation**: class-validator 0.14.0
- **Language**: TypeScript 5.1.3

## 📦 Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
```

## ⚙️ Configuration

### Environment Variables

```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
NODE_ENV=development
PORT=3000

# CORS
CORS_ORIGIN=http://localhost:3001

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Service URLs
USER_SERVICE_URL=http://localhost:3003
CART_SERVICE_URL=http://localhost:3004
ORDER_SERVICE_URL=http://localhost:3005
PAYMENT_SERVICE_URL=http://localhost:3006
PRODUCT_SERVICE_URL=http://localhost:50051
INVENTORY_SERVICE_URL=http://localhost:50052

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 Running the Service

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API Gateway will be available at `http://localhost:3000/api`

## 📡 API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Proxied Routes

All requests to the following routes are automatically forwarded to respective microservices:

#### Products
```http
GET /api/products
GET /api/products/:id
POST /api/products (requires auth)
PUT /api/products/:id (requires auth)
DELETE /api/products/:id (requires auth)
```

#### Users
```http
GET /api/users/:id (requires auth)
PUT /api/users/:id (requires auth)
GET /api/users/:id/addresses (requires auth)
POST /api/users/:id/addresses (requires auth)
```

#### Cart
```http
GET /api/cart/:userId (requires auth)
POST /api/cart/add (requires auth)
PUT /api/cart/update (requires auth)
DELETE /api/cart/remove (requires auth)
```

#### Orders
```http
POST /api/orders (requires auth)
GET /api/orders/:id (requires auth)
GET /api/orders/user/:userId (requires auth)
PUT /api/orders/:id/status (requires auth)
DELETE /api/orders/:id/cancel (requires auth)
```

#### Payments
```http
POST /api/payments (requires auth)
GET /api/payments/:id (requires auth)
POST /api/payments/:id/confirm (requires auth)
POST /api/payments/:id/refund (requires auth)
```

### Health Check

```http
GET /api/health

Response:
{
  "status": "ok",
  "service": "api-gateway",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "user-service": { "status": "healthy", "responseTime": "50ms" },
    "cart-service": { "status": "healthy", "responseTime": "45ms" },
    "order-service": { "status": "healthy", "responseTime": "52ms" },
    "payment-service": { "status": "healthy", "responseTime": "48ms" }
  }
}
```

## 🔐 Authentication

### JWT-Based Authentication

The API Gateway uses JWT (JSON Web Tokens) for authentication:

1. **Register/Login**: Client receives `accessToken` and `refreshToken`
2. **Authenticated Requests**: Include token in Authorization header
3. **Token Refresh**: Use refresh token to get new access token

### Making Authenticated Requests

```http
GET /api/orders/user/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Public Routes (No Authentication Required)

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/refresh`
- `GET /api/health`
- `GET /api/products`
- `GET /api/products/:id`

All other routes require authentication.

## 🛡️ Rate Limiting

Rate limiting is applied globally and per-route:

### Global Rate Limits
- **Window**: 15 minutes
- **Max Requests**: 100 per window

### Route-Specific Limits
- **Auth Routes**: 5 requests per 15 minutes
- **Payment Routes**: 10 requests per minute

### Rate Limit Response

When rate limit is exceeded:
```json
{
  "statusCode": 429,
  "message": "Too many requests, please try again later"
}
```

## 🔄 Routing

### Request Flow

```
1. Client Request → API Gateway
2. Authentication Check (if required)
3. Rate Limit Check
4. Request Validation
5. Route to Target Service
6. Transform Response
7. Return to Client
```

### Service Routing Table

| Route Prefix | Target Service | Port |
|-------------|----------------|------|
| `/products` | Product Service | 50051 |
| `/inventory` | Inventory Service | 50052 |
| `/users` | User Service | 3003 |
| `/cart` | Cart Service | 3004 |
| `/orders` | Order Service | 3005 |
| `/payments` | Payment Service | 3006 |

### Request Timeout

- **Default**: 30 seconds
- **Payment Operations**: 60 seconds
- **File Uploads**: 2 minutes

## 🔒 Security

### Security Features

1. **Helmet.js**: HTTP security headers
2. **CORS**: Configurable cross-origin resource sharing
3. **Input Validation**: class-validator for request validation
4. **JWT**: Secure token-based authentication
5. **Rate Limiting**: Prevent abuse and DoS attacks
6. **Request Size Limits**: Prevent large payload attacks
   - JSON: 10MB
   - URL Encoded: 10MB
   - File Upload: 50MB

### Security Headers

Helmet.js automatically sets the following security headers:
- `X-DNS-Prefetch-Control`
- `X-Frame-Options`
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-XSS-Protection`

## 📝 Usage Examples

### Complete Authentication Flow

```typescript
// 1. Register
const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe'
  })
});

const { data } = await registerResponse.json();
const { accessToken, refreshToken } = data;

// 2. Make authenticated request
const ordersResponse = await fetch('http://localhost:3000/api/orders/user/user-id', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

// 3. Refresh token when needed
const refreshResponse = await fetch('http://localhost:3000/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});
```

### Creating an Order Through Gateway

```typescript
const orderResponse = await fetch('http://localhost:3000/api/orders', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'user-id',
    items: [
      { productId: 'product-id', quantity: 2 }
    ],
    paymentMethod: 'CREDIT_CARD',
    shippingAddress: { /* address details */ },
    billingAddress: { /* address details */ }
  })
});
```

## 🔧 Middleware

### Logging Middleware

Logs all incoming requests and responses:
```
GET /api/products 200 1234b - 45ms - ::1 Mozilla/5.0...
```

### Error Handling

All errors are caught and formatted consistently:
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Resource not found",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/orders/invalid-id"
}
```

## 📊 Monitoring

### Health Checks

The gateway monitors health of all backend services:

```bash
curl http://localhost:3000/api/health
```

Services are checked every 30 seconds with 5-second timeout.

### Logging

- Request/Response logging
- Error logging with stack traces
- Service health check logging

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🚨 Error Codes

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 502 | Bad Gateway - Backend service error |
| 503 | Service Unavailable - Service is down |
| 504 | Gateway Timeout - Request timeout |

## 🔗 Integration

The API Gateway integrates with:

1. **All Microservices**: Routes requests to appropriate services
2. **Redis**: Session storage and rate limiting
3. **User Service**: Authentication and user management
4. **Frontend Applications**: Single entry point for UI

## 📄 License

MIT
