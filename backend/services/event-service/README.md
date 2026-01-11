# Event Service

Event-driven messaging service using Apache Kafka for asynchronous communication between microservices in the e-commerce platform.

## Features

- **Event Publishing**: Publish single or batch events to Kafka topics
- **Event Consumption**: Subscribe to topics with consumer groups
- **Idempotent Producer**: Prevents duplicate event publishing
- **Retry Logic**: Automatic retry with exponential backoff for failed events
- **Dead Letter Queue (DLQ)**: Failed events after max retries are sent to DLQ
- **Event Deduplication**: Redis-based tracking of processed events
- **Event Compression**: GZIP compression for network efficiency
- **Manual Offset Commits**: Exactly-once processing semantics
- **Event Metadata**: Automatic tracking of eventId, timestamp, version, priority
- **Health Checks**: Monitor service and Kafka connectivity

## Tech Stack

- **Framework**: NestJS 10.x
- **Message Broker**: Apache Kafka (via KafkaJS 2.2.4)
- **Cache**: Redis (via ioredis 5.3.2)
- **Language**: TypeScript 5.x
- **Validation**: class-validator 0.14.0

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update environment variables
# Edit .env with your Kafka brokers and Redis configuration
```

## Environment Variables

```bash
# Kafka Configuration
KAFKA_BROKERS=localhost:9092              # Kafka broker addresses (comma-separated)
KAFKA_CLIENT_ID=event-service             # Client identifier

# Redis Configuration
REDIS_HOST=localhost                      # Redis host
REDIS_PORT=6379                           # Redis port
REDIS_PASSWORD=                           # Redis password (optional)
REDIS_DB=0                                # Redis database number

# Application Configuration
NODE_ENV=development                      # Environment (development/production)
PORT=3007                                 # HTTP port

# CORS Configuration
CORS_ORIGIN=http://localhost:3000         # Allowed origins
```

## Kafka Setup

### Using Docker Compose (Recommended)

```bash
# Start Kafka, Zookeeper, and Kafka UI
docker-compose up -d

# Check status
docker-compose ps

# View Kafka UI
# Open http://localhost:8080 in your browser

# Stop services
docker-compose down
```

### Manual Kafka Installation

1. Download Kafka from https://kafka.apache.org/downloads
2. Extract and navigate to Kafka directory
3. Start Zookeeper:
```bash
bin/zookeeper-server-start.sh config/zookeeper.properties
```
4. Start Kafka (in new terminal):
```bash
bin/kafka-server-start.sh config/server.properties
```

## Development

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## Event Topics

### Order Events
- `order.created` - Order created
- `order.confirmed` - Order confirmed (payment succeeded)
- `order.shipped` - Order shipped
- `order.delivered` - Order delivered
- `order.cancelled` - Order cancelled
- `order.status_changed` - Order status changed

### Payment Events
- `payment.initiated` - Payment initiated
- `payment.succeeded` - Payment succeeded
- `payment.failed` - Payment failed
- `payment.refunded` - Payment refunded
- `payment.refund_failed` - Refund failed

### User Events
- `user.registered` - User registered
- `user.updated` - User profile updated
- `user.deleted` - User deleted
- `user.address_added` - Address added
- `user.wishlist_updated` - Wishlist updated

### Cart Events
- `cart.item_added` - Item added to cart
- `cart.item_removed` - Item removed from cart
- `cart.abandoned` - Cart abandoned (inactive)
- `cart.updated` - Cart updated

### Product Events
- `product.created` - Product created
- `product.updated` - Product updated
- `product.deleted` - Product deleted
- `product.price_changed` - Product price changed

### Inventory Events
- `inventory.updated` - Inventory updated
- `inventory.reserved` - Stock reserved
- `inventory.released` - Stock released
- `inventory.stock_low` - Stock below threshold

## Consumer Groups

Different services subscribe to events using consumer groups:

- `notification-service-group` - Notification Service (emails/SMS)
- `analytics-service-group` - Analytics Service (data analysis)
- `email-service-group` - Email Service (transactional emails)
- `recommendation-service-group` - Recommendation Service (ML models)

## Event Structure

### EventPayload

```typescript
{
  "metadata": {
    "eventId": "550e8400-e29b-41d4-a716-446655440000",
    "eventType": "order.created",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0",
    "priority": "high",
    "source": "order-service",
    "correlationId": "req-123456",
    "userId": "user-uuid"
  },
  "data": {
    // Event-specific data
  }
}
```

### Event Priority

- `critical` - Critical events (payment failures, system errors)
- `high` - High priority (order confirmations, payment successes)
- `normal` - Normal priority (user updates, cart changes)
- `low` - Low priority (analytics events, logs)

## API Endpoints

### Publish Event

```bash
POST /api/events/publish
Content-Type: application/json

{
  "topic": "order.created",
  "data": {
    "orderId": "order-uuid",
    "userId": "user-uuid",
    "totalAmount": 199.99,
    "items": [...]
  },
  "priority": "high",
  "source": "order-service",
  "correlationId": "req-123456",
  "userId": "user-uuid",
  "key": "order-uuid"  // Optional partition key
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event published successfully"
}
```

### Publish Batch Events

```bash
POST /api/events/publish-batch
Content-Type: application/json

{
  "topic": "inventory.updated",
  "events": [
    {
      "data": { "productId": "prod-1", "quantity": 100 },
      "key": "prod-1"
    },
    {
      "data": { "productId": "prod-2", "quantity": 50 },
      "key": "prod-2"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Batch published successfully (2 events)"
}
```

### Check Event Status

```bash
GET /api/events/processed/:eventId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": "550e8400-e29b-41d4-a716-446655440000",
    "processed": true
  }
}
```

### Health Check

```bash
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "event-service",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Event Producer Usage

### Publishing Single Event

```typescript
import { EventProducerService } from './services/event-producer.service';

// Inject the service
constructor(private readonly eventProducer: EventProducerService) {}

// Publish event
await this.eventProducer.publishEvent(
  'order.created',
  {
    orderId: 'order-123',
    userId: 'user-456',
    totalAmount: 199.99,
    items: [
      { productId: 'prod-1', quantity: 2, price: 99.99 }
    ]
  },
  {
    priority: EventPriority.HIGH,
    source: 'order-service',
    userId: 'user-456',
    correlationId: 'req-789'
  }
);
```

### Publishing Batch Events

```typescript
await this.eventProducer.publishBatch('inventory.updated', [
  {
    data: { productId: 'prod-1', quantity: 100 },
    key: 'prod-1'
  },
  {
    data: { productId: 'prod-2', quantity: 50 },
    key: 'prod-2'
  }
]);
```

## Event Consumer Usage

### Registering Event Handler

```typescript
import { EventConsumerService } from './services/event-consumer.service';
import { TOPICS, CONSUMER_GROUPS } from './common/constants';

// Inject the service
constructor(private readonly eventConsumer: EventConsumerService) {}

async onModuleInit() {
  // Register handler
  this.eventConsumer.registerHandler('order.created', this.handleOrderCreated.bind(this));
  
  // Subscribe to topics
  await this.eventConsumer.subscribe(
    [TOPICS.ORDER_CREATED, TOPICS.ORDER_CONFIRMED],
    CONSUMER_GROUPS.NOTIFICATION
  );
}

// Handler method
private async handleOrderCreated(data: any, metadata: EventMetadata): Promise<void> {
  console.log('Processing order created event:', data);
  
  // Business logic
  await this.sendOrderConfirmationEmail(data.userId, data.orderId);
  
  // Event is automatically marked as processed
}
```

## Retry Logic

Failed event processing is automatically retried with exponential backoff:

- **Attempt 1**: Immediate processing
- **Attempt 2**: After 5 seconds delay
- **Attempt 3**: After 10 seconds delay (2x backoff)
- **Attempt 4**: After 20 seconds delay (2x backoff)

After **3 max retries**, the event is sent to the **Dead Letter Queue (DLQ)** with topic suffix `.dlq`:
- `order.created.dlq`
- `payment.failed.dlq`

## Dead Letter Queue (DLQ)

Failed events are automatically sent to DLQ for manual review:

```typescript
// DLQ events include failure metadata
{
  "metadata": {
    "eventId": "...",
    "eventType": "order.created",
    // ... other metadata
  },
  "data": {
    // Original event data
  },
  "error": {
    "message": "Failed to process event",
    "attempts": 3,
    "lastAttemptAt": "2024-01-15T10:35:00.000Z",
    "stackTrace": "Error: ..."
  }
}
```

## Event Deduplication

Events are automatically deduplicated using Redis:

- **Producer**: Checks if event was already published (1 hour cache)
- **Consumer**: Checks if event was already processed (1 hour cache)
- **Failed Events**: Cached for 24 hours for debugging

```typescript
// Check if event was processed
const isProcessed = await this.eventProducer.isEventProcessed(eventId);
```

## Monitoring

### Kafka UI

Access Kafka UI at http://localhost:8080 to monitor:
- Topics and partitions
- Consumer groups and lag
- Messages in topics
- Broker health

### Event Status

Events are tracked in Redis with the following statuses:
- `PENDING` - Event published, waiting for processing
- `PROCESSING` - Event currently being processed
- `PROCESSED` - Event successfully processed
- `FAILED` - Event failed after max retries
- `RETRYING` - Event being retried

## Common Event Flows

### Order Creation Flow

```
Order Service → order.created
  ↓
[Event Service] → Kafka
  ↓
├─→ Inventory Service (reserve stock)
├─→ Payment Service (initiate payment)
├─→ Notification Service (send confirmation email)
└─→ Analytics Service (track conversion)
```

### Payment Success Flow

```
Payment Service → payment.succeeded
  ↓
[Event Service] → Kafka
  ↓
├─→ Order Service (update order status)
├─→ Inventory Service (commit reservation)
├─→ Notification Service (send receipt)
└─→ Recommendation Service (update user preferences)
```

### Cart Abandonment Flow

```
Cart Service → cart.abandoned
  ↓
[Event Service] → Kafka
  ↓
├─→ Notification Service (send reminder email)
├─→ Analytics Service (track abandonment)
└─→ Recommendation Service (trigger retargeting)
```

## Production Considerations

### Kafka Configuration

For production, configure:
- Multiple brokers for high availability
- Replication factor ≥ 3
- Min in-sync replicas ≥ 2
- Partitions based on throughput needs
- Retention policy based on storage capacity

### Consumer Groups

Use separate consumer groups for:
- Different services (notification, analytics, email)
- Different priorities (critical, normal, low)
- Different processing speeds (fast, slow)

### Monitoring

Monitor these metrics:
- Consumer lag (should be near 0)
- Event processing rate
- Failed events count
- DLQ message count
- Producer throughput
- Broker disk usage

### Security

- Enable SSL/TLS for Kafka connections
- Use SASL authentication
- Encrypt sensitive event data
- Rotate credentials regularly
- Use network isolation

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Example Test

```typescript
describe('EventProducerService', () => {
  it('should publish event successfully', async () => {
    await service.publishEvent('test.topic', { message: 'test' });
    // Verify event was published
  });

  it('should deduplicate events', async () => {
    const eventId = await service.publishEvent('test.topic', { data: 1 });
    const isDuplicate = await service.isEventProcessed(eventId);
    expect(isDuplicate).toBe(true);
  });
});
```

## Troubleshooting

### Kafka Connection Failed

```bash
# Check if Kafka is running
docker-compose ps

# Check Kafka logs
docker-compose logs kafka

# Verify broker address
echo $KAFKA_BROKERS
```

### Consumer Lag Issues

- Increase number of consumers
- Increase partition count
- Optimize event processing logic
- Check for slow database queries

### Events Not Being Consumed

- Verify consumer group is subscribed
- Check for handler registration
- Review consumer logs
- Verify topic exists in Kafka

### DLQ Growing

- Review failed event patterns
- Check for code bugs in handlers
- Verify external service availability
- Consider increasing retry attempts

## Architecture

```
┌─────────────────┐
│  Order Service  │─┐
└─────────────────┘ │
                    │  Publish Events
┌─────────────────┐ │
│ Payment Service │─┤
└─────────────────┘ │
                    ↓
              ┌──────────────┐
              │Event Service │
              │   (Kafka)    │
              └──────────────┘
                    ↓  Subscribe
      ┌─────────────┼─────────────┐
      ↓             ↓             ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│Notification│  │Analytics │  │  Email   │
│  Service   │  │ Service  │  │ Service  │
└──────────┘  └──────────┘  └──────────┘
```

## License

MIT

## Support

For issues and questions, please contact the development team.
