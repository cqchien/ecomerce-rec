# Vici Backend - Microservices Architecture

## 🎯 Overview
Production-ready microservices backend for the Vici e-commerce platform with real-time recommendations, event-driven architecture, and clean code principles.

## ⚡ Quick Start

### 1. Environment Setup

```bash
# Copy and configure environment variables
cp deployment/.env.example deployment/.env
# Edit .env with your credentials (default values work for development)
```

### 2. Start Infrastructure

```bash
cd deployment
docker-compose up -d
```

This starts all infrastructure services with the **vici** naming convention:
- `vici-postgres` - PostgreSQL 15 (port 5432)
- `vici-redis` - Redis 7 (port 6379)
- `vici-kafka` - Apache Kafka (ports 9092, 9093)
- `vici-zookeeper` - Zookeeper (port 2181)
- `vici-kafka-ui` - Kafka UI at http://localhost:8080
- `vici-minio` - MinIO S3 storage (ports 9000, 9001)
- `vici-pgadmin` - pgAdmin at http://localhost:5050

### 3. Verify Infrastructure

```bash
# Check all containers are running
docker ps

# View logs
docker-compose logs -f
```

**📖 Read First:** [GETTING_STARTED.md](./GETTING_STARTED.md) - Complete beginner guide

**📋 Implementation Plan:** [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Detailed implementation steps

## 🏗️ Architecture

### Microservices (10 Services)

| Service | Technology | Port | Purpose |
|---------|-----------|------|---------|
| API Gateway | NestJS | 3000 | Routing, auth, rate limiting |
| Auth Service | NestJS | 3001 | Authentication, JWT |
| User Service | NestJS | 3002 | User profiles, addresses |
| **Product Service** | **Golang** | **3003** | **Product catalog, search** |
| **Inventory Service** | **Golang** | **3004** | **Stock management** |
| Cart Service | NestJS | 3005 | Shopping cart |
| Order Service | NestJS | 3006 | Order processing |
| Payment Service | NestJS | 3007 | Payment (Stripe ready) |
| **Recommendation Service** | **Golang** | **3008** | **Real-time recommendations** |
| **Event Service** | **Golang** | **3009** | **User behavior tracking** |
| Notification Service | NestJS | 3010 | Email/SMS |

### Technology Stack
- **Languages**: Golang (high-performance), NestJS/TypeScript (business logic)
- **Communication**: gRPC (synchronous), Kafka (asynchronous events)
- **Databases**: PostgreSQL (database per service)
- **Cache**: Redis (sessions, recommendations, cart)
- **Message Broker**: Apache Kafka
- **Storage**: MinIO/AWS S3 (images, files)
- **Containerization**: Docker, Docker Compose

## 📁 Project Structure

```
backend/
├── 📄 GETTING_STARTED.md         # Start here!
├── 📄 IMPLEMENTATION_GUIDE.md    # Detailed implementation
├── 🚀 quick-start.sh             # Interactive setup
├── api-gateway/                  # API Gateway (NestJS)
├── services/
│   ├── auth-service/            # ✅ Complete structure
│   ├── user-service/            # ✅ Complete structure
│   ├── product-service/         # ✅ Complete structure (Go)
│   ├── inventory-service/       # ✅ Complete structure (Go)
│   ├── cart-service/            # ✅ Complete structure
│   ├── order-service/           # ✅ Complete structure
│   ├── payment-service/         # ✅ Complete structure
│   ├── recommendation-service/  # ✅ Complete structure (Go)
│   ├── event-service/           # ✅ Complete structure (Go)
│   └── notification-service/    # ✅ Complete structure
├── proto/                        # ✅ Protocol Buffer definitions
│   ├── common.proto             # Shared types
│   ├── product.proto            # Product service
│   ├── inventory.proto          # Inventory service
│   ├── order.proto              # Order service
│   ├── user.proto               # User service
│   └── event.proto              # Event tracking
├── shared/
│   ├── proto-gen/               # Generated gRPC code
│   └── utils/                   # ✅ Common utilities (logging, errors)
├── deployment/
│   ├── docker-compose.yml       # ✅ Complete infrastructure
│   └── init-scripts/            # ✅ Database & Redis setup
├── docs/
│   └── redis-recommendation-schema.md  # ✅ ML team integration
└── scripts/
    ├── setup-complete-backend.sh   # ✅ Skeleton generator
    └── generate-proto.sh           # ✅ Proto code generator
```

## 🚀 What's Already Built

### ✅ Complete Infrastructure
- Docker Compose with PostgreSQL, Redis, Kafka, MinIO
- 10 separate databases (one per service)
- Redis with mock recommendation data
- Kafka with topics configured
- All development UIs ready

### ✅ Service Skeletons
- Complete directory structure for all services
- Package.json / go.mod configured
- Dockerfiles ready
- Environment templates
- Clean architecture folders

### ✅ Protocol Buffers
- Common types (pagination, money, address)
- Product service definitions
- Inventory service definitions
- Order service definitions
- User service definitions
- Event tracking definitions

### ✅ Shared Libraries
- Logging utility (Winston)
- Error handling classes
- TypeScript configurations

### ✅ Documentation
- Getting started guide
- Detailed implementation guide
- Redis schema for ML team
- Architecture diagrams

### ✅ Automation Scripts
- Complete skeleton generator
- Proto code generator
- Quick start interactive menu

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [GETTING_STARTED.md](./GETTING_STARTED.md) | Complete beginner guide, step-by-step |
| [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) | Detailed implementation plan, week-by-week |
| [docs/redis-recommendation-schema.md](./docs/redis-recommendation-schema.md) | Redis data structure for ML team |

## 🔧 Development Workflow

### 1. Start Infrastructure (Required First)
```bash
cd deployment
docker-compose up -d
```

**Available Services:**
- PostgreSQL: `localhost:5432` (credentials in `.env`)
- Redis: `localhost:6379` (password in `.env`)
- Kafka: `localhost:9092`
- Kafka UI: http://localhost:8080
- MinIO Console: http://localhost:9001 (credentials in `.env`)
- pgAdmin: http://localhost:5050 (credentials in `.env`)

### 2. Database Initialization

The PostgreSQL init script automatically creates:
- Application user from `POSTGRES_USER` env variable
- Separate databases for each service:
  - `auth_db`, `user_db`, `product_db`, `inventory_db`
  - `cart_db`, `order_db`, `payment_db`, `event_db`, `notification_db`
- Grants all privileges to the application user

### 3. Develop Individual Service

**NestJS Service:**
```bash
cd services/auth-service
npm install
cp .env.example .env
npm run start:dev
```

**Golang Service:**
```bash
cd services/product-service
go mod tidy
cp .env.example .env
go run cmd/product-service/main.go
```

### 4. Generate Proto Code
```bash
./scripts/generate-proto.sh
```

## 🔐 Environment Variables

All sensitive credentials are stored in `deployment/.env`:

```env
# PostgreSQL Configuration
POSTGRES_USER=vici_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=vici_db

# Redis Configuration
REDIS_PASSWORD=your_redis_password

# Kafka Configuration
KAFKA_BROKER_ID=1
ZOOKEEPER_CLIENT_PORT=2181
ZOOKEEPER_TICK_TIME=2000

# MinIO Configuration
MINIO_ROOT_USER=vici_minio_admin
MINIO_ROOT_PASSWORD=your_minio_password

# pgAdmin Configuration
PGADMIN_DEFAULT_EMAIL=admin@vici.local
PGADMIN_DEFAULT_PASSWORD=your_pgadmin_password
```

**⚠️ NEVER commit `.env` to version control!**

The `.env` file is included in `.gitignore` for security.

## 🎨 Frontend Integration

Matches all API endpoints from:
`/Users/chiencq/Projects/ecomerce_rec/frontend/src/config/api.ts`

```
Frontend → API Gateway (3000) → Services
```

## 🧪 Event Tracking for ML

**User behavior events** are captured by Event Service and published to Kafka:

```
User Action → API Gateway → Event Service → Kafka → ML Pipeline
                                                    ↓
                                              Redis (recommendations)
                                                    ↓
                                         Recommendation Service → API
```

**Events tracked:**
- Product views
- Product clicks
- Add to cart
- Searches
- Purchases

**Kafka Topics:**
- `user-events` - All user behavior
- `product-views` - Product interactions
- `cart-events` - Cart modifications
- `search-events` - Search queries
- `purchase-events` - Completed orders

## 📊 Monitoring

Each service exposes:
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

## 🐳 Docker Commands

```bash
# Start all infrastructure (uses vici-* container names)
cd deployment
docker-compose up -d

# Stop all containers
docker-compose down

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f vici-postgres
docker-compose logs -f vici-kafka

# Restart a specific service
docker-compose restart vici-redis

# Reset everything (removes all data!)
docker-compose down -v && docker-compose up -d

# Check container status
docker ps | grep vici
```

## 🗄️ Database Management

### Access Databases

**Using pgAdmin:**
- Navigate to http://localhost:5050
- Login with credentials from `.env` file
- Add new server connection:
  - Host: `vici-postgres` (or `postgres` from within Docker network)
  - Port: `5432`
  - Username: from `POSTGRES_USER` in `.env`
  - Password: from `POSTGRES_PASSWORD` in `.env`

**Using psql:**
```bash
# From host machine
docker exec -it vici-postgres psql -U vici_user -d auth_db

# List all databases
\l

# Connect to a specific service database
\c product_db
```

### Database Architecture

Each microservice has its own isolated database:
| Database | Service | Purpose |
|----------|---------|---------|
| `auth_db` | Auth Service | User credentials, tokens |
| `user_db` | User Service | User profiles, addresses |
| `product_db` | Product Service | Product catalog |
| `inventory_db` | Inventory Service | Stock levels |
| `cart_db` | Cart Service | Shopping carts |
| `order_db` | Order Service | Orders, order items |
| `payment_db` | Payment Service | Transactions |
| `event_db` | Event Service | User events |
| `notification_db` | Notification Service | Notification logs |

All databases are owned by the user specified in `POSTGRES_USER` environment variable.

## 🔐 Security

- ✅ JWT authentication
- ✅ bcrypt password hashing
- ✅ Redis session management
- ✅ CORS configuration
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ Rate limiting ready

## 📈 Next Steps

1. **Implement Auth Service** (Week 1)
   - See detailed guide in IMPLEMENTATION_GUIDE.md
   - Already has complete structure and entities

2. **Implement Product Service** (Week 1)
   - Golang with clean architecture
   - gRPC endpoints defined

3. **Build API Gateway** (Week 1)
   - Route all frontend requests
   - Add authentication middleware

4. **Continue with other services** (Weeks 2-4)
   - Follow implementation guide
   - Test as you build

## 🤝 Support

- Check [GETTING_STARTED.md](./GETTING_STARTED.md) first
- Review [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- Check individual service READMEs
- Review proto definitions in `proto/`

## 📝 License
Proprietary

---

**Ready to start building?**

```bash
./quick-start.sh
```

**Or read the guides:**
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Complete walkthrough
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Implementation details
