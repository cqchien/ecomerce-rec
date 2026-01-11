# Event Service (Go)

## Overview
The Event Service handles event ingestion, storage, and publishing to Kafka for event-driven architecture. Built with Go using Clean Architecture principles for high-throughput event processing.

## Features
- ✅ Event creation and storage
- ✅ Kafka event publishing
- ✅ Event status tracking (Pending, Processing, Processed, Failed)
- ✅ Automatic retry mechanism (max 3 retries)
- ✅ Event type categorization
- ✅ Failed event recovery
- ✅ Event querying by type and status

## Architecture
```
event-service/
├── cmd/event-service/           # Application entry point
│   └── main.go
├── internal/
│   ├── domain/                  # Business entities and rules
│   │   └── event.go
│   ├── usecase/                 # Business logic
│   │   └── event_usecase.go
│   ├── repository/              # Data access interfaces and implementations
│   │   └── postgres/
│   │       └── event_repository.go
│   ├── infrastructure/          # External services
│   │   ├── database/
│   │   ├── redis/
│   │   ├── models/
│   │   └── kafka/               # Kafka publisher
│   │       └── publisher.go
│   └── delivery/                # API layer
│       ├── grpc/
│       └── http/
└── pkg/                         # Shared utilities
    ├── config/
    └── logger/
```

## Event Types

The service supports the following event types:
- `USER_CREATED`, `USER_UPDATED`
- `PRODUCT_CREATED`, `PRODUCT_UPDATED`
- `ORDER_CREATED`, `ORDER_UPDATED`, `ORDER_CANCELLED`
- `PAYMENT_COMPLETED`, `PAYMENT_FAILED`
- `INVENTORY_UPDATED`
- `CART_UPDATED`

## API

### gRPC Endpoints
- `PublishEvent` - Create and publish a new event
- `GetEvent` - Retrieve event by ID
- `GetEventsByType` - Query events by type
- `ProcessPendingEvents` - Retry pending events
- `RetryFailedEvents` - Retry failed events (max 3 attempts)

## Environment Variables

```bash
SERVICE_NAME=event-service
PORT=3007
GRPC_PORT=50056
LOG_LEVEL=info

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=event_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL_MODE=disable

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis123
REDIS_DB=0

# Kafka
KAFKA_BROKERS=kafka:9092
KAFKA_TOPIC=ecommerce-events
KAFKA_CONSUMER_GROUP=event-service-group
```

## Kafka Integration

Uses `segmentio/kafka-go` for high-performance Kafka publishing:

- Batch timeout: 10ms
- Max retry attempts: 3
- Load balancing: LeastBytes
- Message headers for event metadata

## Event Lifecycle

```
1. Create Event → PENDING
2. Publish to Kafka → PROCESSING
3a. Success → PROCESSED
3b. Failure → FAILED (retry count++)
4. If retry_count < 3 → Back to PENDING
5. If retry_count >= 3 → Permanent FAILED
```

## Running Locally

```bash
# Install dependencies
go mod download

# Run the service
go run cmd/event-service/main.go

# Build
go build -o event-service cmd/event-service/main.go
```

## Docker

```bash
# Build
docker build -t event-service .

# Run
docker run -p 3007:3007 -p 50056:50056 \
  -e KAFKA_BROKERS=kafka:9092 \
  event-service
```

## Event Schema

Each event contains:
- `id` - Unique event identifier
- `type` - Event type (e.g., ORDER_CREATED)
- `aggregate_id` - ID of the entity that triggered the event
- `payload` - JSON payload with event data
- `status` - Current processing status
- `retry_count` - Number of retry attempts
- `created_at`, `updated_at`, `processed_at` - Timestamps

## Testing

```bash
# Run tests
go test ./...

# Test with Kafka
docker-compose up -d kafka
go test ./...
```

## Best Practices

- Always use JSON for event payloads
- Include aggregate_id for event correlation
- Monitor failed events and retry manually if needed
- Use Kafka UI to verify event publishing
- Set appropriate retention policies on Kafka topics
