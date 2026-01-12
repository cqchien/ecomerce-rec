# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy proto directory
COPY proto/ /proto/

# Copy source code first
COPY services/inventory-service/ ./

# Tidy and download dependencies
RUN go mod tidy
RUN go mod download

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/inventory-service

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/main .

# Expose ports (HTTP and gRPC)
EXPOSE 4002 4004

# Run the application
CMD ["./main"]
