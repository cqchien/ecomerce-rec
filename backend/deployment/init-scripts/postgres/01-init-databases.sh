#!/bin/bash

# ================================================
# SIMPLIFIED APPROACH: Single Database with Schemas
# ================================================
# Instead of multiple databases, we use one database
# with separate schemas for logical separation.
#
# Benefits:
# - Simpler configuration
# - Easier cross-service queries (if needed)
# - Single connection pool
# - Easier backups
# - Lower resource usage
#
# Trade-offs:
# - Less isolation between services
# - Shared database resources
# ================================================

APP_USER="${POSTGRES_USER:-vici_user}"

# Create single database with schemas
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create application user if not exists
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$APP_USER') THEN
            CREATE USER $APP_USER WITH PASSWORD '${POSTGRES_PASSWORD}';
        END IF;
    END
    \$\$;

    -- Create single ecommerce database
    CREATE DATABASE ecommerce_db;
    
    -- Grant privileges to application user
    GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO $APP_USER;
EOSQL

# Connect to ecommerce_db and create schemas
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "ecommerce_db" <<-EOSQL
    -- Create schemas for each service
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE SCHEMA IF NOT EXISTS users;
    CREATE SCHEMA IF NOT EXISTS products;
    CREATE SCHEMA IF NOT EXISTS inventory;
    CREATE SCHEMA IF NOT EXISTS carts;
    CREATE SCHEMA IF NOT EXISTS orders;
    CREATE SCHEMA IF NOT EXISTS payments;
    CREATE SCHEMA IF NOT EXISTS events;
    CREATE SCHEMA IF NOT EXISTS notifications;
    CREATE SCHEMA IF NOT EXISTS recommendations;
    
    -- Grant usage on all schemas to application user
    GRANT USAGE ON SCHEMA auth TO $APP_USER;
    GRANT USAGE ON SCHEMA users TO $APP_USER;
    GRANT USAGE ON SCHEMA products TO $APP_USER;
    GRANT USAGE ON SCHEMA inventory TO $APP_USER;
    GRANT USAGE ON SCHEMA carts TO $APP_USER;
    GRANT USAGE ON SCHEMA orders TO $APP_USER;
    GRANT USAGE ON SCHEMA payments TO $APP_USER;
    GRANT USAGE ON SCHEMA events TO $APP_USER;
    GRANT USAGE ON SCHEMA notifications TO $APP_USER;
    GRANT USAGE ON SCHEMA recommendations TO $APP_USER;
    
    -- Grant all privileges on all tables in schemas to application user
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA users TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA products TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA inventory TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA carts TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA orders TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA payments TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA events TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA notifications TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA recommendations TO $APP_USER;
    
    -- Grant all privileges on all sequences (for auto-increment)
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA users TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA products TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA inventory TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA carts TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA orders TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA payments TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA events TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA notifications TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA recommendations TO $APP_USER;
    
    -- Set default privileges for future tables
    ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA users GRANT ALL ON TABLES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA products GRANT ALL ON TABLES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA inventory GRANT ALL ON TABLES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA carts GRANT ALL ON TABLES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA orders GRANT ALL ON TABLES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA payments GRANT ALL ON TABLES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA events GRANT ALL ON TABLES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA notifications GRANT ALL ON TABLES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA recommendations GRANT ALL ON TABLES TO $APP_USER;
    
    ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON SEQUENCES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA users GRANT ALL ON SEQUENCES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA products GRANT ALL ON SEQUENCES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA inventory GRANT ALL ON SEQUENCES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA carts GRANT ALL ON SEQUENCES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA orders GRANT ALL ON SEQUENCES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA payments GRANT ALL ON SEQUENCES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA events GRANT ALL ON SEQUENCES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA notifications GRANT ALL ON SEQUENCES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA recommendations GRANT ALL ON SEQUENCES TO $APP_USER;
EOSQL

echo "✅ Database 'ecommerce_db' created successfully!"
echo "✅ All schemas created: auth, users, products, inventory, carts, orders, payments, events, notifications, recommendations"
echo "✅ User '$APP_USER' granted privileges on all schemas."
