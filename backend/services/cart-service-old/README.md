# Cart Service

Shopping cart management microservice built with NestJS, TypeORM, and PostgreSQL for the e-commerce platform.

## Features

- **Cart Management**: Create, retrieve, and manage shopping carts
- **Item Operations**: Add, update, remove items from cart
- **Price Calculations**: Automatic subtotal, discount, and total calculation
- **Coupon Support**: Apply and remove coupon codes
- **Cart Abandonment**: Track and mark abandoned carts
- **Auto Cleanup**: Scheduled tasks to clean expired and abandoned carts
- **Cache Layer**: Redis caching for high-performance cart retrieval
- **Clean Architecture**: Domain-driven design with clear separation of concerns
- **TypeORM**: ORM with auto-sync in development
- **Validation**: Class-validator for DTO validation
- **RESTful API**: Full REST API for cart operations

## Technology Stack

- **NestJS**: Progressive Node.js framework
- **TypeORM**: ORM for TypeScript
- **PostgreSQL**: Primary database
- **Redis**: Caching layer
- **@nestjs/schedule**: Cron jobs for cleanup tasks
- **Class-validator**: DTO validation

## Architecture

```
cart-service/
├── src/
│   ├── domain/                      # Domain layer
│   │   └── entities/
│   │       ├── cart.entity.ts
│   │       └── cart-item.entity.ts
│   ├── application/                 # Application layer
│   │   ├── dto/
│   │   │   └── cart.dto.ts
│   │   ├── services/
│   │   │   └── cart.service.ts
│   │   └── cart.module.ts
│   ├── infrastructure/              # Infrastructure layer
│   │   ├── database/
│   │   │   └── database.config.ts
│   │   ├── redis/
│   │   │   ├── redis.service.ts
│   │   │   └── redis.module.ts
│   │   └── tasks/
│   │       └── cart-cleanup.task.ts
│   ├── presentation/                # Presentation layer
│   │   └── http/
│   │       ├── cart.controller.ts
│   │       └── health.controller.ts
│   ├── common/
│   │   └── constants.ts             # All constants
│   ├── app.module.ts
│   └── main.ts
├── package.json
├── tsconfig.json
└── .env.example
```

## Database Schema

### carts
- `id`: UUID primary key
- `user_id`: User identifier (indexed)
- `subtotal`: Decimal(10,2) - Sum of all items
- `discount`: Decimal(10,2) - Discount amount from coupon
- `total`: Decimal(10,2) - Final total (subtotal - discount)
- `is_abandoned`: Boolean - Marked if inactive for 24h
- `coupon_code`: String - Applied coupon code (nullable)
- `created_at`, `updated_at`, `deleted_at`

### cart_items
- `id`: UUID primary key
- `cart_id`: Foreign key to carts (cascade delete)
- `product_id`: Product identifier (indexed)
- `variant_id`: Product variant identifier (nullable)
- `name`: Product name
- `image`: Product image URL (nullable)
- `sku`: Stock keeping unit (nullable)
- `quantity`: Integer - Item quantity (1-99)
- `unit_price`: Decimal(10,2) - Price per unit
- `total_price`: Decimal(10,2) - quantity × unit_price
- `created_at`, `updated_at`
- Unique constraint on (cart_id, product_id, variant_id)

## API Endpoints

### REST API (Port 5003)

**Cart Operations:**
- `GET /api/cart/:userId` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update item quantity
- `DELETE /api/cart/remove` - Remove item from cart
- `DELETE /api/cart/:userId/clear` - Clear entire cart

**Coupon Operations:**
- `POST /api/cart/coupon/apply` - Apply coupon code
- `DELETE /api/cart/:userId/coupon` - Remove coupon

**Health Checks:**
- `GET /health` - Service health
- `GET /readiness` - Service readiness

## Setup

1. **Install Dependencies**
   ```bash
   npm install
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

4. **Run Service**
   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

## Usage Examples

### Get Cart
```bash
GET /api/cart/user-123
```

### Add to Cart
```bash
POST /api/cart/add
{
  "userId": "user-123",
  "productId": "product-456",
  "variantId": "variant-789",
  "quantity": 2,
  "name": "Product Name",
  "image": "https://example.com/image.jpg",
  "sku": "SKU-123",
  "unitPrice": 29.99
}
```

### Update Quantity
```bash
PUT /api/cart/update
{
  "userId": "user-123",
  "cartItemId": "item-456",
  "quantity": 5
}
```

### Remove Item
```bash
DELETE /api/cart/remove
{
  "userId": "user-123",
  "cartItemId": "item-456"
}
```

### Apply Coupon
```bash
POST /api/cart/coupon/apply
{
  "userId": "user-123",
  "couponCode": "SAVE10"
}
```

### Clear Cart
```bash
DELETE /api/cart/user-123/clear
```

## Key Features

### Automatic Price Calculation
- Calculates `totalPrice` for each item (quantity × unitPrice)
- Calculates cart `subtotal` (sum of all item totals)
- Applies discount from coupon
- Calculates final `total` (subtotal - discount)
- All prices rounded to 2 decimal places

### Duplicate Item Prevention
- Unique constraint on (cart_id, product_id, variant_id)
- When adding existing item, quantity is incremented
- Prevents duplicate entries in cart

### Cart Abandonment Tracking
- **Hourly Check**: Marks carts as abandoned if inactive for 24h
- **Daily Cleanup**: Deletes carts older than 30 days
- Background cron jobs using @nestjs/schedule

### Caching Strategy
- User carts cached in Redis (30-minute TTL)
- Cache invalidation on any cart modification
- Cache-aside pattern for performance

### Quantity Limits
- Min quantity per item: 1
- Max quantity per item: 99
- Max items per cart: 50

### Soft Deletes
- Cart items use hard delete (cascade on cart delete)
- Carts use TypeORM soft delete

### Validation
- All DTOs validated with class-validator
- Quantity bounds enforced
- Required fields checked

### Constants & Configuration
- All magic values defined as constants
- No hardcoded values in business logic
- Easy to adjust limits and settings
- Centralized in `constants.ts`

## Scheduled Tasks

### Daily Cart Cleanup (2 AM)
Deletes carts that haven't been updated in 30 days to prevent database bloat.

### Hourly Abandonment Check
Marks carts as abandoned if they haven't been updated in 24 hours and contain items. Used for abandoned cart email campaigns.

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

## Monitoring

- Health check: `http://localhost:5003/health`
- Readiness check: `http://localhost:5003/readiness`
- Logs: Structured logging to stdout with cron job execution logs

## Integration

This service is designed to work with:
- **Product Service**: Fetch product details and prices
- **Inventory Service**: Check stock availability before adding to cart
- **Order Service**: Convert cart to order on checkout
- **User Service**: Validate user and get default addresses
- **Coupon Service**: Validate and calculate coupon discounts

## License

MIT
