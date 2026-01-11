# Recommendation Service

ML-powered product recommendation service using collaborative filtering and content-based algorithms for personalized user experiences.

## Features

- **User-Based Collaborative Filtering**: Recommendations based on similar users' behavior
- **Item-Based Collaborative Filtering**: Recommendations based on product similarities
- **Hybrid Approach**: Combines multiple algorithms for better accuracy
- **Trending Products**: Real-time trending calculation with decay factor
- **Product Similarity**: Cosine similarity calculation between products
- **Interaction Tracking**: Track views, cart additions, purchases, wishlists
- **Redis Caching**: Fast recommendation retrieval with TTL-based invalidation
- **Background Jobs**: Periodic similarity and trending score calculations
- **gRPC API**: High-performance service communication

## Tech Stack

- **Language**: Go 1.21
- **Framework**: gRPC
- **ORM**: GORM v1.25.5
- **Database**: PostgreSQL
- **Cache**: Redis (go-redis/redis/v8)
- **Protocol Buffers**: protobuf v1.32.0

## Installation

```bash
# Install dependencies
go mod download

# Copy environment file
cp .env.example .env

# Update environment variables
# Edit .env with your database and Redis configuration
```

## Environment Variables

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=recommendation_db
DB_SSLMODE=disable

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# gRPC Configuration
GRPC_PORT=50053

# Application Configuration
ENV=development
LOG_LEVEL=info

# Recommendation Configuration
MIN_INTERACTIONS_FOR_RECOMMENDATION=3
TRENDING_WINDOW_DAYS=7
SIMILARITY_THRESHOLD=0.3
MAX_RECOMMENDATIONS=20
```

## Database Setup

```bash
# Create database
createdb recommendation_db

# Run the service (auto-migration enabled)
go run main.go
```

## Development

```bash
# Run service
go run main.go

# Build service
go build -o recommendation-service

# Run built binary
./recommendation-service
```

## Generate Proto Files

```bash
# Install protoc plugins (one-time)
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Generate proto files
chmod +x generate_proto.sh
./generate_proto.sh
```

## Architecture

### Clean Architecture Layers

```
recommendation-service/
├── models/          # Domain entities and constants (80+ constants)
├── repository/      # Data access layer (GORM)
├── usecase/         # Business logic (recommendation algorithms)
├── delivery/        # gRPC handlers
├── database/        # Database initialization
├── cache/           # Redis operations
└── proto/           # Protocol buffer definitions
```

### Data Models

**UserInteraction**
- Tracks user interactions with products
- Types: view, add_to_cart, purchase, wishlist, remove_cart, search
- Weighted scoring: purchase (5.0), add_to_cart (3.0), wishlist (2.0), view (1.0)

**ProductSimilarity**
- Stores pre-calculated product similarities
- Cosine similarity method
- Requires minimum 2 common users
- Threshold: 0.3 minimum similarity score

**TrendingProduct**
- Trending scores with interaction counts
- Decay factor: 0.9 (recent interactions weighted higher)
- Updated every hour
- Minimum 5 interactions required

**UserRecommendation**
- Cached personalized recommendations
- Algorithm tracking (collaborative_filtering, content_based, hybrid)
- Ranked by score
- TTL: 1 hour

### Constants (80+)

**Interaction Types & Weights**
```go
InteractionTypeView       = "view"          // Weight: 1.0
InteractionTypeAddToCart  = "add_to_cart"   // Weight: 3.0
InteractionTypePurchase   = "purchase"      // Weight: 5.0
InteractionTypeWishlist   = "wishlist"      // Weight: 2.0
```

**Recommendation Algorithms**
```go
AlgorithmCollaborativeFiltering = "collaborative_filtering"
AlgorithmContentBased          = "content_based"
AlgorithmHybrid                = "hybrid"
AlgorithmTrending              = "trending"
AlgorithmPersonalized          = "personalized"
```

**Cache Keys & TTL**
```go
CacheKeyUserRecommendations    // TTL: 3600s (1 hour)
CacheKeyProductRecommendations // TTL: 3600s (1 hour)
CacheKeyTrendingProducts       // TTL: 1800s (30 minutes)
CacheKeyProductSimilarity      // TTL: 86400s (24 hours)
```

**Trending Configuration**
```go
TrendingWindowDays     = 7    // Consider last 7 days
TrendingDecayFactor    = 0.9  // Exponential decay
TrendingWeightViews    = 1.0
TrendingWeightCarts    = 2.0
TrendingWeightPurchases = 5.0
TrendingMinInteractions = 5
```

**Similarity Configuration**
```go
SimilarityThreshold        = 0.3   // Minimum similarity score
SimilarityMinCommonUsers   = 2     // Minimum common users
SimilarityBatchSize        = 100   // Batch update size
SimilarityUpdateIntervalHrs = 6    // Update every 6 hours
```

## gRPC API

### RecordInteraction

Record user interaction with a product.

```protobuf
message RecordInteractionRequest {
  string user_id = 1;
  string product_id = 2;
  string interaction_type = 3; // view, add_to_cart, purchase, wishlist
  map<string, string> metadata = 4;
}
```

**Example**:
```go
client.RecordInteraction(ctx, &pb.RecordInteractionRequest{
    UserId: "user-123",
    ProductId: "prod-456",
    InteractionType: "purchase",
    Metadata: map[string]string{
        "price": "99.99",
        "quantity": "2",
    },
})
```

### GetUserRecommendations

Get personalized recommendations for a user.

```protobuf
message GetUserRecommendationsRequest {
  string user_id = 1;
  int32 limit = 2;
  string algorithm = 3; // collaborative_filtering, content_based, hybrid
}
```

**Example**:
```go
resp, _ := client.GetUserRecommendations(ctx, &pb.GetUserRecommendationsRequest{
    UserId: "user-123",
    Limit: 10,
    Algorithm: "hybrid",
})
// resp.ProductIds: ["prod-1", "prod-2", ...]
```

### GetProductRecommendations

Get products similar to a given product.

```protobuf
message GetProductRecommendationsRequest {
  string product_id = 1;
  int32 limit = 2;
}
```

**Example**:
```go
resp, _ := client.GetProductRecommendations(ctx, &pb.GetProductRecommendationsRequest{
    ProductId: "prod-123",
    Limit: 5,
})
// resp.ProductIds: ["prod-456", "prod-789", ...]
```

### GetTrendingProducts

Get trending products.

```protobuf
message GetTrendingProductsRequest {
  int32 limit = 1;
}
```

**Example**:
```go
resp, _ := client.GetTrendingProducts(ctx, &pb.GetTrendingProductsRequest{
    Limit: 10,
})
// resp.ProductIds: ["prod-1", "prod-2", ...]
```

### CalculateSimilarities (Admin)

Trigger product similarity calculation.

```protobuf
message CalculateSimilaritiesRequest {}
```

**Example**:
```go
client.CalculateSimilarities(ctx, &pb.CalculateSimilaritiesRequest{})
// Background job started
```

### CalculateTrendingScores (Admin)

Trigger trending score calculation.

```protobuf
message CalculateTrendingScoresRequest {}
```

**Example**:
```go
client.CalculateTrendingScores(ctx, &pb.CalculateTrendingScoresRequest{})
// Background job started
```

## Recommendation Algorithms

### 1. Collaborative Filtering (User-Based)

Finds users with similar interaction patterns and recommends products they liked.

**Algorithm**:
1. Get user's interacted products
2. Find users who interacted with same products
3. Calculate similarity score (common products / total products)
4. Get products from similar users
5. Rank by weighted similarity

**Best for**: Users with sufficient interaction history (3+ interactions)

### 2. Content-Based (Item-Based)

Recommends products similar to ones the user has interacted with.

**Algorithm**:
1. Get user's recent interactions
2. For each product, find similar products (cosine similarity)
3. Weight by interaction strength and similarity score
4. Aggregate and rank products

**Best for**: "Customers who bought this also bought" scenarios

### 3. Hybrid Approach (Default)

Combines collaborative filtering and content-based recommendations.

**Algorithm**:
1. Get recommendations from both algorithms
2. Interleave results (alternate between sources)
3. Deduplicate products
4. Return top N results

**Best for**: Most accurate recommendations, balanced diversity

### 4. Trending

Returns globally trending products based on recent activity.

**Algorithm**:
1. Aggregate interactions from last 7 days
2. Calculate score: views×1 + carts×2 + purchases×5 + wishlists×1.5
3. Apply recency decay: score × 0.9^days_old
4. Filter minimum 5 interactions
5. Rank by trending score

**Best for**: New users without interaction history, homepage displays

## Similarity Calculation

### Cosine Similarity

Calculates similarity between two products based on user interaction vectors.

**Formula**:
```
similarity = (A · B) / (||A|| × ||B||)

Where:
A = user interaction weights for product 1
B = user interaction weights for product 2
```

**Steps**:
1. Get all users who interacted with each product
2. Create weighted vectors (sum of interaction weights per user)
3. Calculate dot product
4. Calculate magnitudes
5. Compute cosine similarity (0-1 range)

**Requirements**:
- Minimum 2 common users
- Minimum 0.3 similarity score
- Updated every 6 hours

## Background Jobs

### Similarity Calculation Job

Runs every 6 hours.

**Process**:
1. Get all products with recent interactions (14 days)
2. Calculate pairwise similarities
3. Batch update database (100 pairs at a time)
4. Invalidate similarity caches

**Performance**: Processes ~1000 products in <5 minutes

### Trending Score Calculation Job

Runs every hour.

**Process**:
1. Get interactions from last 7 days
2. Aggregate by product
3. Calculate trending scores with decay
4. Filter minimum interactions (5)
5. Batch update database
6. Invalidate trending cache

**Performance**: Processes ~10,000 interactions in <2 minutes

## Caching Strategy

### Cache Keys

```go
recommendation:user:{userID}              // User recommendations
recommendation:product:{productID}        // Product recommendations
recommendation:trending                   // Trending products
interaction:user:{userID}                 // User interactions
interaction:product:{productID}           // Product interactions
similarity:product:{id1}:{id2}            // Product similarity
```

### Cache Invalidation

**User Recommendations**: Invalidated on new interaction
**Product Recommendations**: Invalidated on similarity update
**Trending Products**: Invalidated on trending score update
**Interactions**: Invalidated on new interaction
**Similarities**: Invalidated on similarity calculation

### TTL Configuration

- User/Product Recommendations: 1 hour
- Trending Products: 30 minutes
- Interactions: 2 hours
- Similarities: 24 hours

## Testing

```bash
# Run tests
go test ./...

# Run with coverage
go test -cover ./...

# Run specific test
go test -v ./usecase -run TestRecommendationUseCase
```

## Integration with Other Services

### From Order Service
```go
// Record purchase interaction
RecordInteraction(userID, productID, "purchase", metadata)
```

### From Cart Service
```go
// Record add to cart
RecordInteraction(userID, productID, "add_to_cart", nil)
```

### From Product Service
```go
// Record product view
RecordInteraction(userID, productID, "view", nil)
```

### To Frontend
```go
// Get personalized recommendations
recommendations := GetUserRecommendations(userID, 10, "hybrid")

// Get similar products
similar := GetProductRecommendations(productID, 5)

// Get trending products
trending := GetTrendingProducts(20)
```

## Performance Optimization

### Database Indexes

```sql
CREATE INDEX idx_user_product ON user_interactions(user_id, product_id);
CREATE INDEX idx_product ON user_interactions(product_id);
CREATE INDEX idx_interaction_type ON user_interactions(interaction_type);
CREATE INDEX idx_product_similarity ON product_similarities(product_id_1, product_id_2);
CREATE INDEX idx_trending_score ON trending_products(trending_score DESC);
```

### Query Optimization

- Batch operations for bulk inserts/updates
- Use GORM preloading for related data
- Limit result sets with pagination
- Use Redis for hot data

### Caching Best Practices

- Cache frequently accessed recommendations
- Invalidate on data changes
- Use appropriate TTLs (1-24 hours)
- Compress large cached objects

## Monitoring

### Metrics to Track

- Recommendation response time
- Cache hit ratio
- Similarity calculation duration
- Trending score calculation duration
- Interaction recording rate
- Database query performance

### Logging

```go
log.Printf("RecordInteraction: user=%s, product=%s, type=%s", userID, productID, type)
log.Printf("Similarity calculation: %d pairs processed", count)
log.Printf("Trending calculation: %d products updated", count)
```

## Troubleshooting

### No Recommendations for User

**Cause**: User has < 3 interactions
**Solution**: Return trending products instead

### Low Similarity Scores

**Cause**: Not enough common users
**Solution**: Lower threshold or increase interaction data

### Slow Recommendation Queries

**Cause**: Cache miss, complex calculations
**Solution**: Warm up cache, optimize algorithms, add indexes

### Background Jobs Not Running

**Cause**: Job scheduler not started
**Solution**: Check main.go initialization, verify logs

## Future Enhancements

- Deep learning models (neural collaborative filtering)
- Real-time recommendations with streaming data
- A/B testing framework for algorithms
- Multi-armed bandit for exploration/exploitation
- Category-based recommendations
- Seasonal trending detection
- User segmentation for personalized algorithms

## License

MIT

## Support

For issues and questions, please contact the development team.
