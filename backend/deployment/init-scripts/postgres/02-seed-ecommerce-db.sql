-- ================================================
-- ECOMMERCE DATABASE - COMPLETE SEED FILE
-- Database: ecommerce_db (single database, multiple schemas)
-- ================================================
--
-- ARCHITECTURE: Single Database with Schemas
-- - auth schema: Authentication & authorization
-- - users schema: User profiles & preferences
-- - products schema: Product catalog
-- - inventory schema: Stock management
-- - carts schema: Shopping carts
-- - orders schema: Order management
-- - payments schema: Payment processing
--
-- This approach simplifies:
-- - Connection management (single DB)
-- - Transactions across services (if needed)
-- - Backups and migrations
-- - Development and testing
-- ================================================

\c ecommerce_db;

-- ================================================
-- AUTH SCHEMA - Authentication & Authorization
-- ================================================

SET search_path TO auth, public;

-- Users table (authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar TEXT,
    role VARCHAR(20) DEFAULT 'customer',
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(500) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    replaced_by_token VARCHAR(500),
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for auth schema
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_token ON auth.refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_user_id ON auth.refresh_tokens(user_id);

-- ================================================
-- USERS SCHEMA - User Profiles & Preferences
-- ================================================

SET search_path TO users, public;

-- User profiles (references auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    bio TEXT,
    date_of_birth DATE,
    gender VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Wishlist
CREATE TABLE IF NOT EXISTS wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id VARCHAR(255) NOT NULL,
    added_at TIMESTAMP DEFAULT NOW()
);

-- User preferences
CREATE TABLE IF NOT EXISTS preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(10) DEFAULT 'USD',
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for users schema
CREATE INDEX IF NOT EXISTS idx_users_addresses_user_id ON users.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_users_addresses_default ON users.addresses(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_users_wishlist_user_id ON users.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_users_wishlist_product_id ON users.wishlist_items(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wishlist_unique ON users.wishlist_items(user_id, product_id);

-- ================================================
-- PRODUCTS SCHEMA - Product Catalog
-- ================================================

SET search_path TO products, public;

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_id VARCHAR(36) REFERENCES products.categories(id),
    image TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    long_description TEXT,
    price BIGINT NOT NULL,
    original_price BIGINT,
    category_id VARCHAR(36) NOT NULL REFERENCES products.categories(id),
    images TEXT[],
    specifications JSONB,
    tags TEXT[],
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT FALSE,
    is_on_sale BOOLEAN DEFAULT FALSE,
    sku VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Product variants
CREATE TABLE IF NOT EXISTS product_variants (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL REFERENCES products.products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    price BIGINT NOT NULL,
    stock INTEGER DEFAULT 0,
    attributes JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for products schema
CREATE INDEX IF NOT EXISTS idx_products_categories_parent ON products.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_sale ON products.products(is_on_sale);
CREATE INDEX IF NOT EXISTS idx_products_status ON products.products(status);
CREATE INDEX IF NOT EXISTS idx_products_variants_product ON products.product_variants(product_id);

-- ================================================
-- INVENTORY SCHEMA - Stock Management
-- ================================================

SET search_path TO inventory, public;

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(255) NOT NULL,
    variant_id VARCHAR(255),
    sku VARCHAR(100) UNIQUE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    reorder_level INTEGER DEFAULT 10,
    reorder_quantity INTEGER DEFAULT 50,
    warehouse_location VARCHAR(100),
    last_restocked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Inventory transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES inventory.inventory(id),
    transaction_type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    reference_id VARCHAR(255),
    reference_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for inventory schema
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_variant_id ON inventory.inventory(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory.inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory ON inventory.transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory.transactions(transaction_type);

-- ================================================
-- CARTS SCHEMA - Shopping Carts
-- ================================================

SET search_path TO carts, public;

-- Carts
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    subtotal BIGINT NOT NULL DEFAULT 0,
    discount BIGINT NOT NULL DEFAULT 0,
    total BIGINT NOT NULL DEFAULT 0,
    coupon_code VARCHAR(100),
    is_abandoned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Cart items
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts.carts(id) ON DELETE CASCADE,
    product_id VARCHAR(255) NOT NULL,
    variant_id VARCHAR(255),
    name VARCHAR(500) NOT NULL,
    image TEXT,
    sku VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price BIGINT NOT NULL,
    total_price BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes for carts schema
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON carts.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON carts.cart_items(product_id);

-- ================================================
-- ORDERS SCHEMA - Order Management
-- ================================================

SET search_path TO orders, public;

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    status VARCHAR(20) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address TEXT,
    billing_address TEXT,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20),
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL REFERENCES orders.orders(id) ON DELETE CASCADE,
    product_id VARCHAR(36) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes for orders schema
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON orders.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON orders.order_items(product_id);

-- ================================================
-- PAYMENTS SCHEMA - Payment Processing
-- ================================================

SET search_path TO payments, public;

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(36) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL,
    method VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255),
    provider_response TEXT,
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes for payments schema
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON payments.payments(provider_id);

-- ================================================
-- SEED DATA - Sample Users
-- ================================================

SET search_path TO auth, public;

-- Password for all users: Password123!
-- Hashed with bcrypt (you'll need to generate real hashes)
INSERT INTO auth.users (id, email, password, name, phone, role, email_verified, created_at, updated_at)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@example.com', '$2b$10$rKJ5QZ5Z5Z5Z5Z5Z5Z5Z5uKJ5QZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'Admin User', '+1234567890', 'admin', TRUE, NOW(), NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'john.doe@example.com', '$2b$10$rKJ5QZ5Z5Z5Z5Z5Z5Z5Z5uKJ5QZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'John Doe', '+1234567891', 'customer', TRUE, NOW(), NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'jane.smith@example.com', '$2b$10$rKJ5QZ5Z5Z5Z5Z5Z5Z5Z5uKJ5QZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'Jane Smith', '+1234567892', 'customer', TRUE, NOW(), NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'bob.wilson@example.com', '$2b$10$rKJ5QZ5Z5Z5Z5Z5Z5Z5Z5uKJ5QZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'Bob Wilson', '+1234567893', 'customer', TRUE, NOW(), NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'alice.brown@example.com', '$2b$10$rKJ5QZ5Z5Z5Z5Z5Z5Z5Z5uKJ5QZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'Alice Brown', '+1234567894', 'customer', FALSE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- SEED DATA - User Addresses
-- ================================================

SET search_path TO users, public;

INSERT INTO users.addresses (id, user_id, first_name, last_name, address_line1, address_line2, city, state, postal_code, country, phone, is_default)
VALUES 
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'John', 'Doe', '123 Main St', 'Apt 4B', 'New York', 'NY', '10001', 'US', '+1234567891', TRUE),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'John', 'Doe', '456 Park Ave', NULL, 'Brooklyn', 'NY', '11201', 'US', '+1234567891', FALSE),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Jane', 'Smith', '789 Oak Rd', 'Suite 200', 'Los Angeles', 'CA', '90001', 'US', '+1234567892', TRUE),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Bob', 'Wilson', '321 Pine St', NULL, 'Chicago', 'IL', '60601', 'US', '+1234567893', TRUE),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Alice', 'Brown', '654 Elm Ave', 'Unit 3', 'Miami', 'FL', '33101', 'US', '+1234567894', TRUE)
ON CONFLICT (id) DO NOTHING;

-- User preferences
INSERT INTO users.preferences (user_id, email_notifications, sms_notifications, marketing_emails, language, currency)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', TRUE, TRUE, TRUE, 'en', 'USD'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', TRUE, FALSE, TRUE, 'en', 'USD'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', TRUE, TRUE, FALSE, 'en', 'USD'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', FALSE, FALSE, FALSE, 'en', 'EUR'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', TRUE, FALSE, TRUE, 'en', 'USD')
ON CONFLICT (user_id) DO NOTHING;

-- ================================================
-- SEED DATA - Categories
-- ================================================

SET search_path TO products, public;

INSERT INTO products.categories (id, name, slug, description, parent_id, image, sort_order, is_active)
VALUES 
    ('cat-electronics', 'Electronics', 'electronics', 'Electronic devices and accessories', NULL, 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', 1, TRUE),
    ('cat-laptops', 'Laptops', 'laptops', 'Portable computers', 'cat-electronics', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', 1, TRUE),
    ('cat-phones', 'Smartphones', 'smartphones', 'Mobile phones', 'cat-electronics', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', 2, TRUE),
    ('cat-tablets', 'Tablets', 'tablets', 'Tablet devices', 'cat-electronics', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400', 3, TRUE),
    ('cat-fashion', 'Fashion', 'fashion', 'Clothing and accessories', NULL, 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400', 2, TRUE),
    ('cat-mens', 'Men''s Clothing', 'mens-clothing', 'Clothing for men', 'cat-fashion', 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=400', 1, TRUE),
    ('cat-womens', 'Women''s Clothing', 'womens-clothing', 'Clothing for women', 'cat-fashion', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400', 2, TRUE),
    ('cat-home', 'Home & Kitchen', 'home-kitchen', 'Home appliances', NULL, 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400', 3, TRUE),
    ('cat-furniture', 'Furniture', 'furniture', 'Home and office furniture', 'cat-home', 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400', 1, TRUE),
    ('cat-sports', 'Sports & Outdoors', 'sports-outdoors', 'Sports equipment', NULL, 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400', 4, TRUE),
    ('cat-fitness', 'Fitness Equipment', 'fitness-equipment', 'Exercise gear', 'cat-sports', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400', 1, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- SEED DATA - Products (12 sample products)
-- ================================================

INSERT INTO products.products (id, name, slug, description, long_description, price, original_price, category_id, images, specifications, tags, rating, review_count, is_featured, is_new, is_on_sale, sku, status)
VALUES 
    ('prod-001', 'MacBook Pro 16"', 'macbook-pro-16', 'Professional laptop with M3 Pro chip', 'The MacBook Pro 16" delivers exceptional performance. Features brilliant Liquid Retina XDR display, up to 22 hours battery.', 249900, 299900, 'cat-laptops', 
     ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800'],
     '{"processor": "Apple M3 Pro", "ram": "32GB", "storage": "1TB SSD", "display": "16-inch Liquid Retina XDR"}'::jsonb,
     ARRAY['laptop', 'apple', 'macbook'], 4.8, 245, TRUE, TRUE, TRUE, 'LAPTOP-MBP16-001', 'ACTIVE'),
    
    ('prod-002', 'Dell XPS 15', 'dell-xps-15', 'Premium Windows laptop', 'Dell XPS 15 with stunning OLED display, 12th Gen Intel Core i7.', 179900, 199900, 'cat-laptops',
     ARRAY['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800'],
     '{"processor": "Intel Core i7-12700H", "ram": "16GB", "storage": "512GB SSD"}'::jsonb,
     ARRAY['laptop', 'dell', 'windows'], 4.6, 189, TRUE, FALSE, TRUE, 'LAPTOP-XPS15-001', 'ACTIVE'),

    ('prod-003', 'iPhone 15 Pro', 'iphone-15-pro', 'Latest iPhone with titanium design', 'iPhone 15 Pro features titanium design with A17 Pro chip.', 99900, NULL, 'cat-phones',
     ARRAY['https://images.unsplash.com/photo-1696446702839-a6b3c1430ac8?w=800'],
     '{"processor": "A17 Pro", "storage": "256GB", "display": "6.1-inch Super Retina XDR"}'::jsonb,
     ARRAY['smartphone', 'apple', 'iphone'], 4.9, 567, TRUE, TRUE, FALSE, 'PHONE-IP15PRO-256', 'ACTIVE'),
    
    ('prod-004', 'Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 'Premium Android flagship', 'Samsung Galaxy S24 Ultra with 200MP camera and S Pen.', 119900, 129900, 'cat-phones',
     ARRAY['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800'],
     '{"processor": "Snapdragon 8 Gen 3", "storage": "512GB", "camera": "200MP"}'::jsonb,
     ARRAY['smartphone', 'samsung', 'android'], 4.7, 423, TRUE, TRUE, TRUE, 'PHONE-S24U-512', 'ACTIVE'),

    ('prod-005', 'iPad Pro 12.9"', 'ipad-pro-12-9', 'Powerful tablet with M2 chip', 'iPad Pro with M2 chip and stunning display.', 109900, NULL, 'cat-tablets',
     ARRAY['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800'],
     '{"processor": "Apple M2", "storage": "256GB", "display": "12.9-inch Liquid Retina XDR"}'::jsonb,
     ARRAY['tablet', 'apple', 'ipad'], 4.8, 334, TRUE, FALSE, FALSE, 'TABLET-IPADPRO-256', 'ACTIVE'),

    ('prod-006', 'Classic Oxford Shirt', 'classic-oxford-shirt-blue', 'Premium cotton oxford shirt', 'Timeless oxford shirt from 100% cotton.', 4995, 6995, 'cat-mens',
     ARRAY['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800'],
     '{"material": "100% Cotton", "fit": "Regular"}'::jsonb,
     ARRAY['shirt', 'mens', 'fashion'], 4.5, 156, FALSE, FALSE, TRUE, 'SHIRT-OXFORD-BLU-M', 'ACTIVE'),
    
    ('prod-007', 'Slim Fit Chinos', 'slim-fit-chinos-navy', 'Comfortable stretch chinos', 'Modern slim fit chinos with stretch.', 5995, NULL, 'cat-mens',
     ARRAY['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800'],
     '{"material": "97% Cotton, 3% Elastane", "fit": "Slim"}'::jsonb,
     ARRAY['pants', 'mens', 'casual'], 4.6, 89, FALSE, FALSE, FALSE, 'PANTS-CHINO-NAV-32', 'ACTIVE'),

    ('prod-008', 'Floral Summer Dress', 'floral-summer-dress', 'Elegant floral print dress', 'Beautiful floral dress for summer.', 7995, 9995, 'cat-womens',
     ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'],
     '{"material": "100% Viscose", "length": "Midi"}'::jsonb,
     ARRAY['dress', 'womens', 'summer'], 4.7, 223, TRUE, TRUE, TRUE, 'DRESS-FLORAL-SUM-M', 'ACTIVE'),

    ('prod-009', 'Modern Office Chair', 'modern-ergonomic-office-chair', 'Ergonomic mesh office chair', 'Premium ergonomic chair with lumbar support.', 29995, 39995, 'cat-furniture',
     ARRAY['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800'],
     '{"material": "Mesh + Steel", "features": "Adjustable height, Lumbar support"}'::jsonb,
     ARRAY['furniture', 'office', 'ergonomic'], 4.6, 445, TRUE, FALSE, TRUE, 'FURN-CHAIR-ERG-BLK', 'ACTIVE'),
    
    ('prod-010', 'Scandinavian Coffee Table', 'scandinavian-coffee-table-oak', 'Minimalist oak coffee table', 'Beautiful Scandinavian coffee table.', 34995, NULL, 'cat-furniture',
     ARRAY['https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=800'],
     '{"material": "Solid Oak", "dimensions": "120cm x 60cm x 45cm"}'::jsonb,
     ARRAY['furniture', 'table', 'scandinavian'], 4.8, 178, TRUE, FALSE, FALSE, 'FURN-TABLE-OAK-120', 'ACTIVE'),

    ('prod-011', 'Yoga Mat Pro', 'yoga-mat-pro-purple', 'Premium non-slip yoga mat', 'Professional yoga mat with superior grip.', 4995, 5995, 'cat-fitness',
     ARRAY['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800'],
     '{"material": "TPE", "thickness": "6mm", "size": "183cm x 61cm"}'::jsonb,
     ARRAY['fitness', 'yoga', 'exercise'], 4.7, 567, FALSE, FALSE, TRUE, 'FIT-YOGA-MAT-PUR', 'ACTIVE'),
    
    ('prod-012', 'Adjustable Dumbbells Set', 'adjustable-dumbbells-set-50lb', 'Space-saving adjustable dumbbells', 'Complete dumbbell set 5 to 50 lbs.', 29995, 34995, 'cat-fitness',
     ARRAY['https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800'],
     '{"weight_range": "5-50 lbs each", "material": "Cast iron"}'::jsonb,
     ARRAY['fitness', 'weights', 'home gym'], 4.8, 334, TRUE, FALSE, TRUE, 'FIT-DUMBBELL-50', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Product variants
INSERT INTO products.product_variants (id, product_id, name, sku, price, stock, attributes)
VALUES 
    ('var-001-1', 'prod-001', '32GB / 1TB / Space Black', 'LAPTOP-MBP16-32-1TB-BLK', 249900, 15, '{"color": "Space Black", "ram": "32GB"}'::jsonb),
    ('var-001-2', 'prod-001', '32GB / 1TB / Silver', 'LAPTOP-MBP16-32-1TB-SLV', 249900, 12, '{"color": "Silver", "ram": "32GB"}'::jsonb),
    ('var-003-1', 'prod-003', '256GB / Black', 'PHONE-IP15PRO-256-BLK', 99900, 50, '{"color": "Black", "storage": "256GB"}'::jsonb),
    ('var-003-2', 'prod-003', '256GB / White', 'PHONE-IP15PRO-256-WHT', 99900, 45, '{"color": "White", "storage": "256GB"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- SEED DATA - Inventory
-- ================================================

SET search_path TO inventory, public;

INSERT INTO inventory.inventory (product_id, variant_id, sku, quantity, reserved_quantity, reorder_level, warehouse_location, last_restocked_at)
VALUES 
    ('prod-001', 'var-001-1', 'LAPTOP-MBP16-32-1TB-BLK', 15, 2, 5, 'WH-ELECTRONICS-A1', NOW() - INTERVAL '7 days'),
    ('prod-001', 'var-001-2', 'LAPTOP-MBP16-32-1TB-SLV', 12, 1, 5, 'WH-ELECTRONICS-A1', NOW() - INTERVAL '7 days'),
    ('prod-002', NULL, 'LAPTOP-XPS15-001', 25, 3, 10, 'WH-ELECTRONICS-A2', NOW() - INTERVAL '10 days'),
    ('prod-003', 'var-003-1', 'PHONE-IP15PRO-256-BLK', 50, 5, 15, 'WH-ELECTRONICS-B1', NOW() - INTERVAL '3 days'),
    ('prod-003', 'var-003-2', 'PHONE-IP15PRO-256-WHT', 45, 4, 15, 'WH-ELECTRONICS-B1', NOW() - INTERVAL '3 days'),
    ('prod-004', NULL, 'PHONE-S24U-512', 40, 3, 12, 'WH-ELECTRONICS-B2', NOW() - INTERVAL '5 days'),
    ('prod-005', NULL, 'TABLET-IPADPRO-256', 35, 2, 10, 'WH-ELECTRONICS-C1', NOW() - INTERVAL '4 days'),
    ('prod-006', NULL, 'SHIRT-OXFORD-BLU-M', 30, 1, 15, 'WH-FASHION-A1', NOW() - INTERVAL '15 days'),
    ('prod-007', NULL, 'PANTS-CHINO-NAV-32', 45, 3, 20, 'WH-FASHION-A2', NOW() - INTERVAL '20 days'),
    ('prod-008', NULL, 'DRESS-FLORAL-SUM-M', 60, 5, 25, 'WH-FASHION-B1', NOW() - INTERVAL '12 days'),
    ('prod-009', NULL, 'FURN-CHAIR-ERG-BLK', 18, 2, 8, 'WH-FURNITURE-A1', NOW() - INTERVAL '30 days'),
    ('prod-010', NULL, 'FURN-TABLE-OAK-120', 12, 1, 5, 'WH-FURNITURE-A2', NOW() - INTERVAL '45 days'),
    ('prod-011', NULL, 'FIT-YOGA-MAT-PUR', 100, 8, 30, 'WH-SPORTS-A1', NOW() - INTERVAL '8 days'),
    ('prod-012', NULL, 'FIT-DUMBBELL-50', 25, 3, 10, 'WH-SPORTS-A2', NOW() - INTERVAL '6 days')
ON CONFLICT (sku) DO NOTHING;

COMMIT;

-- ================================================
-- VERIFICATION QUERIES
-- ================================================
-- Run these to verify data was seeded correctly:
-- 
-- SELECT COUNT(*) FROM auth.users;
-- SELECT COUNT(*) FROM products.products;
-- SELECT COUNT(*) FROM products.categories;
-- SELECT COUNT(*) FROM inventory.inventory;
-- SELECT COUNT(*) FROM users.addresses;
-- ================================================
