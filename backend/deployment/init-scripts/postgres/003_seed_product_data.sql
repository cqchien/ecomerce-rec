-- Set search path to products schema
SET search_path TO products;

-- Seed Categories (Based on typical e-commerce categories)
INSERT INTO categories (name, slug, description, parent_id, image, sort_order, is_active) VALUES
('Electronics', 'electronics', 'Electronic devices and accessories', NULL, 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800', 1, true),
('Computers & Accessories', 'computers-accessories', 'Laptops, desktops, and computer accessories', (SELECT id FROM categories WHERE slug = 'electronics'), 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800', 1, true),
('Mobile Phones', 'mobile-phones', 'Smartphones and mobile accessories', (SELECT id FROM categories WHERE slug = 'electronics'), 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800', 2, true),
('Audio & Video', 'audio-video', 'Headphones, speakers, and video equipment', (SELECT id FROM categories WHERE slug = 'electronics'), 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800', 3, true),

('Fashion', 'fashion', 'Clothing and fashion accessories', NULL, 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800', 2, true),
('Men''s Clothing', 'mens-clothing', 'Clothing for men', (SELECT id FROM categories WHERE slug = 'fashion'), 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=800', 1, true),
('Women''s Clothing', 'womens-clothing', 'Clothing for women', (SELECT id FROM categories WHERE slug = 'fashion'), 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800', 2, true),
('Shoes', 'shoes', 'Footwear for all', (SELECT id FROM categories WHERE slug = 'fashion'), 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800', 3, true),

('Home & Kitchen', 'home-kitchen', 'Home appliances and kitchenware', NULL, 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800', 3, true),
('Furniture', 'furniture', 'Home and office furniture', (SELECT id FROM categories WHERE slug = 'home-kitchen'), 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', 1, true),
('Kitchen Appliances', 'kitchen-appliances', 'Cooking and kitchen appliances', (SELECT id FROM categories WHERE slug = 'home-kitchen'), 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800', 2, true),

('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', NULL, 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800', 4, true),
('Fitness Equipment', 'fitness-equipment', 'Exercise and fitness gear', (SELECT id FROM categories WHERE slug = 'sports-outdoors'), 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', 1, true),
('Outdoor Recreation', 'outdoor-recreation', 'Camping, hiking, and outdoor activities', (SELECT id FROM categories WHERE slug = 'sports-outdoors'), 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800', 2, true),

('Books & Media', 'books-media', 'Books, magazines, and media', NULL, 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800', 5, true),
('Books', 'books', 'Physical and digital books', (SELECT id FROM categories WHERE slug = 'books-media'), 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800', 1, true),
('Movies & Music', 'movies-music', 'DVDs, Blu-rays, and music', (SELECT id FROM categories WHERE slug = 'books-media'), 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800', 2, true);

-- Seed Products (E-commerce sample data inspired by Retail Rocket dataset structure)
INSERT INTO products (name, slug, description, long_description, price, original_price, category_id, images, specifications, tags, rating, review_count, is_featured, is_new, is_on_sale, sku, status) VALUES
-- Electronics - Computers
('Apple MacBook Pro 16" M3', 'macbook-pro-16-m3', 'Powerful laptop with M3 chip', 'The new MacBook Pro 16-inch with M3 chip delivers exceptional performance for professionals. Features include 16GB RAM, 512GB SSD, and stunning Retina display.', 249900, 299900, (SELECT id FROM categories WHERE slug = 'computers-accessories'), 
ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800'], 
'{"processor": "Apple M3", "ram": "16GB", "storage": "512GB SSD", "display": "16-inch Retina", "color": "Space Gray"}'::jsonb,
ARRAY['laptop', 'apple', 'macbook', 'professional'], 4.8, 245, true, true, true, 'MBP-M3-16-512', 'ACTIVE'),

('Dell XPS 15', 'dell-xps-15', 'Premium Windows laptop', 'Dell XPS 15 with Intel Core i7, 16GB RAM, and 1TB SSD. Perfect for professionals and creators.', 189900, 219900, (SELECT id FROM categories WHERE slug = 'computers-accessories'),
ARRAY['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800'],
'{"processor": "Intel Core i7-13700H", "ram": "16GB DDR5", "storage": "1TB SSD", "display": "15.6-inch FHD+", "gpu": "NVIDIA RTX 4050"}'::jsonb,
ARRAY['laptop', 'dell', 'windows', 'gaming'], 4.6, 189, true, false, true, 'DELL-XPS15-I7', 'ACTIVE'),

('Logitech MX Master 3S', 'logitech-mx-master-3s', 'Advanced wireless mouse', 'Ergonomic wireless mouse with customizable buttons and ultra-precise scrolling', 9999, NULL, (SELECT id FROM categories WHERE slug = 'computers-accessories'),
ARRAY['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800'],
'{"connectivity": "Bluetooth/USB", "battery": "70 days", "dpi": "8000", "buttons": "7"}'::jsonb,
ARRAY['mouse', 'wireless', 'logitech', 'accessories'], 4.7, 523, false, false, false, 'LOG-MX3S-BLK', 'ACTIVE'),

-- Electronics - Mobile Phones
('iPhone 15 Pro Max', 'iphone-15-pro-max', 'Latest Apple flagship phone', 'iPhone 15 Pro Max with A17 Pro chip, titanium design, and advanced camera system. Available in 256GB, 512GB, and 1TB.', 119900, NULL, (SELECT id FROM categories WHERE slug = 'mobile-phones'),
ARRAY['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800', 'https://images.unsplash.com/photo-1695048133082-1f74c8c5be1d?w=800', 'https://images.unsplash.com/photo-1592286927505-2fd0cc02c753?w=800'],
'{"processor": "A17 Pro", "storage": "256GB", "display": "6.7-inch Super Retina XDR", "camera": "48MP Main + 12MP Ultra Wide + 12MP Telephoto", "battery": "4422mAh"}'::jsonb,
ARRAY['smartphone', 'apple', 'iphone', '5G'], 4.9, 1247, true, true, false, 'IPH15-PM-256-TIT', 'ACTIVE'),

('Samsung Galaxy S24 Ultra', 'samsung-s24-ultra', 'Premium Android flagship', 'Samsung Galaxy S24 Ultra with S Pen, 200MP camera, and AI features. Snapdragon 8 Gen 3 processor.', 119900, NULL, (SELECT id FROM categories WHERE slug = 'mobile-phones'),
ARRAY['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800'],
'{"processor": "Snapdragon 8 Gen 3", "ram": "12GB", "storage": "256GB", "display": "6.8-inch Dynamic AMOLED 2X", "camera": "200MP + 50MP + 12MP + 10MP"}'::jsonb,
ARRAY['smartphone', 'samsung', 'android', 'flagship'], 4.8, 892, true, true, false, 'SAM-S24U-256', 'ACTIVE'),

-- Electronics - Audio
('Sony WH-1000XM5', 'sony-wh1000xm5', 'Premium noise-cancelling headphones', 'Industry-leading noise cancellation with exceptional sound quality and 30-hour battery life.', 39900, 42900, (SELECT id FROM categories WHERE slug = 'audio-video'),
ARRAY['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
'{"type": "Over-ear", "battery": "30 hours", "noise_cancellation": "Active", "connectivity": "Bluetooth 5.2"}'::jsonb,
ARRAY['headphones', 'wireless', 'noise-cancelling', 'sony'], 4.7, 1534, true, false, true, 'SONY-WH1000XM5-BLK', 'ACTIVE'),

('Apple AirPods Pro 2nd Gen', 'airpods-pro-2', 'Premium wireless earbuds', 'AirPods Pro with active noise cancellation, transparency mode, and spatial audio.', 24900, NULL, (SELECT id FROM categories WHERE slug = 'audio-video'),
ARRAY['https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800'],
'{"type": "In-ear", "battery": "6 hours (30 with case)", "noise_cancellation": "Active", "chip": "H2"}'::jsonb,
ARRAY['earbuds', 'apple', 'wireless', 'noise-cancelling'], 4.6, 2341, false, false, false, 'APP-2GEN-USB', 'ACTIVE'),

-- Fashion - Men's
('Levi''s 501 Original Jeans', 'levis-501-jeans', 'Classic straight-leg jeans', 'The original blue jean since 1873. Straight fit with button fly.', 8900, NULL, (SELECT id FROM categories WHERE slug = 'mens-clothing'),
ARRAY['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800'],
'{"material": "100% Cotton", "fit": "Straight", "closure": "Button fly", "care": "Machine wash"}'::jsonb,
ARRAY['jeans', 'denim', 'mens', 'classic'], 4.5, 3421, false, false, false, 'LEVI-501-32-34-BLUE', 'ACTIVE'),

('Nike Air Max 90', 'nike-air-max-90', 'Iconic sneakers', 'Classic Nike Air Max 90 with visible Air unit and retro design.', 12999, 14999, (SELECT id FROM categories WHERE slug = 'shoes'),
ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800'],
'{"brand": "Nike", "material": "Leather and mesh", "sole": "Rubber", "technology": "Air cushioning"}'::jsonb,
ARRAY['sneakers', 'nike', 'shoes', 'athletic'], 4.7, 1876, true, false, true, 'NIKE-AM90-US10-WHT', 'ACTIVE'),

-- Fashion - Women's
('Zara Floral Summer Dress', 'zara-floral-dress', 'Elegant summer dress', 'Beautiful floral print dress perfect for summer occasions.', 4999, 7999, (SELECT id FROM categories WHERE slug = 'womens-clothing'),
ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800'],
'{"material": "100% Viscose", "pattern": "Floral", "length": "Midi", "season": "Summer"}'::jsonb,
ARRAY['dress', 'womens', 'summer', 'floral'], 4.4, 234, false, true, true, 'ZARA-FLD-M-BLUE', 'ACTIVE'),

-- Home & Kitchen
('Dyson V15 Detect', 'dyson-v15-detect', 'Advanced cordless vacuum', 'Powerful cordless vacuum with laser dust detection and LCD screen showing particle counts.', 64900, 69900, (SELECT id FROM categories WHERE slug = 'home-kitchen'),
ARRAY['https://images.unsplash.com/photo-1558317374-067fb8f350f6?w=800', 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=800'],
'{"type": "Cordless stick", "runtime": "60 minutes", "bin_capacity": "0.77L", "filtration": "HEPA"}'::jsonb,
ARRAY['vacuum', 'cordless', 'dyson', 'cleaning'], 4.8, 567, true, false, true, 'DYS-V15-DET-GOLD', 'ACTIVE'),

('KitchenAid Stand Mixer', 'kitchenaid-stand-mixer', 'Professional stand mixer', '5-quart tilt-head stand mixer with 10 speeds and multiple attachments.', 42999, NULL, (SELECT id FROM categories WHERE slug = 'kitchen-appliances'),
ARRAY['https://images.unsplash.com/photo-1607791038253-7b7a99f8ca51?w=800'],
'{"capacity": "5 quart", "speeds": "10", "power": "325W", "attachments": "3 included"}'::jsonb,
ARRAY['mixer', 'kitchen', 'baking', 'appliances'], 4.9, 4231, true, false, false, 'KA-KSM150-RED', 'ACTIVE'),

-- Sports
('Peloton Bike+', 'peloton-bike-plus', 'Interactive exercise bike', 'Premium indoor bike with rotating HD touchscreen and auto-resistance.', 249500, NULL, (SELECT id FROM categories WHERE slug = 'fitness-equipment'),
ARRAY['https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?w=800', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'],
'{"screen": "23.8-inch HD", "resistance": "Automatic", "connectivity": "WiFi + Bluetooth", "subscription": "Required"}'::jsonb,
ARRAY['fitness', 'bike', 'peloton', 'cardio'], 4.6, 892, true, false, false, 'PEL-BIKE-PLUS-BLK', 'ACTIVE'),

('The North Face Backpack', 'north-face-backpack', 'Durable hiking backpack', '40L hiking backpack with multiple compartments and rain cover.', 14999, NULL, (SELECT id FROM categories WHERE slug = 'outdoor-recreation'),
ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'],
'{"capacity": "40L", "material": "Ripstop nylon", "pockets": "Multiple", "features": "Rain cover, hip belt"}'::jsonb,
ARRAY['backpack', 'hiking', 'outdoor', 'camping'], 4.7, 1234, false, false, false, 'TNF-BP-40L-GRY', 'ACTIVE'),

-- Books
('Atomic Habits', 'atomic-habits-book', 'Life-changing book by James Clear', 'Tiny Changes, Remarkable Results - An Easy & Proven Way to Build Good Habits & Break Bad Ones.', 1699, 1999, (SELECT id FROM categories WHERE slug = 'books'),
ARRAY['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800'],
'{"author": "James Clear", "pages": "320", "format": "Hardcover", "language": "English", "publisher": "Avery"}'::jsonb,
ARRAY['book', 'self-help', 'habits', 'bestseller'], 4.9, 15234, true, false, true, 'BOOK-ATH-HC-ENG', 'ACTIVE'),

('Wireless Gaming Keyboard', 'gaming-keyboard-rgb', 'RGB mechanical keyboard', 'Wireless mechanical gaming keyboard with RGB lighting and hot-swappable switches.', 12999, 15999, (SELECT id FROM categories WHERE slug = 'computers-accessories'),
ARRAY['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800'],
'{"switches": "Hot-swappable mechanical", "connectivity": "2.4GHz + Bluetooth", "battery": "4000mAh", "rgb": "Per-key RGB"}'::jsonb,
ARRAY['keyboard', 'gaming', 'mechanical', 'rgb'], 4.5, 678, false, true, true, 'KB-GAME-RGB-BLK', 'ACTIVE');

-- Seed some product variants
INSERT INTO product_variants (product_id, name, sku, price, stock, attributes) VALUES
-- iPhone variants
((SELECT id FROM products WHERE slug = 'iphone-15-pro-max'), '512GB Titanium', 'IPH15-PM-512-TIT', 139900, 45, '{"storage": "512GB", "color": "Natural Titanium"}'::jsonb),
((SELECT id FROM products WHERE slug = 'iphone-15-pro-max'), '1TB Titanium', 'IPH15-PM-1TB-TIT', 159900, 23, '{"storage": "1TB", "color": "Natural Titanium"}'::jsonb),
((SELECT id FROM products WHERE slug = 'iphone-15-pro-max'), '256GB Blue', 'IPH15-PM-256-BLU', 119900, 67, '{"storage": "256GB", "color": "Blue Titanium"}'::jsonb),

-- Samsung variants  
((SELECT id FROM products WHERE slug = 'samsung-s24-ultra'), '512GB Black', 'SAM-S24U-512-BLK', 139900, 34, '{"storage": "512GB", "color": "Titanium Black"}'::jsonb),
((SELECT id FROM products WHERE slug = 'samsung-s24-ultra'), '256GB Gray', 'SAM-S24U-256-GRY', 119900, 56, '{"storage": "256GB", "color": "Titanium Gray"}'::jsonb),

-- Shoe variants
((SELECT id FROM products WHERE slug = 'nike-air-max-90'), 'US 9', 'NIKE-AM90-US9-WHT', 12999, 23, '{"size": "US 9", "color": "White"}'::jsonb),
((SELECT id FROM products WHERE slug = 'nike-air-max-90'), 'US 11', 'NIKE-AM90-US11-WHT', 12999, 15, '{"size": "US 11", "color": "White"}'::jsonb),
((SELECT id FROM products WHERE slug = 'nike-air-max-90'), 'US 10 Black', 'NIKE-AM90-US10-BLK', 12999, 31, '{"size": "US 10", "color": "Black"}'::jsonb);
