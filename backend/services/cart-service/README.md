# Cart Service (Go)

Clean architecture-based shopping cart service written in Go with gRPC support.

## Architecture

This service follows clean architecture principles with clear separation of concerns:

```
cart-service/
├── cmd/
│   └── cart-service/        # Application entry point
│       └── main.go
├── internal/
│   ├── domain/               # Business logic and entities
│   │   ├── cart.go          # Cart entity with business rules
│   │   └── repository.go    # Repository interfaces
│   ├── usecase/              # Application business rules
│   │   └── cart_usecase.go  # Cart use cases
│   ├── repository/           # Data access implementations
│   │   └── postgres/
│   │       └── cart_repository.go
│   ├── infrastructure/       # External concerns
│   │   ├── database/
│   │   │   ├── models/      # Database models
│   │   │   └── postgres.go  # Database connection
│   │   └── redis/           # Redis client
│   └── delivery/             # Delivery mechanisms
│       ├── grpc/            # gRPC handlers
│       └── http/            # HTTP handlers (health checks)
├── pkg/
│   ├── config/              # Configuration management
│   └── logger/              # Logging utilities
└── go.mod

```

## Features

- Add items to cart
- Update item quantities
- Remove items from cart
- Clear cart
- Apply/remove coupon codes
- Abandoned cart detection
- Automatic cart cleanup
- Redis caching for performance
- gRPC API

## Technologies

- **Go 1.21**
- **GORM** - ORM for database operations
- **PostgreSQL** - Primary database
- **Redis** - Caching layer
- **gRPC** - Inter-service communication
- **Protocol Buffers** - API definition

## Configuration

Environment variables (see `.env.example`):

```
SERVICE_NAME=cart-service
PORT=3003
GRPC_PORT=50053
LOG_LEVEL=info

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=cart_db

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123

CART_ABANDONED_DAYS=7
CART_EXPIRY_DAYS=30
```

## Running the Service

```bash
# Install dependencies
go mod download

# Run the service
go run cmd/cart-service/main.go

# Build
go build -o cart-service cmd/cart-service/main.go
```

## Docker

```bash
# Build image
docker build -t cart-service .

# Run container
docker run -p 3003:3003 -p 50053:50053 cart-service
```

## API (gRPC)

See `proto/cart.proto` for the complete API definition.

Key operations:
- `GetCart` - Get user's cart
- `AddToCart` - Add item to cart
- `UpdateItemQuantity` - Update item quantity
- `RemoveItem` - Remove item from cart
- `ClearCart` - Clear entire cart
- `ApplyCoupon` - Apply coupon code
- `RemoveCoupon` - Remove coupon

## Database Schema

### carts
- id (uuid, PK)
- user_id (varchar)
- subtotal (bigint) - in cents
- discount (bigint) - in cents
- total (bigint) - in cents
- coupon_code (varchar, nullable)
- is_abandoned (boolean)
- created_at (timestamp)
- updated_at (timestamp)
- deleted_at (timestamp, nullable)

### cart_items
- id (uuid, PK)
- cart_id (uuid, FK)
- product_id (varchar)
- variant_id (varchar, nullable)
- name (varchar)
- image (text)
- sku (varchar)
- quantity (int)
- unit_price (bigint) - in cents
- total_price (bigint) - in cents
- created_at (timestamp)
- updated_at (timestamp)

## Clean Architecture Layers

### Domain Layer
Contains business entities and repository interfaces. No dependencies on external frameworks.

### Use Case Layer
Application business rules. Orchestrates the flow of data between delivery and repository layers.

### Repository Layer
Implements data access logic. Converts between domain entities and database models.

### Infrastructure Layer
External concerns like database connections, Redis clients, etc.

### Delivery Layer
Handles input/output. gRPC and HTTP handlers live here.
