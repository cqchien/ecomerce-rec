# Notification Service

Multi-channel notification service for e-commerce platform supporting email, SMS, and push notifications with event-driven architecture.

## Features

- **Multi-Channel Notifications**: Email, SMS, Push, In-App
- **Event-Driven**: Kafka consumer for real-time event processing
- **Template Management**: Handlebars templates with caching
- **User Preferences**: Fine-grained notification settings per user
- **Rate Limiting**: Prevent notification spam
- **Retry Logic**: Exponential backoff for failed deliveries
- **Provider Integration**: SendGrid, Twilio, Firebase
- **Batch Processing**: Efficient bulk notification sending
- **Notification History**: Track all sent notifications
- **Redis Caching**: Fast preference and template retrieval

## Tech Stack

- **Framework**: NestJS 10.x
- **ORM**: TypeORM 0.3.17
- **Database**: PostgreSQL
- **Cache**: Redis (ioredis 5.3.2)
- **Message Broker**: Kafka (kafkajs 2.2.4)
- **Email Provider**: SendGrid (@sendgrid/mail 8.1.0)
- **SMS Provider**: Twilio (twilio 4.20.0)
- **Push Provider**: Firebase (firebase-admin 12.0.0)
- **Template Engine**: Handlebars 4.7.8

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update environment variables
# Edit .env with your configuration
```

## Environment Variables

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=notification_db

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=notification-service
KAFKA_GROUP_ID=notification-service-group

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourstore.com
SENDGRID_FROM_NAME=Your Store

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key

# Application Configuration
NODE_ENV=development
PORT=3008
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

## Architecture

### Clean Architecture Layers

```
notification-service/
├── entities/        # Domain entities (3 entities)
├── services/        # Business logic (6 services)
├── providers/       # External integrations (3 providers)
├── controllers/     # HTTP API (3 controllers)
├── infrastructure/  # Redis module
└── common/          # Constants (60+ constants)
```

### Entities

**Notification**
- Tracks all sent notifications
- Status: pending, sent, failed, queued, processing, delivered, bounced
- Priority: low, normal, high, critical
- Retry tracking with max 3 attempts

**UserPreference**
- Per-user notification settings
- Channel preferences (email, SMS, push)
- Category preferences (orders, payments, marketing)
- Contact information (email, phone, push tokens)
- Language and timezone settings

**NotificationTemplate**
- Reusable templates with Handlebars
- Multi-language support
- Subject, HTML, and text content
- Variable tracking

### Constants (60+)

**Notification Types**
```typescript
NOTIFICATION_TYPES: email, sms, push, in_app
```

**Notification Channels**
```typescript
NOTIFICATION_CHANNELS: order, user, payment, marketing, system, cart, product
```

**Email Templates (15+)**
```typescript
EMAIL_TEMPLATES:
  - welcome, email_verification, password_reset
  - order_confirmation, order_shipped, order_delivered, order_cancelled
  - payment_success, payment_failed, refund_processed
  - cart_abandoned, cart_reminder
  - promotional, newsletter, product_recommendation
  - low_stock_alert, price_drop_alert
```

**Rate Limits**
```typescript
EMAIL_PER_MINUTE: 100
SMS_PER_MINUTE: 50
PUSH_PER_MINUTE: 200
PER_USER_PER_HOUR: 10
```

**Retry Configuration**
```typescript
MAX_RETRIES: 3
INITIAL_DELAY: 5000ms (5 seconds)
MAX_DELAY: 60000ms (60 seconds)
BACKOFF_MULTIPLIER: 2 (exponential backoff)
```

**Cache TTL**
```typescript
USER_PREFERENCES: 3600s (1 hour)
TEMPLATE: 7200s (2 hours)
SENT_LOG: 86400s (24 hours)
RATE_LIMIT: 60s (1 minute)
```

## API Endpoints

### Get User Notifications

```bash
GET /api/notifications?userId=user-123&limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif-uuid",
        "userId": "user-123",
        "type": "email",
        "channel": "order",
        "template": "order_confirmation",
        "subject": "Order Confirmed",
        "status": "sent",
        "sentAt": "2026-01-11T10:00:00Z"
      }
    ],
    "total": 45,
    "limit": 20,
    "offset": 0
  }
}
```

### Send Notification

```bash
POST /api/notifications/send
Content-Type: application/json

{
  "userId": "user-123",
  "type": "email",
  "channel": "order",
  "template": "order_confirmation",
  "data": {
    "orderId": "order-456",
    "orderNumber": "ORD-2024-001",
    "totalAmount": 199.99,
    "items": [...]
  },
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notificationId": "notif-uuid"
  },
  "message": "Notification queued successfully"
}
```

### Get Notification Stats

```bash
GET /api/notifications/stats?userId=user-123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sent": 120,
    "failed": 5,
    "pending": 2,
    "delivered": 115
  }
}
```

### Get User Preferences

```bash
GET /api/preferences/user-123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "emailEnabled": true,
    "smsEnabled": true,
    "pushEnabled": true,
    "marketingEnabled": false,
    "orderUpdates": true,
    "paymentUpdates": true,
    "cartReminders": true,
    "email": "user@example.com",
    "phoneNumber": "+1234567890",
    "language": "en",
    "timezone": "UTC"
  }
}
```

### Update User Preferences

```bash
PUT /api/preferences/user-123
Content-Type: application/json

{
  "emailEnabled": true,
  "marketingEnabled": true,
  "cartReminders": false,
  "language": "en"
}
```

### Add Push Token

```bash
PUT /api/preferences/user-123/push-tokens
Content-Type: application/json

{
  "token": "fcm-device-token-abc123"
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
  "service": "notification-service",
  "timestamp": "2026-01-11T10:00:00Z"
}
```

## Event Consumption

The service automatically consumes events from Kafka and sends notifications:

### Order Events

**order.created** → Email + SMS order confirmation
```typescript
Template: order_confirmation
Data: orderId, orderNumber, totalAmount, items, shippingAddress
Priority: high
```

**order.shipped** → Email + SMS shipping notification
```typescript
Template: order_shipped
Data: orderId, trackingNumber, carrier, estimatedDelivery
Priority: high
```

**order.delivered** → Email delivery confirmation
```typescript
Template: order_delivered
Data: orderId, deliveredAt
Priority: normal
```

**order.cancelled** → Email cancellation notice
```typescript
Template: order_cancelled
Data: orderId, reason, refundAmount
Priority: high
```

### Payment Events

**payment.succeeded** → Email payment confirmation
```typescript
Template: payment_success
Data: orderId, amount, paymentMethod, transactionId
Priority: high
```

**payment.failed** → Email payment failure
```typescript
Template: payment_failed
Data: orderId, amount, reason
Priority: critical
```

**payment.refunded** → Email refund notification
```typescript
Template: refund_processed
Data: orderId, refundAmount, reason
Priority: high
```

### User Events

**user.registered** → Welcome email
```typescript
Template: welcome
Data: name, email
Priority: normal
```

**user.password_reset_requested** → Password reset email
```typescript
Template: password_reset
Data: resetToken, resetLink, expiresAt
Priority: high
```

### Cart Events

**cart.abandoned** → Cart reminder email (after 1 hour delay)
```typescript
Template: cart_abandoned
Data: cartItems, totalAmount, cartUrl
Priority: low
```

### Inventory Events

**inventory.stock_low** → Admin alert email
```typescript
Template: low_stock_alert
Data: productId, productName, currentStock, threshold
Priority: high
```

### Product Events

**product.price_changed** → Price drop alert (for wishlist users)
```typescript
Template: price_drop_alert
Data: productName, oldPrice, newPrice, discount, productUrl
Priority: normal
```

## Template System

### Handlebars Templates

Templates support variables and helpers:

```handlebars
<!DOCTYPE html>
<html>
<head>
  <title>{{subject}}</title>
</head>
<body>
  <h1>Hello {{name}}!</h1>
  
  <p>Your order #{{orderNumber}} has been confirmed.</p>
  
  <h2>Order Summary</h2>
  <p>Total: {{currency totalAmount}}</p>
  <p>Ordered on: {{date orderDate}}</p>
  
  {{#each items}}
  <div>
    <p>{{this.productName}} - Qty: {{this.quantity}} - {{currency this.price}}</p>
  </div>
  {{/each}}
</body>
</html>
```

### Built-in Helpers

- `{{currency value}}` - Format as currency ($99.99)
- `{{date value}}` - Format as date
- `{{datetime value}}` - Format as datetime

## User Preferences

Users can control:
- **Channel Toggles**: Enable/disable email, SMS, push
- **Category Toggles**: Order updates, payment updates, cart reminders, marketing
- **Contact Info**: Email, phone number, push tokens
- **Localization**: Language (en, es, fr, etc.), timezone

**Default Settings:**
```typescript
EMAIL_ENABLED: true
SMS_ENABLED: true
PUSH_ENABLED: true
MARKETING_ENABLED: false  // Opt-in required
ORDER_UPDATES: true
PAYMENT_UPDATES: true
CART_REMINDERS: true
PRODUCT_RECOMMENDATIONS: false
```

## Rate Limiting

Prevent notification spam with Redis-based rate limiting:

- **Email**: 100 per minute
- **SMS**: 50 per minute
- **Push**: 200 per minute
- **Per User**: 10 per hour (across all channels)

Rate limits are enforced before sending and reset automatically.

## Retry Logic

Failed notifications are automatically retried with exponential backoff:

1. **Attempt 1**: Immediate send
2. **Attempt 2**: After 5 seconds
3. **Attempt 3**: After 10 seconds (2x backoff)
4. **Attempt 4**: After 20 seconds (2x backoff)
5. **Max Retries Reached**: Mark as failed, log error

**Manual Retry:**
```bash
POST /api/notifications/retry-failed?limit=100
```

## Provider Configuration

### SendGrid (Email)

1. Sign up at https://sendgrid.com
2. Create API key
3. Verify sender email
4. Set environment variables:
```bash
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@yourstore.com
SENDGRID_FROM_NAME=Your Store
```

### Twilio (SMS)

1. Sign up at https://www.twilio.com
2. Get Account SID and Auth Token
3. Purchase phone number
4. Set environment variables:
```bash
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
```

### Firebase (Push Notifications)

1. Create Firebase project
2. Generate service account key
3. Set environment variables:
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----
```

## Monitoring

### Key Metrics

- Notification send rate (per minute)
- Delivery success rate
- Failed notification count
- Average retry attempts
- Rate limit violations
- Provider response times

### Logging

All notifications are logged with:
- User ID
- Notification type and channel
- Template used
- Status changes
- Error messages
- Provider responses

## Database Schema

### Notifications Table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  template VARCHAR(100) NOT NULL,
  recipient VARCHAR(255),
  subject VARCHAR(255) NOT NULL,
  content TEXT,
  data JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(50) DEFAULT 'normal',
  retry_count INT DEFAULT 0,
  error TEXT,
  provider VARCHAR(100),
  provider_message_id VARCHAR(255),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  failed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_created ON notifications(user_id, created_at);
CREATE INDEX idx_status_created ON notifications(status, created_at);
CREATE INDEX idx_type_status ON notifications(type, status);
```

### User Preferences Table

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  marketing_enabled BOOLEAN DEFAULT false,
  order_updates BOOLEAN DEFAULT true,
  payment_updates BOOLEAN DEFAULT true,
  cart_reminders BOOLEAN DEFAULT true,
  product_recommendations BOOLEAN DEFAULT false,
  email VARCHAR(255),
  phone_number VARCHAR(20),
  push_tokens JSONB,
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_id ON user_preferences(user_id);
```

## Testing

```bash
# Run tests
npm run test

# Run with coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## Performance Optimization

### Caching Strategy

- **User Preferences**: Cached for 1 hour
- **Templates**: Compiled and cached for 2 hours
- **Rate Limits**: Redis counters with 1-minute TTL

### Batch Processing

Send multiple notifications efficiently:
- Batch size: 100 notifications
- Concurrent batches: 5
- Timeout: 10 seconds per batch

### Database Indexes

Strategic indexes for:
- User notification queries
- Status filtering
- Date range queries

## Troubleshooting

### Notifications Not Sending

**Check:**
1. User preferences - Verify channel enabled
2. Rate limits - Check Redis counters
3. Provider credentials - Verify API keys
4. Kafka connection - Check event consumption
5. Template exists - Verify template name

### High Failure Rate

**Causes:**
- Invalid recipient (email/phone)
- Provider API errors
- Template rendering errors
- Network issues

**Solutions:**
- Validate recipient data
- Check provider status
- Review template syntax
- Monitor retry queue

### Slow Performance

**Optimizations:**
- Enable template caching
- Increase batch size
- Add database indexes
- Scale horizontally

## License

MIT

## Support

For issues and questions, please contact the development team.
