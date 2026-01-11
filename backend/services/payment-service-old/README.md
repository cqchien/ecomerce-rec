# Payment Service

Payment processing microservice for the e-commerce platform with Stripe integration, built with NestJS and TypeORM.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Payment Flow](#payment-flow)
- [Stripe Integration](#stripe-integration)
- [Events](#events)
- [Usage Examples](#usage-examples)

## ✨ Features

- **Payment Processing**: Stripe integration for credit/debit card payments
- **Payment Intents**: Secure payment intent creation and confirmation
- **Refund Management**: Full and partial refund support
- **Payment History**: Track all payments and refunds
- **Webhook Support**: Handle Stripe webhook events
- **Multiple Payment Methods**: Support for various payment methods
- **Event-Driven Architecture**: Emit events for payment lifecycle changes
- **Caching**: Redis caching for improved performance
- **Security**: PCI DSS compliant through Stripe

## 🏗️ Architecture

The service follows **Clean Architecture** principles with four main layers:

```
src/
├── domain/                    # Domain Layer (Entities)
│   └── entities/
│       ├── payment.entity.ts
│       └── refund.entity.ts
├── application/               # Application Layer (Business Logic)
│   ├── dtos/
│   │   ├── create-payment.dto.ts
│   │   ├── create-refund.dto.ts
│   │   └── confirm-payment.dto.ts
│   └── services/
│       └── payment.service.ts
├── infrastructure/            # Infrastructure Layer (External Services)
│   └── modules/
│       ├── payment.module.ts
│       └── redis.module.ts
└── presentation/              # Presentation Layer (Controllers)
    └── controllers/
        ├── payment.controller.ts
        └── health.controller.ts
```

## 🛠️ Tech Stack

- **Framework**: NestJS 10.x
- **ORM**: TypeORM 0.3.17
- **Database**: PostgreSQL
- **Cache**: Redis (ioredis 5.3.2)
- **Payment Provider**: Stripe 14.7.0
- **Validation**: class-validator 0.14.0
- **Events**: @nestjs/event-emitter 2.0.3
- **Language**: TypeScript 5.1.3

## 📦 Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your Stripe credentials
```

## ⚙️ Configuration

### Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=payment_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
NODE_ENV=development
PORT=3006

# Stripe (Required)
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

### Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Set up webhooks pointing to `http://your-domain/api/payments/webhook/stripe`
4. Add webhook secret to `.env`

## 🚀 Running the Service

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The service will be available at `http://localhost:3006/api`

## 📡 API Endpoints

### Payments

#### Create Payment Intent
```http
POST /api/payments
Content-Type: application/json

{
  "orderId": "uuid",
  "userId": "uuid",
  "amount": 99.99,
  "currency": "USD",
  "paymentMethod": "CREDIT_CARD",
  "receiptEmail": "customer@example.com",
  "description": "Order #12345"
}

Response:
{
  "success": true,
  "message": "Payment intent created successfully",
  "data": {
    "paymentId": "uuid",
    "paymentIntentId": "pi_xxx",
    "amount": 99.99,
    "currency": "USD",
    "status": "PENDING"
  }
}
```

#### Confirm Payment
```http
POST /api/payments/:id/confirm
Content-Type: application/json

{
  "paymentMethodId": "pm_card_xxx"
}
```

#### Get Payment by ID
```http
GET /api/payments/:id
```

#### Get Payment by Order ID
```http
GET /api/payments/order/:orderId
```

#### List User Payments
```http
GET /api/payments/user/:userId?page=1&limit=20
```

#### Create Refund
```http
POST /api/payments/:id/refund
Content-Type: application/json

{
  "amount": 50.00,
  "reason": "CUSTOMER_REQUEST",
  "notes": "Customer not satisfied with product",
  "requestedBy": "admin-uuid"
}
```

#### Cancel Payment
```http
DELETE /api/payments/:id/cancel
```

### Webhooks

#### Stripe Webhook Handler
```http
POST /api/payments/webhook/stripe
Headers: stripe-signature
```

### Health Check

```http
GET /api/health
```

## 🗄️ Database Schema

### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  order_id UUID UNIQUE,
  user_id UUID,
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  status VARCHAR,
  payment_method VARCHAR,
  provider VARCHAR,
  payment_intent_id VARCHAR UNIQUE,
  provider_payment_id VARCHAR,
  provider_customer_id VARCHAR,
  card_last4 VARCHAR,
  card_brand VARCHAR,
  card_exp_month INT,
  card_exp_year INT,
  paid_at TIMESTAMP,
  failed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  failure_code VARCHAR,
  failure_message VARCHAR,
  refunded_amount DECIMAL(10,2),
  metadata JSONB,
  description TEXT,
  receipt_url VARCHAR,
  receipt_email VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_intent ON payments(payment_intent_id);
```

### Refunds Table
```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2),
  status VARCHAR,
  reason VARCHAR,
  provider_refund_id VARCHAR,
  refunded_at TIMESTAMP,
  failed_at TIMESTAMP,
  failure_reason VARCHAR,
  notes TEXT,
  requested_by VARCHAR,
  processed_by VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(payment_id, status);
```

## 💳 Payment Flow

### 1. Create Payment Intent

```
Client → Payment Service → Stripe
       ← Payment Intent   ←
```

### 2. Collect Payment Method

```
Client → Stripe Elements (Frontend)
Client collects payment method (card details)
```

### 3. Confirm Payment

```
Client → Payment Service → Stripe
       ← Confirmation   ←
```

### 4. Handle Payment Result

```
Stripe → Webhook → Payment Service
              → Update Payment Status
              → Emit Events
```

## 🔄 Payment Status Workflow

### Status Enum
```typescript
enum PaymentStatus {
  PENDING           // Payment intent created
  PROCESSING        // Payment is being processed
  REQUIRES_ACTION   // Requires customer action (3D Secure)
  SUCCEEDED         // Payment successful
  FAILED            // Payment failed
  CANCELLED         // Payment cancelled
  REFUNDED          // Fully refunded
  PARTIALLY_REFUNDED // Partially refunded
}
```

### Status Flow
```
PENDING → PROCESSING → SUCCEEDED → REFUNDED
       ↘ REQUIRES_ACTION ↗
       ↘ FAILED
       ↘ CANCELLED
```

## 🔌 Stripe Integration

### Supported Payment Methods
- Credit Cards (Visa, MasterCard, Amex)
- Debit Cards
- Additional methods can be enabled in Stripe Dashboard

### Webhook Events Handled
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

### Security Features
- Payment intents for secure payment flow
- 3D Secure (SCA) support
- Webhook signature verification
- No card data stored (PCI compliant)

## 🎯 Events

The service emits the following events:

```typescript
// Payment Events
payment.initiated       // When payment intent is created
payment.processing      // When payment is being processed
payment.succeeded       // When payment succeeds
payment.failed          // When payment fails
payment.cancelled       // When payment is cancelled

// Refund Events
refund.initiated        // When refund is initiated
refund.processing       // When refund is being processed
refund.succeeded        // When refund succeeds
refund.failed           // When refund fails
```

## 📝 Usage Examples

### Frontend Integration with Stripe Elements

```typescript
// 1. Create payment intent
const response = await fetch('http://localhost:3006/api/payments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: 'order-uuid',
    userId: 'user-uuid',
    amount: 99.99,
    currency: 'USD',
    paymentMethod: 'CREDIT_CARD',
    receiptEmail: 'customer@example.com'
  })
});

const { data } = await response.json();
const { paymentIntentId } = data;

// 2. Use Stripe Elements to collect payment method
const stripe = Stripe('pk_test_xxx');
const elements = stripe.elements();
const cardElement = elements.create('card');
cardElement.mount('#card-element');

// 3. Confirm payment
const { error, paymentIntent } = await stripe.confirmCardPayment(
  paymentIntentId,
  {
    payment_method: {
      card: cardElement,
      billing_details: {
        email: 'customer@example.com'
      }
    }
  }
);

if (error) {
  console.error('Payment failed:', error);
} else {
  console.log('Payment succeeded:', paymentIntent);
}
```

### Backend: Processing a Refund

```typescript
const refund = await fetch('http://localhost:3006/api/payments/payment-id/refund', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 50.00,
    reason: 'CUSTOMER_REQUEST',
    notes: 'Customer requested refund',
    requestedBy: 'admin-uuid'
  })
});
```

## 🔧 Business Rules

- **Min Amount**: $0.50
- **Max Amount**: $999,999.99
- **Refund Window**: 30 days
- **Payment Timeout**: 30 minutes
- **Max Refund Attempts**: 3
- **Supported Currencies**: USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, HKD, SGD

## 🔒 Validation

- Payment amount validation (min/max)
- Currency validation (supported currencies only)
- Refund amount validation (cannot exceed payment amount)
- Refund window validation
- Payment status validation
- UUID validation for IDs

## 📊 Caching Strategy

- **Payment by ID**: 5 minutes TTL
- **Payment by Order**: 5 minutes TTL
- **Payment List**: 3 minutes TTL
- **Refund**: 10 minutes TTL

Cache invalidation on:
- Payment creation
- Payment confirmation
- Payment cancellation
- Refund creation

## 🧪 Testing

### Testing with Stripe Test Cards

Use these test card numbers in development:

- **Success**: `4242 4242 4242 4242`
- **Requires Auth**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 9995`

Any future expiry date and any 3-digit CVC.

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
  "service": "payment-service",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔗 Integration Points

The Payment Service integrates with:

1. **Order Service**: Process payments for orders
2. **Stripe**: Payment processing provider
3. **Event Service**: Publish payment events
4. **Notification Service**: Send payment receipts/confirmations

## 🚨 Error Handling

Common errors:

- `PAYMENT_NOT_FOUND`: Payment doesn't exist
- `INVALID_PAYMENT_AMOUNT`: Amount outside valid range
- `PAYMENT_ALREADY_PROCESSED`: Payment already succeeded
- `REFUND_AMOUNT_EXCEEDS`: Refund amount > payment amount
- `PAYMENT_PROVIDER_ERROR`: Stripe API error
- `INSUFFICIENT_FUNDS`: Card has insufficient funds

## 📄 License

MIT
