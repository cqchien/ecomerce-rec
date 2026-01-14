# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY services/api-gateway/package*.json ./

# Install dependencies
RUN npm ci

# Copy proto files first
COPY proto ./proto

# Copy source code and config files
COPY services/api-gateway/tsconfig*.json ./
COPY services/api-gateway/nest-cli.json ./
COPY services/api-gateway/src ./src

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY services/api-gateway/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy proto files
COPY proto ./proto

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Run the application
CMD ["node", "dist/main"]
