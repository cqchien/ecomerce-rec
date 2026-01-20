-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Set search path
SET search_path TO auth;

-- Install uuid v7 function in auth schema
CREATE OR REPLACE FUNCTION auth.uuid_generate_v7()
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

-- Create users table in auth schema
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID DEFAULT auth.uuid_generate_v7() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar VARCHAR(500),
    role VARCHAR(50) DEFAULT 'customer' NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create refresh_tokens table in auth schema
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    id UUID DEFAULT auth.uuid_generate_v7() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    replaced_by_token VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON auth.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON auth.refresh_tokens(token);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION auth.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();
