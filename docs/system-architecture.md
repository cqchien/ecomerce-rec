# E-Commerce System Architecture

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Microservices Architecture](#microservices-architecture)
4. [Infrastructure Components](#infrastructure-components)
5. [Data Flow](#data-flow)
6. [Deployment Architecture](#deployment-architecture)
7. [Security Architecture](#security-architecture)
8. [Scalability & Performance](#scalability--performance)

---

## 1. Overview

This document describes the system architecture for a modern, scalable e-commerce platform built using a microservices architecture pattern. The system is designed to handle high traffic, provide real-time product recommendations, and ensure seamless user experience across all features.

### 1.1 Architecture Principles
- **Microservices**: Decoupled services with single responsibility
- **Event-Driven**: Asynchronous communication via message queues
- **Scalability**: Horizontal scaling for all services
- **Resilience**: Fault tolerance and graceful degradation
- **Performance**: Caching strategies and optimized data access

---

## 2. Technology Stack

### 2.1 Backend Services
- **Go (Golang)**: High-performance services (Product Service, Inventory Service, Recommendation Service)
- **NestJS (Node.js + TypeScript)**: Business logic services (User Service, Order Service, Cart Service)

### 2.2 Message Broker
- **Apache Kafka**: Event streaming platform for asynchronous communication
  - User behavior events
  - Order events
  - Inventory updates
  - Recommendation triggers

### 2.3 Databases
- **PostgreSQL**: Primary relational database
  - User data
  - Product catalog
  - Orders and transactions
  - Inventory records

### 2.4 Caching Layer
- **Redis**: In-memory data store
  - Session management
  - Shopping cart data
  - Product cache
  - Rate limiting
  - Recommendation cache

### 2.5 Additional Technologies
- **Docker**: Containerization
- **Kubernetes**: Container orchestration (optional)
- **Nginx**: API Gateway / Load Balancer
- **JWT**: Authentication tokens
- **Stripe/PayPal**: Payment processing
- **Elasticsearch**: Product search (optional)
- **Prometheus + Grafana**: Monitoring and alerting

---

## 3. Microservices Architecture

### 3.1 Service Breakdown

#### **Authentication Service (NestJS)**
- **Responsibilities**:
  - User registration and login
  - JWT token generation and validation
  - Password management (reset, change)
  - Session management
  - OAuth integration (Google, Facebook)
- **Database**: PostgreSQL (users table)
- **Cache**: Redis (session data, refresh tokens)
- **Events Published**: `user.registered`, `user.logged_in`

#### **User Service (NestJS)**
- **Responsibilities**:
  - User profile management
  - User preferences
  - Address management
  - Order history
  - Wishlist management
- **Database**: PostgreSQL (users, addresses, preferences)
- **Events Published**: `user.updated`, `user.deleted`

#### **Product Service (Golang)**
- **Responsibilities**:
  - Product catalog management
  - Category management
  - Product search and filtering
  - Product details and variants
  - Product images and metadata
- **Database**: PostgreSQL (products, categories, product_variants)
- **Cache**: Redis (product details, category tree)
- **Events Published**: `product.created`, `product.updated`, `product.deleted`

#### **Inventory Service (Golang)**
- **Responsibilities**:
  - Stock level tracking
  - Inventory reservations
  - Stock updates
  - Low stock alerts
  - Warehouse management
- **Database**: PostgreSQL (inventory, reservations)
- **Cache**: Redis (stock levels)
- **Events Published**: `inventory.updated`, `inventory.low_stock`
- **Events Consumed**: `order.placed`, `order.cancelled`

#### **Cart Service (NestJS)**
- **Responsibilities**:
  - Shopping cart management
  - Add/remove/update items
  - Cart persistence
  - Cart abandonment tracking
  - Price calculations
- **Database**: PostgreSQL (carts, cart_items)
- **Cache**: Redis (active carts)
- **Events Published**: `cart.updated`, `cart.abandoned`

#### **Order Service (NestJS)**
- **Responsibilities**:
  - Order creation and management
  - Order status tracking
  - Order history
  - Invoice generation
  - Order cancellation and refunds
- **Database**: PostgreSQL (orders, order_items, order_status)
- **Events Published**: `order.created`, `order.updated`, `order.completed`, `order.cancelled`
- **Events Consumed**: `payment.completed`, `inventory.reserved`

#### **Payment Service (NestJS)**
- **Responsibilities**:
  - Payment processing
  - Payment gateway integration
  - Transaction management
  - Refund handling
  - Payment method management
- **Database**: PostgreSQL (transactions, payment_methods)
- **Events Published**: `payment.initiated`, `payment.completed`, `payment.failed`
- **Events Consumed**: `order.created`

#### **Recommendation Service (Golang)**
- **Responsibilities**:
  - Real-time product recommendations
  - Collaborative filtering
  - Content-based recommendations
  - Trending products
  - Personalized suggestions
- **Database**: PostgreSQL (user interactions, product metadata)
- **Cache**: Redis (recommendation results, user profiles)
- **Events Consumed**: `user.viewed_product`, `user.added_to_cart`, `order.completed`
- **Events Published**: `recommendation.generated`

#### **Notification Service (NestJS)**
- **Responsibilities**:
  - Email notifications
  - SMS notifications
  - Push notifications
  - Order updates
  - Marketing campaigns
- **Database**: PostgreSQL (notification_logs)
- **Events Consumed**: `order.created`, `order.shipped`, `user.registered`

---

### 3.2 Service Communication

```
┌─────────────────┐
│   API Gateway   │
│     (Nginx)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────────┐
│ Auth  │ │  Product  │
│Service│ │  Service  │
└───┬───┘ └──┬────────┘
    │        │
    ├────────┴────────────────┬──────────┬─────────────┐
    │                         │          │             │
┌───▼───┐  ┌────────┐  ┌─────▼─────┐ ┌─▼──────┐ ┌────▼──────┐
│ User  │  │  Cart  │  │ Inventory │ │  Order │ │Recommend. │
│Service│  │Service │  │  Service  │ │Service │ │  Service  │
└───────┘  └────┬───┘  └───────────┘ └───┬────┘ └───────────┘
                │                         │
                │      ┌──────────┐      │
                └─────►│ Payment  │◄─────┘
                       │ Service  │
                       └────┬─────┘
                            │
                       ┌────▼──────┐
                       │Notification│
                       │  Service  │
                       └───────────┘

         All services communicate via Kafka for async events
```

---

## 4. Infrastructure Components

### 4.1 Apache Kafka
**Topics**:
- `user-events`: User behavior tracking
- `order-events`: Order lifecycle events
- `inventory-events`: Stock updates
- `payment-events`: Payment transactions
- `notification-events`: Notification triggers
- `recommendation-events`: Recommendation requests/results

**Configuration**:
- Partitions: Based on user_id or order_id for ordering
- Replication factor: 3 for production
- Retention: 7 days for events, 30 days for orders

### 4.2 PostgreSQL
**Databases**:
- `auth_db`: Users, sessions, tokens
- `product_db`: Products, categories, variants
- `inventory_db`: Stock levels, reservations
- `order_db`: Orders, order items, transactions
- `user_db`: User profiles, addresses, preferences

**Scaling Strategy**:
- Read replicas for read-heavy operations
- Connection pooling (PgBouncer)
- Partitioning for large tables (orders, events)

### 4.3 Redis
**Use Cases**:
- Session storage (TTL: 24 hours)
- Shopping cart cache (TTL: 7 days)
- Product cache (TTL: 1 hour)
- Rate limiting (sliding window)
- Distributed locks
- Recommendation cache (TTL: 30 minutes)

**Data Structures**:
- Hash: User sessions, product details
- Set: Shopping cart items
- Sorted Set: Trending products, recommendations
- String: Rate limiting counters

---

## 5. Data Flow

### 5.1 User Authentication Flow
```
1. User submits credentials → API Gateway
2. API Gateway → Auth Service
3. Auth Service validates → PostgreSQL
4. Generate JWT token
5. Store session → Redis
6. Return token to user
7. Publish user.logged_in event → Kafka
```

### 5.2 Product Browsing Flow
```
1. User requests products → API Gateway
2. API Gateway → Product Service
3. Product Service checks cache → Redis
4. If miss, query → PostgreSQL
5. Cache result → Redis
6. Return products to user
7. Publish user.viewed_product → Kafka
8. Recommendation Service consumes event
```

### 5.3 Add to Cart Flow
```
1. User adds item → API Gateway
2. API Gateway → Cart Service
3. Validate product → Product Service
4. Check stock → Inventory Service
5. Update cart → Redis + PostgreSQL
6. Return updated cart
7. Publish cart.updated → Kafka
```

### 5.4 Checkout Flow
```
1. User initiates checkout → Order Service
2. Order Service validates cart → Cart Service
3. Reserve inventory → Inventory Service
4. Create order → PostgreSQL
5. Publish order.created → Kafka
6. Payment Service consumes event
7. Process payment → Payment Gateway
8. Publish payment.completed → Kafka
9. Order Service updates status
10. Inventory Service commits reservation
11. Notification Service sends confirmation
12. Clear cart → Cart Service
```

### 5.5 Recommendation Flow
```
1. User views product → Publish event to Kafka
2. Recommendation Service consumes events
3. Calculate recommendations (real-time or batch)
4. Store in Redis cache
5. API request → Recommendation Service
6. Return cached recommendations
7. Update based on user interactions
```

---

## 6. Deployment Architecture

### 6.1 Container Architecture
```
┌────────────────────────────────────────────┐
│           Load Balancer (Nginx)            │
└──────────────────┬─────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼────┐   ┌────▼─────┐   ┌───▼────┐
│Service │   │ Service  │   │Service │
│Pod 1   │   │  Pod 2   │   │ Pod 3  │
└────────┘   └──────────┘   └────────┘

┌──────────────────────────────────────────┐
│         Kafka Cluster (3 brokers)        │
└──────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │
│   Primary    │  │   Cluster    │
│  + Replicas  │  │              │
└──────────────┘  └──────────────┘
```

### 6.2 Environment Setup
- **Development**: Docker Compose for local development
- **Staging**: Kubernetes cluster with reduced replicas
- **Production**: Kubernetes with auto-scaling, multiple availability zones

---

## 7. Security Architecture

### 7.1 Authentication & Authorization
- **JWT**: Stateless authentication with short-lived access tokens
- **Refresh Tokens**: Stored in Redis with longer TTL
- **Role-Based Access Control (RBAC)**: Admin, Customer, Guest
- **API Key**: For service-to-service communication

### 7.2 Data Security
- **Encryption at Rest**: Database encryption (PostgreSQL)
- **Encryption in Transit**: TLS/SSL for all communications
- **PCI Compliance**: Payment data handling via certified gateways
- **Password Hashing**: bcrypt with salt

### 7.3 API Security
- **Rate Limiting**: Redis-based rate limiter
- **CORS**: Configured for allowed origins
- **Input Validation**: Schema validation on all endpoints
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Output sanitization

---

## 8. Scalability & Performance

### 8.1 Horizontal Scaling
- **Stateless Services**: All services designed to be stateless
- **Auto-scaling**: Based on CPU/memory metrics
- **Load Balancing**: Round-robin and least-connections

### 8.2 Caching Strategy
- **L1 Cache**: In-memory cache within services
- **L2 Cache**: Redis for distributed caching
- **CDN**: Static assets and product images

### 8.3 Database Optimization
- **Indexing**: Strategic indexes on frequently queried columns
- **Query Optimization**: Use of EXPLAIN for complex queries
- **Connection Pooling**: Reuse database connections
- **Read Replicas**: Separate read and write operations

### 8.4 Performance Targets
- **API Response Time**: < 200ms (p95)
- **Page Load Time**: < 2s
- **Recommendation Latency**: < 100ms
- **Search Results**: < 300ms
- **Checkout Process**: < 5s end-to-end

---

## 9. Monitoring & Observability

### 9.1 Metrics
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Key Metrics**: Request rate, error rate, latency, throughput

### 9.2 Logging
- **Centralized Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: DEBUG, INFO, WARN, ERROR

### 9.3 Tracing
- **Distributed Tracing**: Jaeger or Zipkin
- **Request Tracking**: Trace ID propagation across services

### 9.4 Alerting
- **Critical Alerts**: Service downtime, payment failures
- **Warning Alerts**: High error rates, slow response times
- **Info Alerts**: Deployment notifications, scaling events

---

## 10. Disaster Recovery & Backup

### 10.1 Backup Strategy
- **PostgreSQL**: Daily full backups, hourly incremental
- **Redis**: RDB snapshots + AOF for persistence
- **Kafka**: Topic replication across brokers

### 10.2 Recovery Plan
- **RTO** (Recovery Time Objective): < 1 hour
- **RPO** (Recovery Point Objective): < 5 minutes
- **Failover**: Automated for databases and Kafka

---

## Appendix

### A. Service Endpoints

#### Authentication Service
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/reset-password`

#### Product Service
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/categories`
- `GET /api/categories/:id/products`

#### Cart Service
- `GET /api/cart`
- `POST /api/cart/items`
- `PUT /api/cart/items/:id`
- `DELETE /api/cart/items/:id`

#### Order Service
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PUT /api/orders/:id/cancel`

#### Recommendation Service
- `GET /api/recommendations/products/:id`
- `GET /api/recommendations/user`
- `GET /api/recommendations/trending`

### B. Database Schemas

See separate schema documentation for detailed table structures.

### C. Kafka Event Schemas

See event-schemas.md for detailed event structures and formats.
