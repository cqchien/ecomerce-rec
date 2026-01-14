# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY services/auth-service/package*.json ./

# Install dependencies
RUN npm ci

# Copy proto files
COPY proto ./proto

# Copy source code and config files
COPY services/auth-service/tsconfig*.json ./
COPY services/auth-service/src ./src

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY services/auth-service/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy proto files
COPY --from=builder /app/proto ./proto

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose gRPC port
EXPOSE 50051

# Run the application
CMD ["node", "dist/main"]
