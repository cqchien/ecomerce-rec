# E-Commerce Backend Architecture Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend (React)                          │
│                         http://localhost:5173                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP/REST
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API Gateway (NestJS)                           │
│                         Port 3000                                   │
│  - Authentication Middleware                                        │
│  - Rate Limiting                                                    │
│  - Request/Response Transformation                                  │
│  - Load Balancing                                                   │
└─┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────────┘
  │      │      │      │      │      │      │      │      │
  │gRPC  │gRPC  │HTTP  │HTTP  │HTTP  │gRPC  │gRPC  │HTTP  │HTTP
  │      │      │      │      │      │      │      │      │
  ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌─────┐
│Auth│ │User│ │Cart│ │Ord │ │Pay │ │Prod│ │Inv │ │Rec │ │Event│
│3001│ │3002│ │3005│ │3006│ │3007│ │3003│ │3004│ │3008│ │3009 │
└─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └──┬──┘
  │      │      │      │      │      │      │      │      │
  └──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴────┐
                                                                  │
                         ┌────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Message Bus (Apache Kafka)                      │
│                         localhost:9092                              │
│                                                                     │
│  Topics:                                                            │
│    - user-events (user behavior tracking)                          │
│    - order-events (order lifecycle)                                │
│    - inventory-events (stock updates)                              │
│    - payment-events (payment status)                               │
│    - notification-events (email/sms triggers)                      │
└─────────────────────────────────────────────────────────────────────┘
                         │
                         │ Consumed by ML Pipeline
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    External ML Pipeline (Other Team)                │
│                    Processes events with Flink                      │
│                    Generates recommendations                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Writes to
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Data Stores                                 │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  PostgreSQL  │  │    Redis     │  │   MinIO/S3   │            │
│  │   :5432      │  │    :6379     │  │    :9000     │            │
│  │              │  │              │  │              │            │
│  │ 10 Databases │  │  - Sessions  │  │  - Product   │            │
│  │ (per service)│  │  - Cache     │  │    Images    │            │
│  │              │  │  - Cart      │  │  - User      │            │
│  │              │  │  - Recommend │  │    Avatars   │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

## Service Communication Patterns

### 1. Synchronous Communication (gRPC)

```
┌─────────────┐                    ┌──────────────┐
│   Order     │   GetProduct()     │   Product    │
│  Service    ├───────────────────►│   Service    │
│             │◄───────────────────┤              │
│             │   Product Details  │              │
└─────────────┘                    └──────────────┘

┌─────────────┐                    ┌──────────────┐
│   Order     │   ReserveStock()   │  Inventory   │
│  Service    ├───────────────────►│   Service    │
│             │◄───────────────────┤              │
│             │  Reservation ID    │              │
└─────────────┘                    └──────────────┘
```

### 2. Asynchronous Communication (Kafka)

```
┌─────────────┐                    ┌──────────────┐
│   Order     │   OrderCreated     │    Kafka     │
│  Service    ├───────────────────►│    Broker    │
│             │                    │              │
└─────────────┘                    └───────┬──────┘
                                          │
                    ┌─────────────────────┼─────────────────┐
                    │                     │                 │
                    ▼                     ▼                 ▼
              ┌──────────┐          ┌──────────┐     ┌──────────┐
              │ Payment  │          │Inventory │     │   Email  │
              │ Service  │          │ Service  │     │ Service  │
              └──────────┘          └──────────┘     └──────────┘
                Process              Commit Stock     Send Confirm
                Payment              Reservation      Email
```

## Data Flow: Complete Purchase Journey

```
1. User adds item to cart
   └─► Cart Service stores in Redis
   └─► Event Service publishes to Kafka (ADD_TO_CART event)

2. User proceeds to checkout
   └─► Order Service creates order
   └─► Inventory Service reserves stock (gRPC call)
   └─► Payment Service processes payment
   └─► Publishes ORDER_CREATED event to Kafka

3. Payment confirmed
   └─► Payment Service publishes PAYMENT_COMPLETED
   └─► Order Service updates order status
   └─► Inventory Service commits reservation
   └─► Cart Service clears cart
   └─► Notification Service sends email
   └─► Event Service tracks PURCHASE event

4. ML Pipeline processes events
   └─► Analyzes user behavior from Kafka
   └─► Updates recommendations in Redis
   └─► Recommendation Service serves updated recs
```

## Clean Architecture Pattern (Go Services)

```
┌─────────────────────────────────────────────────────────────┐
│                        HTTP/gRPC Layer                      │
│                      (Delivery Layer)                       │
│   - Handlers (HTTP/gRPC)                                    │
│   - Request/Response DTOs                                   │
│   - Input Validation                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Use Case Layer                         │
│                    (Business Logic)                         │
│   - Application-specific business rules                    │
│   - Orchestrates domain objects                            │
│   - Calls repositories                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                           │
│                   (Enterprise Logic)                        │
│   - Entities (Product, Category, etc.)                     │
│   - Value Objects                                          │
│   - Domain Services                                        │
│   - Repository Interfaces                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                      │
│                (External Dependencies)                      │
│   - PostgreSQL Implementation                              │
│   - Redis Implementation                                   │
│   - Kafka Producers/Consumers                              │
│   - S3 Client                                              │
└─────────────────────────────────────────────────────────────┘
```

## NestJS Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Controllers                            │
│   - HTTP Routes (@Controller)                              │
│   - Request Validation (@Body, @Param)                     │
│   - Guards & Interceptors                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                       Services                              │
│   - Business Logic (@Injectable)                           │
│   - Use Cases Implementation                               │
│   - External Service Calls                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     Repositories                            │
│   - TypeORM Repositories                                   │
│   - Database Operations                                    │
│   - Query Building                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Entities                               │
│   - TypeORM Entities                                       │
│   - Database Schema Mapping                                │
└─────────────────────────────────────────────────────────────┘
```

## Event Tracking Flow for ML

```
User Actions in Frontend
    │
    ▼
API Gateway
    │
    ▼
Event Service (Golang)
    │
    ├─► Validates event
    ├─► Enriches with metadata
    ├─► Publishes to Kafka
    │
    ▼
Kafka Topics
    ├─► user-events (all events)
    ├─► product-views (specific)
    ├─► cart-events (specific)
    └─► search-events (specific)
    │
    ▼
ML Pipeline (Apache Flink)
    ├─► Real-time processing
    ├─► Collaborative filtering
    ├─► Content-based filtering
    ├─► Computes recommendations
    │
    ▼
Redis (Recommendation Data)
    ├─► rec:user:{id}:personalized
    ├─► rec:trending
    ├─► rec:product:{id}:similar
    └─► rec:popular
    │
    ▼
Recommendation Service (Golang)
    ├─► Reads from Redis
    ├─► Applies fallback logic
    ├─► Formats for frontend
    │
    ▼
API Gateway → Frontend
```

## Database Schema Per Service

```
┌────────────────────────────────────────────────────────────┐
│                    auth_db                                 │
│  - users                                                   │
│  - refresh_tokens                                          │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    user_db                                 │
│  - user_profiles                                           │
│  - addresses                                               │
│  - user_preferences                                        │
│  - wishlist                                                │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                   product_db                               │
│  - products                                                │
│  - categories                                              │
│  - product_images                                          │
│  - product_variants                                        │
│  - product_tags                                            │
│  - product_specifications                                  │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                  inventory_db                              │
│  - stock                                                   │
│  - reservations                                            │
│  - stock_movements                                         │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    cart_db                                 │
│  - carts                                                   │
│  - cart_items                                              │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    order_db                                │
│  - orders                                                  │
│  - order_items                                             │
│  - order_status_history                                    │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                   payment_db                               │
│  - transactions                                            │
│  - payment_methods                                         │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    event_db                                │
│  - user_events                                             │
│  - event_metadata                                          │
└────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                          │
│                         (Nginx)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
┌──────────────────────┐  ┌──────────────────────┐
│   API Gateway Pod    │  │   API Gateway Pod    │
│     (Replica 1)      │  │     (Replica 2)      │
└──────────────────────┘  └──────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Service Mesh                             │
│     (Internal Service Communication - gRPC)                 │
└─────────────────────────────────────────────────────────────┘

┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│  Product  │ │ Inventory │ │   Order   │ │   Cart    │
│  Service  │ │  Service  │ │  Service  │ │  Service  │
│  (3 pods) │ │  (3 pods) │ │  (2 pods) │ │  (2 pods) │
└───────────┘ └───────────┘ └───────────┘ └───────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Stateful Services                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ PostgreSQL │  │   Redis    │  │   Kafka    │           │
│  │  Cluster   │  │  Cluster   │  │  Cluster   │           │
│  │  (3 nodes) │  │ (3 nodes)  │  │ (3 nodes)  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTPS/TLS Layer                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Rate Limiting                                    │  │
│  │  2. JWT Validation                                   │  │
│  │  3. CORS Policy                                      │  │
│  │  4. Request Sanitization                            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Input Validation (DTO)                          │  │
│  │  2. Authorization Checks                            │  │
│  │  3. Business Logic Validation                       │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Parameterized Queries (SQL Injection Protection)│  │
│  │  2. Encrypted Connections                           │  │
│  │  3. Password Hashing (bcrypt)                       │  │
│  │  4. Sensitive Data Encryption                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```
