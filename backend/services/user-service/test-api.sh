#!/bin/bash

echo "=== Testing User Service API ==="
echo ""

# Test 1: Create a user
echo "Test 1: Creating a new user..."
RESPONSE=$(grpcurl -plaintext -d '{"email": "test@example.com", "first_name": "John", "last_name": "Doe"}' \
  localhost:5001 user.UserService/CreateUser 2>&1)

if echo "$RESPONSE" | grep -q "id"; then
  echo "✓ Create user successful"
  USER_ID=$(echo "$RESPONSE" | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  User ID: $USER_ID"
else
  echo "✗ Create user failed"
  echo "$RESPONSE"
  exit 1
fi

echo ""

# Test 2: Get user profile
echo "Test 2: Getting user profile..."
RESPONSE=$(grpcurl -plaintext -d "{\"user_id\": \"$USER_ID\"}" \
  localhost:5001 user.UserService/GetProfile 2>&1)

if echo "$RESPONSE" | grep -q "profile"; then
  echo "✓ Get profile successful"
  echo "  Profile: $(echo "$RESPONSE" | head -5)"
else
  echo "✗ Get profile failed"
  echo "$RESPONSE"
fi

echo ""

# Test 3: Update profile
echo "Test 3: Updating user profile..."
RESPONSE=$(grpcurl -plaintext -d "{\"user_id\": \"$USER_ID\", \"name\": \"John Smith\", \"phone\": \"+1234567890\"}" \
  localhost:5001 user.UserService/UpdateProfile 2>&1)

if echo "$RESPONSE" | grep -q "profile"; then
  echo "✓ Update profile successful"
else
  echo "✗ Update profile failed"
  echo "$RESPONSE"
fi

echo ""

# Test 4: Add address
echo "Test 4: Adding user address..."
RESPONSE=$(grpcurl -plaintext -d "{\"user_id\": \"$USER_ID\", \"first_name\": \"John\", \"last_name\": \"Doe\", \"phone\": \"+1234567890\", \"address_line1\": \"123 Main St\", \"city\": \"San Francisco\", \"state\": \"CA\", \"postal_code\": \"94105\", \"country\": \"US\", \"is_default\": true}" \
  localhost:5001 user.UserService/AddAddress 2>&1)

if echo "$RESPONSE" | grep -q "address"; then
  echo "✓ Add address successful"
  ADDRESS_ID=$(echo "$RESPONSE" | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  Address ID: $ADDRESS_ID"
else
  echo "✗ Add address failed"
  echo "$RESPONSE"
fi

echo ""

# Test 5: List addresses
echo "Test 5: Listing user addresses..."
RESPONSE=$(grpcurl -plaintext -d "{\"user_id\": \"$USER_ID\"}" \
  localhost:5001 user.UserService/ListAddresses 2>&1)

if echo "$RESPONSE" | grep -q "addresses"; then
  echo "✓ List addresses successful"
  ADDRESS_COUNT=$(echo "$RESPONSE" | grep -c '"id":')
  echo "  Address count: $ADDRESS_COUNT"
else
  echo "✗ List addresses failed"
  echo "$RESPONSE"
fi

echo ""

# Test 6: Add to wishlist
echo "Test 6: Adding product to wishlist..."
PRODUCT_ID="123e4567-e89b-12d3-a456-426614174000"  # Sample product ID
RESPONSE=$(grpcurl -plaintext -d "{\"user_id\": \"$USER_ID\", \"product_id\": \"$PRODUCT_ID\"}" \
  localhost:5001 user.UserService/AddToWishlist 2>&1)

if echo "$RESPONSE" | grep -q "item"; then
  echo "✓ Add to wishlist successful"
  WISHLIST_ID=$(echo "$RESPONSE" | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  Wishlist item ID: $WISHLIST_ID"
else
  echo "✗ Add to wishlist failed"
  echo "$RESPONSE"
fi

echo ""

# Test 7: Get wishlist
echo "Test 7: Getting user wishlist..."
RESPONSE=$(grpcurl -plaintext -d "{\"user_id\": \"$USER_ID\"}" \
  localhost:5001 user.UserService/GetWishlist 2>&1)

if echo "$RESPONSE" | grep -q "items"; then
  echo "✓ Get wishlist successful"
  ITEM_COUNT=$(echo "$RESPONSE" | grep -c '"product_id":')
  echo "  Wishlist items: $ITEM_COUNT"
else
  echo "✗ Get wishlist failed"
  echo "$RESPONSE"
fi

echo ""
echo "=== All tests completed ==="
