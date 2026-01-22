-- Create carts schema
CREATE SCHEMA IF NOT EXISTS carts;

-- Set search path
SET search_path TO carts;

-- Install uuid v7 function in carts schema
CREATE OR REPLACE FUNCTION carts.uuid_generate_v7()
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

-- Create carts table
CREATE TABLE IF NOT EXISTS carts.carts (
    id UUID DEFAULT carts.uuid_generate_v7() PRIMARY KEY,
    user_id UUID NOT NULL,
    subtotal BIGINT NOT NULL DEFAULT 0,
    discount BIGINT NOT NULL DEFAULT 0,
    total BIGINT NOT NULL DEFAULT 0,
    coupon_code VARCHAR(100),
    is_abandoned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS carts.cart_items (
    id UUID DEFAULT carts.uuid_generate_v7() PRIMARY KEY,
    cart_id UUID NOT NULL REFERENCES carts.carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    variant_id VARCHAR(255),
    name VARCHAR(500) NOT NULL,
    image TEXT,
    sku VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price BIGINT NOT NULL,
    total_price BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_deleted_at ON carts.carts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON carts.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_deleted_at ON carts.cart_items(deleted_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION carts.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_carts_updated_at
    BEFORE UPDATE ON carts.carts
    FOR EACH ROW
    EXECUTE FUNCTION carts.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON carts.cart_items
    FOR EACH ROW
    EXECUTE FUNCTION carts.update_updated_at_column();

-- Grant usage on schema
GRANT USAGE ON SCHEMA carts TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA carts TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA carts TO PUBLIC;
