-- Create products schema
CREATE SCHEMA IF NOT EXISTS products;

-- Enable required extensions in public schema (available to all schemas)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Install uuid v7 function (PostgreSQL native UUIDv7 support)
-- UUIDv7 embeds timestamp for better indexing and sorting
CREATE OR REPLACE FUNCTION products.uuid_generate_v7()
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
