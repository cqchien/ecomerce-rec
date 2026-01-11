#!/bin/bash

# Create application user if it doesn't exist
# This user will be used by all services
APP_USER="${POSTGRES_USER:-vici_user}"

# Create databases for each service
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create application user if not exists
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$APP_USER') THEN
            CREATE USER $APP_USER WITH PASSWORD '${POSTGRES_PASSWORD}';
        END IF;
    END
    \$\$;

    -- Auth Service Database
    CREATE DATABASE auth_db;
    
    -- User Service Database
    CREATE DATABASE user_db;
    
    -- Product Service Database
    CREATE DATABASE product_db;
    
    -- Inventory Service Database
    CREATE DATABASE inventory_db;
    
    -- Cart Service Database
    CREATE DATABASE cart_db;
    
    -- Order Service Database
    CREATE DATABASE order_db;
    
    -- Payment Service Database
    CREATE DATABASE payment_db;
    
    -- Event Service Database
    CREATE DATABASE event_db;
    
    -- Notification Service Database
    CREATE DATABASE notification_db;
    
    -- Grant privileges to application user
    GRANT ALL PRIVILEGES ON DATABASE auth_db TO $APP_USER;
    GRANT ALL PRIVILEGES ON DATABASE user_db TO $APP_USER;
    GRANT ALL PRIVILEGES ON DATABASE product_db TO $APP_USER;
    GRANT ALL PRIVILEGES ON DATABASE inventory_db TO $APP_USER;
    GRANT ALL PRIVILEGES ON DATABASE cart_db TO $APP_USER;
    GRANT ALL PRIVILEGES ON DATABASE order_db TO $APP_USER;
    GRANT ALL PRIVILEGES ON DATABASE payment_db TO $APP_USER;
    GRANT ALL PRIVILEGES ON DATABASE event_db TO $APP_USER;
    GRANT ALL PRIVILEGES ON DATABASE notification_db TO $APP_USER;
EOSQL

echo "All databases created successfully!"
echo "User '$APP_USER' granted privileges on all databases."
