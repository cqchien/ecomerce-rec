-- Create orders schema
CREATE SCHEMA IF NOT EXISTS orders;

-- Set search path
SET search_path TO orders;

-- Install uuid v7 function in orders schema
CREATE OR REPLACE FUNCTION orders.uuid_generate_v7()
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

-- Grant usage on schema
GRANT USAGE ON SCHEMA orders TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA orders TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA orders TO PUBLIC;

-- Create indexes will be handled by GORM AutoMigrate
