# E-Commerce Backend - Microservices Architecture

## 🎯 Overview
Production-ready microservices backend for e-commerce platform with real-time recommendations, event-driven architecture, and clean code principles.

## ⚡ Quick Start

```bash
# Interactive setup
./quick-start.sh

# Or manual:
./scripts/setup-complete-backend.sh  # Generate skeleton
cd deployment && docker-compose up -d # Start infrastructure
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

### 1. Generate Services (First Time)
```bash
./scripts/setup-complete-backend.sh
```

### 2. Start Infrastructure
```bash
cd deployment
docker-compose up -d
```

**Available at:**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Kafka: `localhost:9092`
- Kafka UI: `http://localhost:8080`
- MinIO: `http://localhost:9000`
- pgAdmin: `http://localhost:5050`

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
# Start all infrastructure
docker-compose up -d

# Stop all
docker-compose down

# View logs
docker-compose logs -f

# Reset everything
docker-compose down -v && docker-compose up -d
```

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
