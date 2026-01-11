# Order Service

Order management microservice for the e-commerce platform, built with NestJS and TypeORM.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Order Status Workflow](#order-status-workflow)
- [Events](#events)
- [Usage Examples](#usage-examples)

## ✨ Features

- **Order Management**: Create, retrieve, update, and cancel orders
- **Order Status Tracking**: Track order lifecycle with history
- **Payment Integration**: Support for multiple payment methods
- **Shipping & Tracking**: Manage shipping addresses and tracking information
- **Order Validation**: Comprehensive validation for order creation
- **Status Transitions**: Enforced valid status transitions
- **Event-Driven Architecture**: Emit events for order lifecycle changes
- **Caching**: Redis caching for improved performance
- **Audit Trail**: Complete order status history

## 🏗️ Architecture

The service follows **Clean Architecture** principles with four main layers:

```
src/
├── domain/                    # Domain Layer (Entities)
│   └── entities/
│       ├── order.entity.ts
│       ├── order-item.entity.ts
│       └── order-status-history.entity.ts
├── application/               # Application Layer (Business Logic)
│   ├── dtos/
│   │   ├── create-order.dto.ts
│   │   ├── update-order-status.dto.ts
│   │   ├── order-filters.dto.ts
│   │   └── cancel-order.dto.ts
│   └── services/
│       └── order.service.ts
├── infrastructure/            # Infrastructure Layer (External Services)
│   └── modules/
│       ├── order.module.ts
│       └── redis.module.ts
└── presentation/              # Presentation Layer (Controllers)
    └── controllers/
        ├── order.controller.ts
        └── health.controller.ts
```

## 🛠️ Tech Stack

- **Framework**: NestJS 10.x
- **ORM**: TypeORM 0.3.17
- **Database**: PostgreSQL
- **Cache**: Redis (ioredis 5.3.2)
- **Validation**: class-validator 0.14.0
- **Events**: @nestjs/event-emitter 2.0.3
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
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=order_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Application
NODE_ENV=development
PORT=3005

# CORS
CORS_ORIGIN=http://localhost:3000

# Service URLs
PRODUCT_SERVICE_URL=localhost:50051
INVENTORY_SERVICE_URL=localhost:50052
CART_SERVICE_URL=http://localhost:3004
USER_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3006
```

### Database Setup

```bash
# Create database
createdb order_db

# Run the application (TypeORM will auto-sync in development)
npm run start:dev
```

## 🚀 Running the Service

```bash
# Development mode with hot-reload
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The service will be available at `http://localhost:3005/api`

## 📡 API Endpoints

### Orders

#### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "userId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "variantId": "uuid",
      "quantity": 2
    }
  ],
  "paymentMethod": "CREDIT_CARD",
  "shippingAddress": {
    "recipientName": "John Doe",
    "phone": "+1234567890",
    "addressLine1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  },
  "billingAddress": { ... },
  "customerNotes": "Please deliver after 5 PM"
}
```

#### Get Order by ID
```http
GET /api/orders/:id
```

#### Get Order by Order Number
```http
GET /api/orders/number/:orderNumber
```

#### List User Orders
```http
GET /api/orders/user/:userId?status=PENDING&page=1&limit=20
```

Query Parameters:
- `status`: OrderStatus enum (optional)
- `fromDate`: ISO date string (optional)
- `toDate`: ISO date string (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

#### Update Order Status
```http
PUT /api/orders/:id/status
Content-Type: application/json

{
  "status": "SHIPPED",
  "trackingNumber": "1Z999AA10123456784",
  "carrier": "UPS",
  "note": "Package shipped via UPS Ground",
  "updatedBy": "admin-uuid"
}
```

#### Cancel Order
```http
DELETE /api/orders/:id/cancel
Content-Type: application/json

{
  "reason": "CUSTOMER_REQUEST",
  "note": "Customer requested cancellation",
  "cancelledBy": "user-uuid"
}
```

#### Get Order Status History
```http
GET /api/orders/:id/history
```

#### Get Tracking Information
```http
GET /api/orders/:id/tracking
```

### Health Check

```http
GET /api/health
```

## 🗄️ Database Schema

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR UNIQUE,
  user_id UUID,
  subtotal DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  total DECIMAL(10,2),
  status VARCHAR,
  payment_method VARCHAR,
  payment_intent_id VARCHAR,
  payment_id VARCHAR,
  paid_at TIMESTAMP,
  shipping_address JSONB,
  billing_address JSONB,
  tracking_number VARCHAR,
  carrier VARCHAR,
  shipped_at TIMESTAMP,
  estimated_delivery TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason VARCHAR,
  cancelled_by VARCHAR,
  customer_notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_status_created ON orders(status, created_at);
```

### Order Items Table
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID,
  variant_id UUID,
  name VARCHAR,
  image VARCHAR,
  sku VARCHAR,
  quantity INT,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  attributes JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(order_id, product_id, variant_id);
```

### Order Status History Table
```sql
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR,
  note TEXT,
  updated_by VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP
);

CREATE INDEX idx_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_history_order_created ON order_status_history(order_id, created_at);
```

## 📊 Order Status Workflow

### Status Enum
```typescript
enum OrderStatus {
  PENDING           // Order created, awaiting processing
  PROCESSING        // Order is being processed
  PAYMENT_PENDING   // Awaiting payment confirmation
  PAYMENT_FAILED    // Payment failed
  CONFIRMED         // Payment confirmed, order confirmed
  PREPARING         // Order is being prepared for shipment
  SHIPPED           // Order has been shipped
  DELIVERED         // Order delivered successfully
  CANCELLED         // Order cancelled
  REFUNDED          // Order refunded
}
```

### Valid Status Transitions
```
PENDING → [PROCESSING, PAYMENT_PENDING, CANCELLED]
PROCESSING → [PAYMENT_PENDING, CONFIRMED, CANCELLED]
PAYMENT_PENDING → [CONFIRMED, PAYMENT_FAILED, CANCELLED]
PAYMENT_FAILED → [PAYMENT_PENDING, CANCELLED]
CONFIRMED → [PREPARING, CANCELLED]
PREPARING → [SHIPPED, CANCELLED]
SHIPPED → [DELIVERED, CANCELLED]
DELIVERED → [REFUNDED]
CANCELLED → [REFUNDED]
REFUNDED → []
```

## 🎯 Events

The service emits the following events:

```typescript
// Order Events
order.created       // When a new order is created
order.confirmed     // When payment is confirmed
order.cancelled     // When order is cancelled
order.shipped       // When order is shipped
order.delivered     // When order is delivered

// Payment Events
payment.received    // When payment is received
payment.failed      // When payment fails

// Refund Events
refund.initiated    // When refund is initiated
refund.completed    // When refund is completed
```

## 📝 Usage Examples

### Creating an Order

```typescript
const order = await fetch('http://localhost:3005/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '123e4567-e89b-12d3-a456-426614174000',
    items: [
      {
        productId: '123e4567-e89b-12d3-a456-426614174001',
        quantity: 2
      }
    ],
    paymentMethod: 'CREDIT_CARD',
    shippingAddress: {
      recipientName: 'John Doe',
      phone: '+1234567890',
      addressLine1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US'
    },
    billingAddress: {
      recipientName: 'John Doe',
      phone: '+1234567890',
      addressLine1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US'
    }
  })
});
```

### Listing Orders with Filters

```typescript
const orders = await fetch(
  'http://localhost:3005/api/orders/user/123e4567-e89b-12d3-a456-426614174000?' +
  'status=CONFIRMED&page=1&limit=10'
);
```

### Updating Order Status

```typescript
const updated = await fetch('http://localhost:3005/api/orders/order-id/status', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'SHIPPED',
    trackingNumber: '1Z999AA10123456784',
    carrier: 'UPS',
    note: 'Package shipped'
  })
});
```

## 🔧 Business Rules

- **Max Items per Order**: 50 items
- **Min Order Amount**: $0.01
- **Max Order Amount**: $999,999.99
- **Cancellation Window**: 24 hours (configurable)
- **Auto-Confirm Payment**: 30 minutes
- **Shipping Estimate**: 7 days
- **Inventory Reservation TTL**: 15 minutes

## 🔒 Validation

All DTOs use class-validator for validation:

- Order must have at least 1 item
- Maximum 50 items per order
- Valid payment method required
- Valid shipping and billing addresses required
- Status transitions are validated
- UUID format validation for IDs

## 📊 Caching Strategy

- **Order by ID**: 5 minutes TTL
- **Order List**: 3 minutes TTL
- **Order History**: 10 minutes TTL
- **Order Tracking**: 2 minutes TTL

Cache is automatically invalidated on:
- Order creation
- Status updates
- Order cancellation

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📈 Monitoring

Health check endpoint: `GET /api/health`

Response:
```json
{
  "status": "ok",
  "service": "order-service",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔗 Integration Points

The Order Service integrates with:

1. **Product Service**: Fetch product details and pricing
2. **Inventory Service**: Reserve and commit stock
3. **Cart Service**: Convert cart to order
4. **User Service**: Retrieve user addresses
5. **Payment Service**: Process payments
6. **Notification Service**: Send order notifications (via events)

## 📄 License

MIT
