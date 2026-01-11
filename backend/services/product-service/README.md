# Product Service

A high-performance product catalog service built with Golang following Clean Architecture principles.

## Architecture

```
cmd/product-service/     # Application entry point
internal/
  ├── domain/           # Business entities and repository interfaces
  ├── usecase/          # Business logic layer
  ├── repository/       # Data access implementations
  │   └── postgres/     # PostgreSQL repository
  ├── delivery/         # Delivery mechanisms
  │   ├── grpc/        # gRPC handlers
  │   └── http/        # HTTP health checks
  └── infrastructure/   # External dependencies
      ├── database/    # Database connection and migrations
      └── redis/       # Redis client
pkg/
  ├── config/          # Configuration management
  └── logger/          # Structured logging
```

## Features

- **Product Management**: CRUD operations for products with variants
- **Category Management**: Hierarchical category structure
- **Search & Filtering**: Full-text search with advanced filters
- **Redis Caching**: Product and category caching (1-2 hour TTL)
- **gRPC API**: High-performance inter-service communication
- **Clean Architecture**: Clear separation of concerns
- **Auto Migrations**: Database schema auto-created on startup

## Tech Stack

- **Language**: Go 1.21+
- **Framework**: gRPC, Protocol Buffers
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Logger**: Zerolog (structured logging)
- **ORM**: database/sql with lib/pq driver

## Database Schema

### Categories
```sql
categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  parent_id VARCHAR(36) REFERENCES categories(id),
  image TEXT,
  sort_order INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Products
```sql
products (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  long_description TEXT,
  price BIGINT NOT NULL,
  original_price BIGINT,
  category_id VARCHAR(36) REFERENCES categories(id),
  images TEXT[],
  specifications JSONB,
  tags TEXT[],
  rating DECIMAL(3,2),
  review_count INTEGER,
  is_featured BOOLEAN,
  is_new BOOLEAN,
  is_on_sale BOOLEAN,
  sku VARCHAR(100) UNIQUE,
  status VARCHAR(20),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Product Variants
```sql
product_variants (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255),
  sku VARCHAR(100) UNIQUE,
  price BIGINT,
  stock INTEGER,
  attributes JSONB
)
```

## gRPC API

### Product Service Methods

1. **GetProduct** - Retrieve product by ID
2. **ListProducts** - List products with filters and pagination
3. **SearchProducts** - Full-text search with ranking
4. **GetRelatedProducts** - Get products in same category
5. **GetProductsByIds** - Bulk product retrieval
6. **CreateProduct** - Create new product (Admin)
7. **UpdateProduct** - Update product (Admin)
8. **DeleteProduct** - Delete product (Admin)
9. **ListCategories** - List categories with optional product counts
10. **GetCategory** - Get category by ID

## Environment Variables

```bash
# Service
SERVICE_NAME=product-service
PORT=4001           # HTTP health check port
GRPC_PORT=4003     # gRPC server port
LOG_LEVEL=info     # debug, info, warn, error

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=product_db
DB_SSL_MODE=disable

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123
REDIS_DB=0
```

## Getting Started

### Prerequisites

- Go 1.21+
- PostgreSQL 15+
- Redis 7+
- Protocol Buffers compiler (protoc)

### Installation

1. Copy environment file:
```bash
cp .env.example .env
```

2. Install dependencies:
```bash
go mod download
```

3. Generate proto files:
```bash
cd ../../
./scripts/generate-proto.sh
```

4. Run the service:
```bash
go run cmd/product-service/main.go
```

### Using Docker

```bash
docker build -t product-service .
docker run -p 4001:4001 -p 4003:4003 --env-file .env product-service
```

## API Examples

### gRPC Client Example (Go)

```go
conn, _ := grpc.Dial("localhost:4003", grpc.WithInsecure())
client := pb.NewProductServiceClient(conn)

// Get product
resp, _ := client.GetProduct(context.Background(), &pb.GetProductRequest{
    Id: "product-id",
})

// List products with filters
resp, _ := client.ListProducts(context.Background(), &pb.ListProductsRequest{
    Pagination: &pb.PaginationRequest{
        Page: 1,
        PageSize: 20,
    },
    Filters: &pb.ProductFilters{
        CategoryId: "category-id",
        MinPriceCents: 1000,
        MaxPriceCents: 10000,
        InStockOnly: true,
    },
})
```

## Performance Features

- **Connection Pooling**: 25 max connections, 5 idle, 5min lifetime
- **Redis Caching**: 
  - Products: 1 hour TTL
  - Categories: 2 hour TTL
  - Category listings: 30 min TTL
- **Indexed Queries**: All foreign keys and slug fields indexed
- **GIN Index**: Full-text search on tags array
- **Lazy Loading**: Variants loaded only when needed

## Health Checks

- **HTTP Health**: `GET http://localhost:4001/health`
- **HTTP Readiness**: `GET http://localhost:4001/readiness`

## Testing

```bash
# Run unit tests
go test ./internal/...

# Run integration tests
go test ./internal/repository/postgres/... -tags=integration

# Run all tests with coverage
go test ./... -cover
```

## Logging

Structured JSON logging with levels:
- **Debug**: Cache hits, detailed operations
- **Info**: Service startup, CRUD operations
- **Warn**: Cache misses, validation warnings
- **Error**: Database errors, operation failures
- **Fatal**: Startup failures

Example log:
```json
{
  "level": "info",
  "service": "product-service",
  "msg": "Product created",
  "id": "uuid",
  "name": "Product Name",
  "timestamp": "2026-01-10T10:00:00Z"
}
```

## Development

### Project Structure Philosophy

- **Domain**: Pure business logic, no external dependencies
- **Use Case**: Orchestrates domain objects and repositories
- **Repository**: Data access layer with interface in domain
- **Infrastructure**: Database, cache, external services
- **Delivery**: HTTP/gRPC handlers, thin layer

### Adding New Features

1. Define domain entity in `internal/domain/`
2. Add repository interface in `internal/domain/repository.go`
3. Implement repository in `internal/repository/postgres/`
4. Create use case in `internal/usecase/`
5. Add gRPC handler in `internal/delivery/grpc/`
6. Update proto definition if needed

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql -h localhost -U postgres -d product_db
```

### Redis Connection Issues
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli -h localhost -p 6379 -a redis123 ping
```

### Proto Generation Issues
```bash
# Install protoc-gen-go
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Regenerate proto files
cd ../../
./scripts/generate-proto.sh
```

## Contributing

1. Follow Clean Architecture principles
2. Write unit tests for use cases
3. Add integration tests for repositories
4. Update documentation
5. Use structured logging
6. Handle errors properly with gRPC status codes

## License

MIT
