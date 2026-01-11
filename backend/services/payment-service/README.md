# Payment Service (Go)

## Overview
The Payment Service handles all payment processing, including Stripe integration, payment validation, and refund management. Built with Go using Clean Architecture principles for secure and reliable payment handling.

## Features
- ✅ Stripe payment integration
- ✅ Payment creation and processing
- ✅ Payment status tracking
- ✅ Refund processing
- ✅ Payment history and lookup
- ✅ Multiple payment methods (Credit Card, Debit Card, PayPal, Stripe)
- ✅ Secure payment provider response handling

## Architecture
```
payment-service/
├── cmd/payment-service/         # Application entry point
│   └── main.go
├── internal/
│   ├── domain/                  # Business entities and rules
│   │   └── payment.go
│   ├── usecase/                 # Business logic
│   │   └── payment_usecase.go
│   ├── repository/              # Data access interfaces and implementations
│   │   └── postgres/
│   │       └── payment_repository.go
│   ├── infrastructure/          # External services
│   │   ├── database/
│   │   ├── redis/
│   │   ├── models/
│   │   └── payment/             # Stripe provider
│   │       └── stripe.go
│   └── delivery/                # API layer
│       ├── grpc/
│       └── http/
└── pkg/                         # Shared utilities
    ├── config/
    └── logger/
```

## API

### gRPC Endpoints
- `CreatePayment` - Create a new payment
- `ProcessPayment` - Process payment through Stripe
- `GetPayment` - Retrieve payment by ID
- `GetPaymentByOrderID` - Get payment for an order
- `RefundPayment` - Process a refund

## Environment Variables

```bash
SERVICE_NAME=payment-service
PORT=3006
GRPC_PORT=50055
LOG_LEVEL=info

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=payment_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL_MODE=disable

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis123
REDIS_DB=0

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
```

## Stripe Integration

The service integrates with Stripe API v76 for payment processing:

1. Payment Intent creation
2. Payment confirmation
3. Webhook handling (future)
4. Refund processing

## Running Locally

```bash
# Install dependencies
go mod download

# Run the service
go run cmd/payment-service/main.go

# Build
go build -o payment-service cmd/payment-service/main.go
```

## Docker

```bash
# Build
docker build -t payment-service .

# Run
docker run -p 3006:3006 -p 50055:50055 \
  -e STRIPE_SECRET_KEY=sk_test_your_key \
  payment-service
```

## Payment Flow

```
1. Create Payment (PENDING)
2. Mark as PROCESSING
3. Send to Stripe → Success → COMPLETED
                  → Failure → FAILED
4. Optionally REFUNDED or CANCELLED
```

## Security Considerations

- Never log sensitive payment data
- Store only Stripe IDs and status
- Use HTTPS for all payment communications
- Validate payment amounts before processing
- Implement idempotency for payment operations

## Testing

```bash
# Run tests
go test ./...

# Use Stripe test keys
STRIPE_SECRET_KEY=sk_test_... go test ./...
```
