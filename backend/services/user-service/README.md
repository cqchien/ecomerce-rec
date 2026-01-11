# User Service

User profile and preferences management microservice built with NestJS, TypeORM, and PostgreSQL for the e-commerce platform.

## Features

- **User Profile Management**: Get and update user profiles
- **Address Management**: CRUD operations for user addresses with default address support
- **User Preferences**: Manage notification settings, language, and currency preferences
- **Wishlist**: Add/remove products to/from wishlist with pagination
- **Cache Layer**: Redis caching for high-performance data retrieval
- **Clean Architecture**: Domain-driven design with clear separation of concerns
- **TypeORM**: ORM for database operations with auto-sync in development
- **Validation**: Class-validator for DTO validation
- **Health Checks**: HTTP endpoints for monitoring

## Technology Stack

- **NestJS**: Progressive Node.js framework
- **TypeORM**: ORM for TypeScript and JavaScript
- **PostgreSQL**: Primary database
- **Redis**: Caching layer
- **TypeScript**: Type-safe development
- **Class-validator**: DTO validation

## Architecture

```
user-service/
├── src/
│   ├── domain/                      # Domain layer
│   │   └── entities/
│   │       ├── user.entity.ts
│   │       ├── address.entity.ts
│   │       ├── user-preferences.entity.ts
│   │       └── wishlist-item.entity.ts
│   ├── application/                 # Application layer
│   │   ├── dto/
│   │   │   ├── update-profile.dto.ts
│   │   │   ├── address.dto.ts
│   │   │   └── update-preferences.dto.ts
│   │   ├── services/
│   │   │   ├── user.service.ts
│   │   │   ├── address.service.ts
│   │   │   ├── preferences.service.ts
│   │   │   └── wishlist.service.ts
│   │   └── user.module.ts
│   ├── infrastructure/              # Infrastructure layer
│   │   ├── database/
│   │   │   └── database.config.ts
│   │   └── redis/
│   │       ├── redis.service.ts
│   │       └── redis.module.ts
│   ├── presentation/                # Presentation layer
│   │   └── http/
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

### users
- `id`: UUID primary key
- `email`: Unique email address
- `name`: User's full name
- `phone`: Phone number (optional)
- `avatar`: Avatar URL (optional)
- `created_at`, `updated_at`, `deleted_at`

### addresses
- `id`: UUID primary key
- `user_id`: Foreign key to users
- `first_name`, `last_name`
- `address_line1`, `address_line2`
- `city`, `state`, `postal_code`, `country`
- `phone`: Contact phone
- `is_default`: Boolean flag
- `created_at`, `updated_at`, `deleted_at`

### user_preferences
- `user_id`: Primary key (one-to-one with users)
- `email_notifications`: Boolean (default: true)
- `sms_notifications`: Boolean (default: false)
- `marketing_emails`: Boolean (default: false)
- `language`: String (default: 'en')
- `currency`: String (default: 'USD')
- `updated_at`

### wishlist_items
- `id`: UUID primary key
- `user_id`: Foreign key to users
- `product_id`: Product identifier
- `added_at`: Timestamp
- Unique constraint on (user_id, product_id)

## API Endpoints

### HTTP (Port 5002)

- `GET /health`: Service health check
- `GET /readiness`: Service readiness check

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

4. **Run Migrations**
   TypeORM auto-sync is enabled in development mode

5. **Start Service**
   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

## Usage Examples

### Get User Profile
```typescript
const profile = await userService.getProfile('user-123');
```

### Update Profile
```typescript
const dto: UpdateProfileDto = {
  userId: 'user-123',
  name: 'John Doe',
  phone: '+1234567890',
};
const updated = await userService.updateProfile(dto);
```

### Add Address
```typescript
const dto: AddAddressDto = {
  userId: 'user-123',
  firstName: 'John',
  lastName: 'Doe',
  addressLine1: '123 Main St',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'USA',
  phone: '+1234567890',
  isDefault: true,
};
const address = await addressService.addAddress(dto);
```

### Update Preferences
```typescript
const dto: UpdatePreferencesDto = {
  userId: 'user-123',
  emailNotifications: true,
  language: 'en',
  currency: 'USD',
};
const prefs = await preferencesService.updatePreferences(dto);
```

### Manage Wishlist
```typescript
// Add to wishlist
await wishlistService.addToWishlist('user-123', 'product-456');

// Get wishlist with pagination
const result = await wishlistService.getWishlist('user-123', {
  page: 1,
  pageSize: 20,
});

// Remove from wishlist
await wishlistService.removeFromWishlist('user-123', 'product-456');
```

## Key Features

### Automatic Default Address Management
- When adding/updating an address as default, automatically unsets other default addresses
- Ensures only one default address per user

### Auto-create Preferences
- Preferences are automatically created with defaults when first accessed
- No need to manually create preferences for new users

### Caching Strategy
- User profiles cached for 1 hour
- Preferences cached for 2 hours
- Wishlist cached for 30 minutes
- Addresses cached for 1 hour
- Cache invalidation on updates/deletes

### Soft Deletes
- All entities use TypeORM soft deletes
- Deleted records preserved in database with `deleted_at` timestamp

### Validation
- All DTOs validated using class-validator
- Length constraints on text fields
- Type checking and transformation

### Constants & Configuration
- All magic values defined as constants
- No hardcoded values in business logic
- Easy to adjust thresholds and settings
- Centralized in `constants.ts`

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

- Health check: `http://localhost:5002/health`
- Readiness check: `http://localhost:5002/readiness`
- Logs: Structured logging to stdout

## License

MIT
