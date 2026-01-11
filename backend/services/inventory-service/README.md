# Inventory Service

Inventory management microservice built with Go, GORM, and gRPC for the e-commerce platform.

## Features

- **Stock Management**: Track product inventory levels across warehouses
- **Reservation System**: Reserve stock for orders with automatic expiration
- **Transaction Safety**: ACID-compliant stock operations using GORM transactions
- **Cache Layer**: Redis caching for high-performance stock lookups
- **Background Jobs**: Automatic expiration of old reservations
- **Clean Architecture**: Domain-driven design with clear separation of concerns
- **gRPC API**: High-performance inter-service communication
- **Health Checks**: HTTP endpoints for monitoring

## Technology Stack

- **Go 1.21+**
- **GORM**: ORM for database operations
- **PostgreSQL**: Primary database
- **Redis**: Caching layer
- **gRPC**: Inter-service communication
- **Protocol Buffers**: API definitions

## Architecture

```
inventory-service/
├── cmd/
│   └── inventory-service/
│       └── main.go                 # Entry point
├── internal/
│   ├── domain/                     # Business entities & interfaces
│   │   └── repository.go
│   ├── usecase/                    # Business logic
│   │   └── inventory_usecase.go
│   ├── repository/                 # Data access layer
│   │   └── postgres/
│   │       ├── stock_repository.go
│   │       └── reservation_repository.go
│   ├── delivery/                   # Delivery mechanisms
│   │   ├── grpc/
│   │   │   └── inventory_handler.go
│   │   └── http/
│   │       └── server.go
│   └── infrastructure/             # External services
│       ├── database/
│       │   ├── models/
│       │   │   └── models.go      # GORM models & constants
│       │   └── postgres.go
│       └── redis/
│           └── redis.go
└── pkg/
    ├── config/                     # Configuration
    └── logger/                     # Logging

## Database Schema

### stocks
- `id`: UUID primary key
- `product_id`: Product identifier
- `variant_id`: Product variant identifier (optional)
- `available`: Available quantity
- `reserved`: Reserved quantity
- `total`: Total quantity
- `warehouse_id`: Warehouse identifier
- `created_at`, `updated_at`, `deleted_at`

### reservations
- `id`: UUID primary key
- `order_id`: Order identifier
- `product_id`: Product identifier
- `variant_id`: Product variant identifier (optional)
- `quantity`: Reserved quantity
- `status`: PENDING | COMMITTED | RELEASED | EXPIRED
- `expires_at`: Expiration timestamp
- `created_at`, `updated_at`, `deleted_at`

### stock_movements
- Audit trail for all stock changes
- Tracks operation, quantity, reason, and responsible user

## API Endpoints

### gRPC (Port 4004)

- `CheckStock`: Check if sufficient stock is available
- `ReserveStock`: Reserve stock for an order (with TTL)
- `ReleaseReservation`: Cancel reservation and return stock
- `CommitReservation`: Finalize reservation (convert to sold)
- `UpdateStock`: Admin operation to adjust stock levels
- `GetStock`: Retrieve stock information
- `BulkCheckStock`: Check availability for multiple items

### HTTP (Port 4002)

- `GET /health`: Service health check
- `GET /readiness`: Service readiness check

## Setup

1. **Install Dependencies**
   ```bash
   go mod download
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start PostgreSQL & Redis**
   ```bash
   docker-compose up -d postgres redis
   ```

4. **Run Migrations**
   Migrations run automatically on service startup using GORM AutoMigrate

5. **Start Service**
   ```bash
   go run cmd/inventory-service/main.go
   ```

## Usage Examples

### Check Stock Availability
```protobuf
CheckStockRequest {
  product_id: "prod-123"
  variant_id: "var-456"
  quantity: 5
}
```

### Reserve Stock for Order
```protobuf
ReserveStockRequest {
  order_id: "order-789"
  items: [
    {product_id: "prod-123", variant_id: "var-456", quantity: 2},
    {product_id: "prod-456", quantity: 1}
  ]
  ttl_seconds: 900  # 15 minutes
}
```

### Update Stock (Admin)
```protobuf
UpdateStockRequest {
  product_id: "prod-123"
  variant_id: "var-456"
  quantity: 100
  operation: ADD
  reason: "Restocking from supplier"
}
```

## Key Features

### Automatic Reservation Expiry
- Background job runs every minute
- Automatically expires reservations past their TTL
- Returns reserved stock to available pool
- Prevents stock from being held indefinitely

### Transaction Safety
- All stock operations use database transactions
- Row-level locking prevents race conditions
- ACID compliance ensures data integrity
- Rollback on any failure in multi-item reservations

### Caching Strategy
- Stock levels cached in Redis (5-minute TTL)
- Cache invalidation on stock changes
- Cache-aside pattern for high performance
- Fallback to database on cache miss

### Constants & Configuration
- All magic values defined as constants
- No hardcoded values in business logic
- Easy to adjust thresholds and timeouts
- Centralized in `models/models.go`

## Development

### Running Tests
```bash
go test ./...
```

### Building for Production
```bash
go build -o bin/inventory-service cmd/inventory-service/main.go
```

### Generating Proto Code
```bash
cd backend/proto
protoc --go_out=. --go-grpc_out=. inventory.proto
```

## Monitoring

- Health check: `http://localhost:4002/health`
- Readiness check: `http://localhost:4002/readiness`
- Logs: Structured logging to stdout

## License

MIT
