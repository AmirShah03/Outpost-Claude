-- OutpostClaude Seed Data
-- ========================

-- Staff user (password: staff123)
INSERT INTO users (id, email, password_hash, name, phone, role) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@outpost.com', '$2b$12$lQirCu2YeoIQ9bvXlteqVenrHcFf7b9PICaY87RiIW3c2obMTP/Ti', 'Admin Staff', '+60123456789', 'staff');

-- Demo customer (password: customer123)
INSERT INTO users (id, email, password_hash, name, phone, address, role, loyalty_points) VALUES
('b0000000-0000-0000-0000-000000000001', 'john@example.com', '$2b$12$cpBz0HsZgSPHyGuH6vwV6OClOPmE5uACLByMl2KNiasollTpmQ/6G', 'John Doe', '+60111222333', '123 Main Street, Kuala Lumpur 50000', 'customer', 250);

-- Categories
INSERT INTO categories (id, name, description) VALUES
(1, 'T-Shirts', 'Casual and premium t-shirts for everyday wear'),
(2, 'Hoodies', 'Comfortable hoodies and sweatshirts'),
(3, 'Pants', 'Jeans, joggers, and casual pants'),
(4, 'Shoes', 'Sneakers, boots, and casual footwear'),
(5, 'Accessories', 'Caps, bags, and other accessories');

-- Products
INSERT INTO products (id, name, description, image_url, category_id) VALUES
(1, 'Urban Core Tee', 'Premium cotton t-shirt with minimalist design. Soft-touch fabric with a relaxed fit perfect for layering or wearing solo.', '/img/products/tee-urban.jpg', 1),
(2, 'Midnight Graphic Tee', 'Bold graphic print on heavyweight cotton. Features a unique abstract design inspired by city nightlife.', '/img/products/tee-midnight.jpg', 1),
(3, 'Shadow Hoodie', 'Heavyweight fleece hoodie with kangaroo pocket. Double-lined hood with adjustable drawstrings for the perfect fit.', '/img/products/hoodie-shadow.jpg', 2),
(4, 'Cloud Nine Zip-Up', 'Ultra-soft zip-up hoodie with a brushed interior. Perfect transitional piece for any season.', '/img/products/hoodie-cloud.jpg', 2),
(5, 'Stealth Joggers', 'Tapered joggers with zippered pockets. Moisture-wicking fabric keeps you comfortable during any activity.', '/img/products/joggers-stealth.jpg', 3),
(6, 'Raw Edge Denim', 'Slim-fit denim jeans with raw hem detail. Premium stretch denim for all-day comfort.', '/img/products/denim-raw.jpg', 3),
(7, 'Velocity Runner', 'Lightweight mesh sneakers with cushioned sole. Designed for both style and performance.', '/img/products/shoes-velocity.jpg', 4),
(8, 'Summit Boots', 'Durable leather boots with rugged outsole. Water-resistant construction built for any terrain.', '/img/products/boots-summit.jpg', 4),
(9, 'Snapback Cap', 'Structured snapback cap with embroidered logo. Adjustable strap fits all head sizes.', '/img/products/cap-snap.jpg', 5),
(10, 'Utility Crossbody Bag', 'Compact crossbody bag with multiple compartments. Water-resistant nylon with adjustable strap.', '/img/products/bag-crossbody.jpg', 5);

-- Product Variants (size + price + stock)
INSERT INTO product_variants (product_id, size, price, stock_quantity) VALUES
-- Urban Core Tee
(1, 'S', 29.99, 50), (1, 'M', 29.99, 80), (1, 'L', 29.99, 60), (1, 'XL', 31.99, 40),
-- Midnight Graphic Tee
(2, 'S', 34.99, 30), (2, 'M', 34.99, 55), (2, 'L', 34.99, 45), (2, 'XL', 36.99, 25),
-- Shadow Hoodie
(3, 'S', 69.99, 25), (3, 'M', 69.99, 40), (3, 'L', 69.99, 35), (3, 'XL', 74.99, 20),
-- Cloud Nine Zip-Up
(4, 'S', 79.99, 20), (4, 'M', 79.99, 35), (4, 'L', 79.99, 30), (4, 'XL', 84.99, 15),
-- Stealth Joggers
(5, 'S', 54.99, 30), (5, 'M', 54.99, 50), (5, 'L', 54.99, 40), (5, 'XL', 59.99, 20),
-- Raw Edge Denim
(6, '28', 89.99, 15), (6, '30', 89.99, 30), (6, '32', 89.99, 35), (6, '34', 89.99, 25), (6, '36', 94.99, 15),
-- Velocity Runner
(7, 'US 7', 119.99, 15), (7, 'US 8', 119.99, 25), (7, 'US 9', 119.99, 30), (7, 'US 10', 119.99, 25), (7, 'US 11', 124.99, 15),
-- Summit Boots
(8, 'US 7', 159.99, 10), (8, 'US 8', 159.99, 20), (8, 'US 9', 159.99, 25), (8, 'US 10', 159.99, 18), (8, 'US 11', 164.99, 10),
-- Snapback Cap
(9, 'One Size', 24.99, 100),
-- Utility Crossbody Bag
(10, 'One Size', 44.99, 60);

-- Reset sequences
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
