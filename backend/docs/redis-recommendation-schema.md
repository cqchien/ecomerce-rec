# Redis Schema for Recommendation System

## Overview
This document defines the Redis data structures used by the Recommendation Service to serve real-time product recommendations. The actual ML pipeline (handled by another team) will populate this data.

## Key Naming Conventions

```
rec:user:{user_id}:personalized           # User's personalized recommendations
rec:user:{user_id}:session                # Session-based recommendations
rec:product:{product_id}:similar          # Similar products
rec:product:{product_id}:frequently_bought # Frequently bought together
rec:trending                               # Trending products (global)
rec:trending:category:{category_id}        # Trending in category
rec:new_arrivals                           # New products
rec:popular                                # Popular products (global)
rec:session:{session_id}:viewed            # Recently viewed in session
```

## Data Structures

### 1. Personalized Recommendations
**Key**: `rec:user:{user_id}:personalized`
**Type**: Sorted Set (ZSET)
**Score**: Recommendation score (0-1)
**TTL**: 30 minutes

```redis
ZADD rec:user:123:personalized 0.95 "prod_1" 0.89 "prod_2" 0.85 "prod_3"
ZREVRANGE rec:user:123:personalized 0 9 WITHSCORES
```

**Structure**:
```json
{
  "member": "product_id",
  "score": 0.0-1.0  // Recommendation confidence
}
```

### 2. Session-Based Recommendations
**Key**: `rec:user:{user_id}:session` or `rec:session:{session_id}`
**Type**: Sorted Set (ZSET)
**Score**: Timestamp (for recency) or relevance score
**TTL**: 1 hour

```redis
ZADD rec:session:sess_abc123 1704902400 "prod_5" 1704902450 "prod_7"
```

### 3. Similar Products
**Key**: `rec:product:{product_id}:similar`
**Type**: Sorted Set (ZSET)
**Score**: Similarity score (0-1)
**TTL**: 24 hours

```redis
ZADD rec:product:prod_1:similar 0.92 "prod_10" 0.88 "prod_11" 0.85 "prod_12"
```

### 4. Frequently Bought Together
**Key**: `rec:product:{product_id}:frequently_bought`
**Type**: Sorted Set (ZSET)
**Score**: Co-occurrence frequency
**TTL**: 24 hours

```redis
ZADD rec:product:prod_1:frequently_bought 150 "prod_20" 120 "prod_21" 95 "prod_22"
```

### 5. Trending Products
**Key**: `rec:trending`
**Type**: Sorted Set (ZSET)
**Score**: Trending score (based on recent views/purchases)
**TTL**: 15 minutes

```redis
ZADD rec:trending 1000 "prod_5" 950 "prod_8" 900 "prod_12"
```

### 6. Trending by Category
**Key**: `rec:trending:category:{category_id}`
**Type**: Sorted Set (ZSET)
**Score**: Trending score within category
**TTL**: 15 minutes

```redis
ZADD rec:trending:category:electronics 500 "prod_30" 450 "prod_31"
```

### 7. Popular Products
**Key**: `rec:popular`
**Type**: Sorted Set (ZSET)
**Score**: All-time popularity score
**TTL**: 1 hour

```redis
ZADD rec:popular 5000 "prod_100" 4800 "prod_101" 4500 "prod_102"
```

### 8. New Arrivals
**Key**: `rec:new_arrivals`
**Type**: Sorted Set (ZSET)
**Score**: Timestamp (creation date)
**TTL**: 1 hour

```redis
ZADD rec:new_arrivals 1704902400 "prod_200" 1704815999 "prod_199"
```

### 9. Recently Viewed (Session)
**Key**: `rec:session:{session_id}:viewed`
**Type**: List
**TTL**: 24 hours

```redis
LPUSH rec:session:sess_abc123:viewed "prod_1" "prod_5" "prod_7"
LTRIM rec:session:sess_abc123:viewed 0 19  # Keep last 20
```

### 10. User View History (for logged-in users)
**Key**: `rec:user:{user_id}:history`
**Type**: Sorted Set (ZSET)
**Score**: Timestamp
**TTL**: 7 days

```redis
ZADD rec:user:123:history 1704902400 "prod_1" 1704902450 "prod_5"
ZREMRANGEBYRANK rec:user:123:history 0 -51  # Keep last 50
```

## Product Metadata Cache

### Product Details (for quick lookup)
**Key**: `product:{product_id}`
**Type**: Hash
**TTL**: 1 hour

```redis
HSET product:prod_1 
  "id" "prod_1"
  "name" "Product Name"
  "price" "2999"
  "image" "https://cdn.example.com/prod_1.jpg"
  "category_id" "cat_1"
  "rating" "4.5"
  "stock" "150"
```

## Category Mapping
**Key**: `category:{category_id}`
**Type**: Hash
**TTL**: 24 hours

```redis
HSET category:cat_1 
  "id" "cat_1"
  "name" "Electronics"
  "slug" "electronics"
```

## Example Queries

### Get personalized recommendations for user
```redis
# Get top 10 personalized recommendations
ZREVRANGE rec:user:123:personalized 0 9 WITHSCORES

# Get product details for recommendations
HMGET product:prod_1 id name price image rating
```

### Get similar products
```redis
# Get top 5 similar products
ZREVRANGE rec:product:prod_1:similar 0 4 WITHSCORES
```

### Get trending products
```redis
# Get top 20 trending
ZREVRANGE rec:trending 0 19 WITHSCORES

# Get trending in category
ZREVRANGE rec:trending:category:electronics 0 9 WITHSCORES
```

### Track user view (for session)
```redis
# Add to recently viewed
LPUSH rec:session:sess_abc123:viewed prod_5
LTRIM rec:session:sess_abc123:viewed 0 19
EXPIRE rec:session:sess_abc123:viewed 86400

# For logged-in users
ZADD rec:user:123:history 1704902400 prod_5
```

## Data Population (For ML Team)

The ML/streaming team should populate these keys using:
- Kafka consumers listening to `user-events` topic
- Batch jobs for collaborative filtering
- Real-time updates for trending/popular items

## Fallback Strategy

When recommendation data is not available:

1. **User has no personalized recs** → Use trending or popular
2. **Product has no similar items** → Use category trending
3. **New user** → Use popular + new arrivals
4. **Cold start** → Use category-based recommendations

## Monitoring Keys

Track recommendation system health:

```redis
# Count of users with recommendations
SCARD rec:users_with_recs

# Last update timestamp
GET rec:last_update

# Stats
HGETALL rec:stats
# Fields: total_users, total_products, last_processing_time
```
