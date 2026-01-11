# Order Service

A microservice for managing e-commerce orders with clean architecture, built with Go.

## Features

- **Order Management**: Create, retrieve, update, and cancel orders
- **State Management**: 7 order states with validated transitions
  - PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
  - CANCELLED and REFUNDED states with proper transitions
- **Multi-item Orders**: Support for orders with multiple products
- **Address Management**: Separate shipping and billing addresses
- **Payment Integration**: Payment method and status tracking
- **Tracking**: Order tracking number support
- **User Orders**: Retrieve all orders for a specific user
- **Status Filtering**: Query orders by status

## Architecture

This service follows clean architecture principles:

- **Domain Layer**: Business entities and rules
- **Use Case Layer**: Application business logic
- **Repository Layer**: Data persistence abstraction
- **Infrastructure Layer**: External dependencies (DB, Redis, gRPC clients)
- **Delivery Layer**: API handlers (gRPC, HTTP)

## Technology Stack

- **Language**: Go 1.21
- **Database**: PostgreSQL with GORM
- **Cache**: Redis
- **API**: gRPC + HTTP
- **Logging**: Structured logging

## Order States

The service supports the following order states with strict transition rules:

1. **PENDING**: Initial state when order is created
2. **CONFIRMED**: Order has been confirmed
3. **PROCESSING**: Order is being prepared
4. **SHIPPED**: Order has been shipped
5. **DELIVERED**: Order has been delivered to customer
6. **CANCELLED**: Order has been cancelled
7. **REFUNDED**: Order has been refunded

## API

### gRPC Endpoints

Implemented via `OrderService` proto:

- `CreateOrder`: Create a new order
- `GetOrder`: Retrieve order by ID
- `UpdateOrderStatus`: Update order status
- `CancelOrder`: Cancel an order
- `GetUserOrders`: Get all orders for a user

### HTTP Endpoints

- `GET /health`: Health check
- `GET /ready`: Readiness check

## Configuration

Environment variables:

- `DATABASE_URL`: PostgreSQL connection string (default: `postgres://postgres:postgres@localhost:5432/order_db?sslmode=disable`)
- `REDIS_URL`: Redis server address (default: `localhost:6379`)
- `PORT`: HTTP server port (default: `3005`)
- `GRPC_PORT`: gRPC server port (default: `50054`)
- `PRODUCT_SERVICE_ADDR`: Product service gRPC address
- `INVENTORY_SERVICE_ADDR`: Inventory service gRPC address
- `PAYMENT_SERVICE_ADDR`: Payment service gRPC address

## Running the Service

### Local Development

```bash
# Install dependencies
go mod download

# Run the service
go run cmd/order-service/main.go
```

### Docker

```bash
# Build image
docker build -t order-service .

# Run container
docker run -p 3005:3005 -p 50054:50054 \
  -e DATABASE_URL=postgres://user:pass@host:5432/order_db \
  -e REDIS_URL=redis:6379 \
  order-service
```

## Database Schema

### orders table
- `id`: UUID primary key
- `user_id`: UUID, indexed
- `status`: VARCHAR(20), indexed
- `total_amount`: DECIMAL
- `shipping_address`: TEXT
- `billing_address`: TEXT
- `payment_method`: VARCHAR(50)
- `payment_status`: VARCHAR(20)
- `tracking_number`: VARCHAR(100)
- `notes`: TEXT
- `created_at`, `updated_at`, `deleted_at`: Timestamps

### order_items table
- `id`: UUID primary key
- `order_id`: UUID, foreign key to orders
- `product_id`: UUID, indexed
- `quantity`: INTEGER
- `price`: DECIMAL
- `subtotal`: DECIMAL
- `created_at`, `updated_at`, `deleted_at`: Timestamps

## Development

### Project Structure

```
order-service/
├── cmd/order-service/       # Application entry point
├── internal/
│   ├── domain/              # Business entities
│   ├── usecase/             # Business logic
│   ├── repository/          # Data access
│   ├── infrastructure/      # External dependencies
│   └── delivery/            # API handlers
├── pkg/                     # Shared packages
│   ├── config/              # Configuration
│   └── logger/              # Logging
├── go.mod                   # Dependencies
├── Dockerfile               # Container image
└── README.md               # This file
```

### Testing

```bash
# Run tests
go test ./...

# Run tests with coverage
go test -cover ./...
```

## Dependencies

- `gorm.io/gorm`: ORM for database operations
- `gorm.io/driver/postgres`: PostgreSQL driver
- `github.com/redis/go-redis/v9`: Redis client
- `google.golang.org/grpc`: gRPC framework
- `google.golang.org/protobuf`: Protocol buffers
- `github.com/google/uuid`: UUID generation
- `github.com/joho/godotenv`: Environment variable loading

## License

Part of the ecommerce-rec microservices platform.
