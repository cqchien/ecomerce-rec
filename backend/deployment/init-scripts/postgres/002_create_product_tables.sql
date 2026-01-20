-- Set search path to products schema
SET search_path TO products;

-- Create categories table with UUIDv7
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT products.uuid_generate_v7(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID,
    image TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_deleted_at ON categories(deleted_at);

-- Add self-referential foreign key
ALTER TABLE categories
    ADD CONSTRAINT fk_categories_parent
    FOREIGN KEY (parent_id) REFERENCES categories(id)
    ON DELETE SET NULL;

-- Create products table with UUIDv7
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT products.uuid_generate_v7(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    long_description TEXT,
    price BIGINT NOT NULL,
    original_price BIGINT,
    category_id UUID NOT NULL,
    images TEXT[],
    specifications JSONB,
    tags TEXT[],
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    is_on_sale BOOLEAN DEFAULT false,
    sku VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_is_on_sale ON products(is_on_sale);
CREATE INDEX idx_products_deleted_at ON products(deleted_at);
CREATE INDEX idx_products_tags ON products USING GIN(tags);

ALTER TABLE products
    ADD CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE CASCADE;

-- Product variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT products.uuid_generate_v7(),
    product_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    price BIGINT NOT NULL,
    stock INT DEFAULT 0,
    attributes JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);

ALTER TABLE product_variants
    ADD CONSTRAINT fk_product_variants_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE;
