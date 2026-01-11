#!/bin/sh
set -e

echo "Waiting for Redis to be ready..."
until redis-cli -h redis -a ${REDIS_PASSWORD} ping > /dev/null 2>&1; do
  sleep 1
done

echo "Redis is ready. Loading recommendation data..."

# Function to suppress password warning
rcli() {
  REDISCLI_AUTH=${REDIS_PASSWORD} redis-cli -h redis "$@"
}

# Load trending products
rcli DEL trending > /dev/null
rcli ZADD trending 1000 "1" 950 "2" 900 "3" 850 "5" 800 "7" 750 "10" 700 "12" 650 "15" > /dev/null

# Load popular products
rcli DEL popular > /dev/null
rcli ZADD popular 5000 "1" 4800 "2" 4500 "3" 4200 "5" 4000 "7" 3800 "10" 3600 "12" > /dev/null

# Load new arrivals
rcli DEL new_arrivals > /dev/null
rcli ZADD new_arrivals 1704902400 "20" 1704816000 "19" 1704729600 "18" 1704643200 "17" > /dev/null

# Load user recommendations for user:1
rcli DEL user:1:recommendations > /dev/null
rcli ZADD user:1:recommendations 0.95 "5" 0.89 "7" 0.85 "10" 0.82 "12" 0.78 "15" > /dev/null

# Load user recommendations for user:2
rcli DEL user:2:recommendations > /dev/null
rcli ZADD user:2:recommendations 0.92 "3" 0.88 "6" 0.84 "9" 0.80 "11" > /dev/null

# Load similar products for product:1
rcli DEL product:1:similar > /dev/null
rcli ZADD product:1:similar 0.92 "2" 0.88 "3" 0.85 "5" 0.80 "7" > /dev/null

# Load similar products for product:2
rcli DEL product:2:similar > /dev/null
rcli ZADD product:2:similar 0.92 "1" 0.90 "3" 0.87 "5" 0.83 "6" > /dev/null

# Load category:electronics
rcli DEL category:electronics:top > /dev/null
rcli ZADD category:electronics:top 1000 "1" 950 "2" 900 "5" > /dev/null

# Load category:fashion
rcli DEL category:fashion:top > /dev/null
rcli ZADD category:fashion:top 980 "3" 920 "7" 880 "10" > /dev/null

echo "✓ Recommendation data loaded successfully!"
echo ""
echo "Loaded keys:"
rcli KEYS "*" | sort
