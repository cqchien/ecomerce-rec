-- Create users service schema (separate from auth schema)
CREATE SCHEMA IF NOT EXISTS users;

-- Set search path
SET search_path TO users;

-- Install uuid v7 function in users schema
CREATE OR REPLACE FUNCTION users.uuid_generate_v7()
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  unix_ts_ms BIGINT;
  uuid_bytes BYTEA;
BEGIN
  unix_ts_ms = (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
  uuid_bytes = decode(
    lpad(to_hex(unix_ts_ms), 12, '0') ||
    encode(public.gen_random_bytes(10), 'hex'),
    'hex'
  );
  RETURN encode(
    set_byte(
      set_byte(
        uuid_bytes,
        6,
        (get_byte(uuid_bytes, 6) & 15) | 112
      ),
      8,
      (get_byte(uuid_bytes, 8) & 63) | 128
    ),
    'hex'
  )::UUID;
END;
$$;

-- Create users table in users schema
CREATE TABLE IF NOT EXISTS users.users (
    id UUID DEFAULT users.uuid_generate_v7() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create addresses table in users schema
CREATE TABLE IF NOT EXISTS users.addresses (
    id UUID DEFAULT users.uuid_generate_v7() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create user_preferences table in users schema
CREATE TABLE IF NOT EXISTS users.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(10) DEFAULT 'USD',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create wishlist_items table in users schema
CREATE TABLE IF NOT EXISTS users.wishlist_items (
    id UUID DEFAULT users.uuid_generate_v7() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users.users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users.users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON users.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON users.addresses(is_default);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON users.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON users.wishlist_items(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_user_product ON users.wishlist_items(user_id, product_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION users.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users.users
    FOR EACH ROW
    EXECUTE FUNCTION users.update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at
    BEFORE UPDATE ON users.addresses
    FOR EACH ROW
    EXECUTE FUNCTION users.update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at
    BEFORE UPDATE ON users.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION users.update_updated_at_column();
