# Payment Service (Go)

## Overview
The Payment Service handles all payment processing, including Stripe integration, payment validation, and refund management. Built with Go 1.21+ using Clean Architecture principles for secure and reliable payment handling.

## Features
- ✅ Stripe payment integration (v76)
- ✅ Payment creation and processing
- ✅ Payment Intent flow with automatic confirmation
- ✅ Payment status tracking (6 states)
- ✅ Refund processing (simplified implementation)
- ✅ Payment history and lookup by ID and Order ID
- ✅ Multiple payment methods (Credit Card, Debit Card, PayPal, Stripe)
- ✅ Secure payment provider response handling
- ✅ PostgreSQL with GORM for persistence
- ✅ Redis caching support
- ✅ gRPC + HTTP APIs
- ✅ Structured logging with slog

## Architecture
```
payment-service/
├── cmd/payment-service/         # Application entry point
│   └── main.go                  # Service initialization & startup
├── internal/
│   ├── domain/                  # Business entities and rules
│   │   └── payment.go           # Payment entity, status, methods, validation
│   ├── usecase/                 # Business logic
│   │   └── payment_usecase.go   # Payment processing orchestration
│   ├── repository/              # Data access interfaces and implementations
│   │   └── postgres/
│   │       └── payment_repository.go  # PostgreSQL implementation
│   ├── infrastructure/          # External services
│   │   ├── database/
│   │   │   ├── postgres.go      # DB connection & migrations
│   │   │   └── models/          # GORM models
│   │   │       └── payment.go
│   │   ├── redis/
│   │   │   └── redis.go         # Redis client
│   │   └── payment/             # Payment providers
│   │       └── stripe.go        # Stripe integration
│   └── delivery/                # API layer
│       ├── grpc/
│       │   └── payment_handler.go  # gRPC server handlers
│       └── http/
│           └── server.go        # HTTP health checks
└── pkg/                         # Shared utilities
    ├── config/
    │   └── config.go            # Environment configuration
    └── logger/
        └── logger.go            # Structured logging
```

## Payment States

The service manages 6 payment states:

1. **PENDING** - Payment created, awaiting processing
2. **PROCESSING** - Payment is being processed
3. **COMPLETED** - Payment successfully completed
4. **FAILED** - Payment failed (with failure reason)
5. **CANCELLED** - Payment cancelled before processing
6. **REFUNDED** - Payment has been refunded

## API

### gRPC Endpoints (Port 50055)

Implemented via `payment.proto`:

- **CreatePayment** - Create a new payment record
  - Input: order_id, user_id, amount, currency, payment_method
  - Output: Payment with PENDING status
  
- **ProcessPayment** - Process payment through Stripe
  - Input: payment_id
  - Output: Updated payment with provider_id and status
  - Creates Stripe Payment Intent and confirms it automatically
  
- **GetPayment** - Retrieve payment by ID
  - Input: payment_id
  - Output: Payment details
  
- **GetPaymentByOrderID** - Get payment for an order
  - Input: order_id
  - Output: Payment details
  
- **RefundPayment** - Process a refund
  - Input: payment_id, amount (optional)
  - Output: Updated payment with REFUNDED status
  - Note: Simplified implementation, production should use Stripe Refund API

### HTTP Endpoints (Port 3006)

- **GET /health** - Health check
- **GET /ready** - Readiness check

## Environment Variables

```bash
# Service Configuration
SERVICE_NAME=payment-service
PORT=3006                    # HTTP server port
GRPC_PORT=50055              # gRPC server port
LOG_LEVEL=info               # debug, info, warn, error

# Database (PostgreSQL)
# Can use individual variables or DATABASE_URL
DATABASE_URL=postgres://postgres:postgres@localhost:5432/payment_db?sslmode=disable

# Or individual DB variables:
DB_HOST=postgres
DB_PORT=5432
DB_NAME=payment_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL_MODE=disable

# Redis (Optional - for caching)
REDIS_URL=redis://localhost:6379
# Or:
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis123
REDIS_DB=0

# Stripe Integration (Required)
STRIPE_PUBLISHABLE_KEY=pk_test_...  # For frontend
STRIPE_SECRET_KEY=sk_test_...       # For backend processing
```

## Stripe Integration

The service integrates with **Stripe Go SDK v76** for payment processing:

### Implementation Details

**Payment Processing Flow:**
1. **Create Payment Intent**
   - Amount converted to cents (Stripe's smallest currency unit)
   - Metadata includes: order_id, user_id, payment_id
   - Currency specified (USD, EUR, etc.)

2. **Automatic Confirmation**
   - Payment intent is created and confirmed in one flow
   - Status checked: `succeeded`, `requires_action`, `failed`
   - Provider ID and status stored in database

3. **Refund Processing** (Simplified)
   - Currently marks payment as REFUNDED in database
   - Production implementation should use `stripe.Refund` API
   - Full refund support

### Stripe Provider (`stripe.go`)

```go
type StripeProvider struct {
    apiKey string
}

// ProcessPayment creates and confirms a Stripe Payment Intent
func (p *StripeProvider) ProcessPayment(ctx context.Context, payment *domain.Payment) (string, string, error)

// RefundPayment processes a refund (simplified)
func (p *StripeProvider) RefundPayment(ctx context.Context, providerID string, amount float64) error
```

### Error Handling

- Stripe API errors are wrapped with context
- Failed payments return provider_id for tracking
- Failure reasons stored in database
- Payment status updated accordingly

### Future Enhancements

- [ ] Webhook handler for async payment updates
- [ ] Full Stripe Refund API integration  
- [ ] Payment method attachment support
- [ ] 3D Secure (SCA) handling
- [ ] Partial refund support
- [ ] Payment retry logic

## Running Locally

### Prerequisites

- Go 1.21 or higher
- PostgreSQL 14+
- Redis 6+ (optional)
- Stripe test account

### Steps

```bash
# 1. Install dependencies
go mod download

# 2. Set up environment
cp .env.example .env
# Edit .env with your Stripe test keys and DB credentials

# 3. Run database migrations (automatic on startup)
# Service will auto-migrate Payment table

# 4. Run the service
go run cmd/payment-service/main.go

# 5. Build for production
go build -o payment-service cmd/payment-service/main.go
./payment-service
```

### Development

```bash
# Run with hot reload (using air)
air

# Run tests
go test ./... -v

# Run tests with coverage
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out
```

## Docker

### Build

```bash
docker build -t payment-service .
```

### Run

```bash
docker run -p 3006:3006 -p 50055:50055 \
  -e DATABASE_URL=postgres://user:pass@host:5432/payment_db \
  -e STRIPE_SECRET_KEY=sk_test_your_key \
  -e REDIS_URL=redis://host:6379 \
  payment-service
```

### Docker Compose

```bash
cd /path/to/backend/deployment
docker-compose -f services.docker-compose.yml up payment-service
```

## Payment Flow

```mermaid
sequenceDiagram
    participant Client
    participant PaymentService
    participant Stripe
    participant Database

    Client->>PaymentService: CreatePayment(order_id, amount)
    PaymentService->>Database: Save Payment (PENDING)
    PaymentService-->>Client: Payment created

    Client->>PaymentService: ProcessPayment(payment_id)
    PaymentService->>Database: Update to PROCESSING
    PaymentService->>Stripe: Create Payment Intent
    Stripe-->>PaymentService: Payment Intent ID
    PaymentService->>Stripe: Confirm Payment Intent
    
    alt Payment Succeeded
        Stripe-->>PaymentService: Status: succeeded
        PaymentService->>Database: Update to COMPLETED
        PaymentService-->>Client: Payment completed
    else Payment Failed
        Stripe-->>PaymentService: Status: failed
        PaymentService->>Database: Update to FAILED
        PaymentService-->>Client: Payment failed
    end

    opt Refund
        Client->>PaymentService: RefundPayment(payment_id)
        PaymentService->>Database: Update to REFUNDED
        PaymentService-->>Client: Refund processed
    end
```

## Database Schema

### Payments Table

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL,
    method VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255),           -- Stripe Payment Intent ID
    provider_response TEXT,             -- Stripe response
    failure_reason TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    
    INDEX idx_payments_order_id (order_id),
    INDEX idx_payments_user_id (user_id),
    INDEX idx_payments_status (status)
);
```

## Security Considerations

- ✅ Never log sensitive payment data (card numbers, CVV)
- ✅ Store only Stripe IDs and status
- ✅ Use HTTPS for all payment communications  
- ✅ Validate payment amounts before processing (min/max checks)
- ✅ Idempotency via unique order_id constraint
- ✅ Secure Stripe API key handling via environment variables
- 🔒 TODO: Implement request signing/verification
- 🔒 TODO: Add rate limiting for payment endpoints
- 🔒 TODO: Add webhook signature verification

## Testing

### Unit Tests

```bash
# Run all tests
go test ./... -v

# Test specific package
go test ./internal/usecase -v

# With Stripe test keys
export STRIPE_SECRET_KEY=sk_test_...
go test ./internal/infrastructure/payment -v
```

### Integration Tests

```bash
# Requires running PostgreSQL
export DATABASE_URL=postgres://localhost:5432/payment_test_db
go test ./internal/repository/postgres -v
```

### Stripe Testing

Use Stripe test cards:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Insufficient funds:** `4000 0000 0000 9995`

## Monitoring

### Health Checks

```bash
# HTTP health endpoint
curl http://localhost:3006/health

# Readiness check
curl http://localhost:3006/ready
```

### Logs

Structured JSON logging with levels:
- `DEBUG` - Detailed execution flow
- `INFO` - Payment operations, status changes
- `WARN` - Validation failures, retryable errors
- `ERROR` - Stripe failures, database errors

## Dependencies

- `github.com/stripe/stripe-go/v76` - Stripe SDK
- `gorm.io/gorm` - ORM
- `gorm.io/driver/postgres` - PostgreSQL driver
- `github.com/google/uuid` - UUID generation
- `github.com/redis/go-redis/v9` - Redis client
- `google.golang.org/grpc` - gRPC framework
