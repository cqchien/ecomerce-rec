#!/bin/bash

# VICI E-commerce Deployment Script
# This script manages the deployment of infrastructure and application services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_info "Docker is running"
}

# Function to start infrastructure
start_infrastructure() {
    print_info "Starting infrastructure services..."
    docker-compose up -d --remove-orphans --force-recreate
    print_info "Waiting for infrastructure to be healthy..."
    sleep 10
    docker-compose ps
}

# Function to start application services
start_services() {
    print_info "Building and starting application services..."
    docker-compose -f services.docker-compose.yml up -d --build --remove-orphans --force-recreate
}

# Function to stop all services
stop_all() {
    print_info "Stopping all services..."
    docker-compose -f docker-compose.yml -f services.docker-compose.yml down
}

# Function to restart services
restart_services() {
    print_info "Restarting application services..."
    docker-compose -f services.docker-compose.yml restart
}

# Function to show logs
show_logs() {
    if [ -z "$1" ]; then
        print_info "Showing logs for all services..."
        docker-compose -f docker-compose.yml -f services.docker-compose.yml logs -f
    else
        print_info "Showing logs for $1..."
        docker-compose -f docker-compose.yml -f services.docker-compose.yml logs -f "$1"
    fi
}

# Function to show status
show_status() {
    print_info "All services:"
    docker-compose -f docker-compose.yml -f services.docker-compose.yml ps
}

# Function to rebuild a specific service
rebuild_service() {
    if [ -z "$1" ]; then
        print_error "Please specify a service name"
        exit 1
    fi
    print_info "Rebuilding $1..."
    docker-compose -f services.docker-compose.yml up -d --build "$1" --remove-orphans --force-recreate
}

# Function to clean everything
clean_all() {
    print_warn "This will remove all containers and volumes. All data will be lost!"
    read -p "Are you sure? (yes/no): " -r
    echo
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Cleaning up..."
        docker-compose -f docker-compose.yml -f services.docker-compose.yml down -v
        print_info "Cleanup complete"
    else
        print_info "Cleanup cancelled"
    fi
}

# Function to show help
show_help() {
    cat << EOF
VICI E-commerce Deployment Manager

Usage: ./deploy.sh [command] [options]

Commands:
    start               Start all services (infrastructure + applications)
    start-infra         Start only infrastructure services
    start-apps          Start only application services
    stop                Stop all services
    restart             Restart application services
    status              Show status of all services
    logs [service]      Show logs (optionally for specific service)
    rebuild <service>   Rebuild and restart a specific service
    clean               Remove all containers and volumes
    help                Show this help message

Examples:
    ./deploy.sh start                    # Start everything
    ./deploy.sh logs api-gateway         # Show API Gateway logs
    ./deploy.sh rebuild user-service     # Rebuild user service
    ./deploy.sh status                   # Show all service statuses

EOF
}

# Main script logic
check_docker

case "$1" in
    start)
        start_infrastructure
        start_services
        print_info "All services started successfully!"
        print_info "API Gateway available at: http://localhost:3000"
        print_info "Redis Insight available at: http://localhost:5540"
        print_info "Kafka UI available at: http://localhost:8080"
        print_info "MinIO Console available at: http://localhost:9001"
        ;;
    start-infra)
        start_infrastructure
        ;;
    start-services)
        start_services
        ;;
    stop)
        stop_all
        print_info "All services stopped"
        ;;
    restart)
        restart_services
        print_info "Services restarted"
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$2"
        ;;
    rebuild)
        rebuild_service "$2"
        ;;
    clean)
        clean_all
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
