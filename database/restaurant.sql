-- ============================================================
-- Mr. Chai Restaurant - Food Ordering Management System
-- Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS mr_chai_restaurant
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mr_chai_restaurant;

-- ============================================================
-- 1. USERS (Customers)
-- ============================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,        -- bcrypt hash
    address TEXT,
    profile_image VARCHAR(255) DEFAULT NULL,
    status ENUM('active', 'blocked') DEFAULT 'active',
    reset_token VARCHAR(255) DEFAULT NULL,      -- for Forgot Password
    reset_token_expiry DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 2. ADMINS
-- ============================================================
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,        -- bcrypt hash
    role ENUM('super_admin', 'staff') DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 3. CATEGORIES (e.g. Beverages, Rice, Noodles, Desserts)
-- ============================================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 4. FOODS
-- ============================================================
CREATE TABLE foods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(255) DEFAULT NULL,
    is_available TINYINT(1) DEFAULT 1,
    is_featured TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_foods_name ON foods(name);
CREATE INDEX idx_foods_category ON foods(category_id);

-- ============================================================
-- 5. CART (one row per user per food item)
-- ============================================================
CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    food_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_user_food (user_id, food_id)
) ENGINE=InnoDB;

-- ============================================================
-- 6. ORDERS
-- ============================================================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_number VARCHAR(30) NOT NULL UNIQUE,
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')
        DEFAULT 'pending',
    payment_status ENUM('unpaid', 'paid', 'failed', 'refunded') DEFAULT 'unpaid',
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);

-- ============================================================
-- 7. ORDER_ITEMS (snapshot of items at time of order)
-- ============================================================
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    food_id INT NOT NULL,
    food_name VARCHAR(150) NOT NULL,   -- snapshot, in case food is later edited/deleted
    price DECIMAL(10,2) NOT NULL,      -- price at time of order
    quantity INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- 8. PAYMENTS
-- ============================================================
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method ENUM('demo_card', 'cash_on_delivery', 'stripe') DEFAULT 'demo_card',
    transaction_id VARCHAR(100) DEFAULT NULL,
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    paid_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default admin (password: Admin@123 -> bcrypt hash, generate real hash in app before use)
-- Placeholder hash below MUST be replaced by running the backend's seed script
-- (bcrypt hashes are salted/random, so this is a Node.js step, not raw SQL).
INSERT INTO admins (full_name, email, password, role) VALUES
('Super Admin', 'admin@mrchai.com', '$2b$10$REPLACE_WITH_REAL_BCRYPT_HASH', 'super_admin');

-- Categories (from the Mr. Chai Oluvil evening menu)
INSERT INTO categories (name, description) VALUES
('Nasi Goreng', 'Indonesian-style fried rice topped with a fried egg'),
('Fried Rice', 'Wok-fried rice, Basmati or Ponni'),
('Biriyani', 'Slow-cooked dum biriyani'),
('Kadai & BBQ', 'Kadai curries, rotti, and charcoal BBQ chicken'),
('Noodles & Pasta', 'Stir-fried noodles and creamy pasta'),
('Dosa', 'South Indian dosa, sweet and savoury'),
('Soups', 'Warm soups to start'),
('Chicken Strips & Wings', 'Crispy fried chicken, spicy or regular'),
('Fries & Snacks', 'Fries, nuggets, and shareable bites'),
('Burgers', 'Chicken and beef burgers'),
('Buns', 'Stuffed buns'),
('Wraps & Submarines', 'Wraps and stuffed submarine rolls'),
('Sandwiches', 'Grilled and club sandwiches'),
('Desserts', 'Cakes, ice cream, and sweets'),
('Milkshakes', 'Thick blended milkshakes'),
('Iced Coffee', 'Cold coffee blends'),
('Bubble Tea', 'Milk tea with tapioca pearls'),
('Smoothies', 'Fresh fruit smoothies'),
('Chai & Tea', 'Masala chai and black tea');

-- Foods (prices in LKR, matching the printed menu)
INSERT INTO foods (category_id, name, description, price, is_featured) VALUES
-- Nasi Goreng
(1, 'Mixed Nasi Goreng - Basmati', 'Nasi goreng with mixed toppings, Basmati rice', 1450, 1),
(1, 'Mixed Nasi Goreng - Ponni', 'Nasi goreng with mixed toppings, Ponni rice', 1300, 0),
(1, 'Chicken Nasi Goreng - Basmati', 'Chicken nasi goreng, Basmati rice', 1200, 0),
(1, 'Chicken Nasi Goreng - Ponni', 'Chicken nasi goreng, Ponni rice', 1050, 0),
(1, 'Beef Nasi Goreng - Basmati', 'Beef nasi goreng, Basmati rice', 1300, 0),
(1, 'Beef Nasi Goreng - Ponni', 'Beef nasi goreng, Ponni rice', 1200, 0),
(1, 'Prawn Nasi Goreng - Basmati', 'Prawn nasi goreng, Basmati rice', 1300, 0),
(1, 'Prawn Nasi Goreng - Ponni', 'Prawn nasi goreng, Ponni rice', 1200, 0),

-- Fried Rice
(2, 'Mixed Fried Rice - Basmati', 'Wok-fried Basmati rice with mixed toppings', 1250, 0),
(2, 'Mixed Fried Rice - Ponni', 'Wok-fried Ponni rice with mixed toppings', 950, 0),
(2, 'Chicken Fried Rice - Basmati', 'Wok-fried Basmati rice with chicken', 850, 1),
(2, 'Chicken Fried Rice - Ponni', 'Wok-fried Ponni rice with chicken', 750, 0),
(2, 'Beef Fried Rice - Basmati', 'Wok-fried Basmati rice with beef', 950, 0),
(2, 'Beef Fried Rice - Ponni', 'Wok-fried Ponni rice with beef', 850, 0),
(2, 'Prawn Fried Rice - Basmati', 'Wok-fried Basmati rice with prawns', 950, 0),
(2, 'Prawn Fried Rice - Ponni', 'Wok-fried Ponni rice with prawns', 850, 0),

-- Biriyani
(3, 'Chicken Dum Biriyani', 'Slow-cooked chicken dum biriyani', 1200, 1),
(3, 'Chicken BBQ Biriyani', 'Chicken biriyani with BBQ chicken', 1350, 0),
(3, 'Beef Dum Biriyani', 'Slow-cooked beef dum biriyani', 1350, 0),

-- Kadai & BBQ
(4, 'Chicken Kadai & 2 Rotti', 'Chicken kadai curry served with two rotti', 1200, 0),
(4, 'Beef Kadai & Rotti', 'Beef kadai curry served with rotti', 1300, 0),
(4, 'Chicken BBQ Full', 'Whole charcoal-grilled BBQ chicken', 1950, 1),
(4, 'Chicken BBQ Half', 'Half charcoal-grilled BBQ chicken', 1100, 0),
(4, 'Chicken BBQ Quarter', 'Quarter charcoal-grilled BBQ chicken', 600, 0),
(4, 'Butter Rotti', 'Rotti brushed with butter', 200, 0),

-- Noodles & Pasta
(5, 'Chicken Noodles', 'Stir-fried noodles with chicken', 650, 0),
(5, 'Beef Noodles', 'Stir-fried noodles with beef', 800, 0),
(5, 'Prawn Noodles', 'Stir-fried noodles with prawns', 800, 0),
(5, 'Mixed Noodle', 'Stir-fried noodles with mixed toppings', 1100, 0),
(5, 'Chicken Pasta', 'Pasta tossed with chicken', 750, 0),
(5, 'Beef Pasta', 'Pasta tossed with beef', 850, 0),
(5, 'Prawn Pasta', 'Pasta tossed with prawns', 850, 0),
(5, 'Chicken Creamy Pasta', 'Creamy sauce pasta with chicken', 1150, 0),
(5, 'Beef Creamy Pasta', 'Creamy sauce pasta with beef', 1150, 0),
(5, 'Prawn Creamy Pasta', 'Creamy sauce pasta with prawns', 1150, 0),
(5, 'Mixed Creamy Pasta', 'Creamy sauce pasta with mixed toppings', 1350, 1),
(5, 'Mistry Chicken Blast', 'House special loaded chicken pasta blast', 1950, 1),

-- Dosa
(6, 'Onion Dosa', 'Crispy dosa with onion filling', 250, 0),
(6, 'Egg Dosa', 'Crispy dosa with egg', 280, 0),
(6, 'Ghee Dosa', 'Dosa cooked with ghee', 250, 0),
(6, 'Butter Dosa', 'Dosa cooked with butter', 250, 0),
(6, 'Chicken Dosa', 'Dosa topped with chicken', 400, 0),
(6, 'Beef Dosa', 'Dosa topped with beef', 500, 0),
(6, 'Chicken Egg Blast Dosa', 'Loaded dosa with chicken and egg', 600, 0),
(6, 'Cheese & Butter Chicken Dosa', 'Chicken dosa loaded with cheese and butter', 750, 1),
(6, 'Cheese & Butter Beef Dosa', 'Beef dosa loaded with cheese and butter', 850, 0),

-- Soups
(7, 'Chicken Soup', 'Classic chicken soup', 250, 0),
(7, 'Chicken Garlic Soup', 'Chicken soup with garlic', 300, 0),
(7, 'Chicken Cheesy Soup', 'Chicken soup with melted cheese', 350, 0),

-- Chicken Strips & Wings (regular price shown; spicy option managed via description)
(8, 'Chicken Strips - 3 Pieces', 'Crispy chicken strips, regular (spicy available on request)', 800, 0),
(8, 'Chicken Strips - 6 Pieces', 'Crispy chicken strips, regular (spicy available on request)', 1500, 1),
(8, 'Chicken Strips - 8 Pieces', 'Crispy chicken strips, regular (spicy available on request)', 1900, 0),
(8, 'Chicken Wings - 3 Pieces', 'Crispy chicken wings, regular (spicy available on request)', 550, 0),
(8, 'Chicken Wings - 6 Pieces', 'Crispy chicken wings, regular (spicy available on request)', 1100, 0),
(8, 'Chicken Wings - 8 Pieces', 'Crispy chicken wings, regular (spicy available on request)', 1450, 0),

-- Fries & Snacks
(9, 'French Fries', 'Classic crispy fries', 500, 0),
(9, 'Chicken Cube Fries', 'Fries topped with chicken cubes', 700, 0),
(9, 'Chicken Nuggets', 'Breaded chicken nuggets', 580, 0),
(9, 'Cheese Ball', 'Deep-fried cheese balls', 480, 0),
(9, 'Drumstick Grainted', 'Breaded chicken drumsticks', 150, 0),
(9, 'Loaded Fries - Small', 'Fries loaded with toppings, small', 1480, 0),
(9, 'Loaded Fries - Medium', 'Fries loaded with toppings, medium', 1880, 0),
(9, 'Loaded Fries - Large', 'Fries loaded with toppings, large', 2480, 1),

-- Burgers
(10, 'Chicken Burger', 'Grilled chicken patty burger', 550, 0),
(10, 'Beef Burger', 'Grilled beef patty burger', 650, 0),
(10, 'Chicken Pattie Burger', 'Crispy chicken pattie burger', 650, 0),
(10, 'Zinger Chicken Burger', 'Spicy crispy zinger chicken burger', 750, 1),

-- Buns
(11, 'Chicken Bun', 'Bun stuffed with chicken filling', 200, 0),
(11, 'Chicken Special Bun', 'Bun stuffed with special chicken filling', 230, 0),
(11, 'Beef Bun', 'Bun stuffed with beef filling', 330, 0),
(11, 'Hot Dog Bun', 'Classic hot dog bun', 300, 0),
(11, 'Egg Bun', 'Bun stuffed with egg filling', 200, 0),

-- Wraps & Submarines
(12, 'Chicken Wrap', 'Wrap filled with grilled chicken', 450, 0),
(12, 'Beef Wrap', 'Wrap filled with grilled beef', 550, 0),
(12, 'Crispy Chicken Wrap', 'Wrap filled with crispy chicken', 500, 0),
(12, 'Chicken Submarine', 'Submarine roll filled with chicken', 900, 0),
(12, 'Beef Submarine', 'Submarine roll filled with beef', 1000, 0),

-- Sandwiches
(13, 'Egg Sandwich', 'Grilled egg sandwich', 250, 0),
(13, 'Chicken Sandwich', 'Grilled chicken sandwich', 350, 0),
(13, 'Beef Sandwich', 'Grilled beef sandwich', 450, 0),
(13, 'Chicken Club Sandwich', 'Triple-decker chicken club sandwich', 750, 0),
(13, 'Beef Club Sandwich', 'Triple-decker beef club sandwich', 800, 0),
(13, 'Chicken Layer Bites', 'Layered chicken bites', 750, 0),
(13, 'Beef Layer Bites', 'Layered beef bites', 850, 0),

-- Desserts
(14, 'Gulab Jamun', 'Sweet milk-solid dumplings in syrup', 150, 0),
(14, 'Brownie', 'Chocolate brownie', 150, 0),
(14, 'Milk Cake', 'Slice of milk cake', 250, 0),
(14, 'Ice Cream', 'Scoop of ice cream', 350, 0),
(14, 'Brownie With Ice Cream', 'Warm brownie topped with ice cream', 350, 1),
(14, 'Lava Cake', 'Chocolate lava cake with molten centre', 400, 1),

-- Milkshakes
(15, 'Pineapple Milkshake', 'Blended pineapple milkshake', 600, 0),
(15, 'Avocado Milkshake', 'Blended avocado milkshake', 600, 0),
(15, 'Mango Milkshake', 'Blended mango milkshake', 600, 0),
(15, 'Vanilla Milkshake', 'Blended vanilla milkshake', 600, 0),
(15, 'Chocolate Milkshake', 'Blended chocolate milkshake', 600, 0),
(15, 'Oreo Milkshake', 'Blended Oreo milkshake', 650, 0),
(15, 'Brownie Shake', 'Blended brownie milkshake', 650, 0),
(15, 'Kit Kat Milkshake', 'Blended Kit Kat milkshake', 650, 0),
(15, 'Lava Shake', 'Rich chocolate lava milkshake', 750, 1),

-- Iced Coffee
(16, 'Regular Cold Coffee', 'Classic iced coffee', 350, 0),
(16, 'Vanilla Cold Coffee', 'Iced coffee with vanilla', 500, 0),
(16, 'Chocolate Cold Coffee', 'Iced coffee with chocolate', 500, 0),
(16, 'Oreo Cold Coffee', 'Iced coffee blended with Oreo', 550, 0),
(16, 'Kit Kat Cold Coffee', 'Iced coffee blended with Kit Kat', 600, 1),

-- Bubble Tea
(17, 'Bubble Tea Coffee', 'Milk tea with tapioca pearls, coffee flavour', 700, 0),
(17, 'Bubble Tea Mango', 'Milk tea with tapioca pearls, mango flavour', 700, 0),
(17, 'Bubble Tea Strawberry', 'Milk tea with tapioca pearls, strawberry flavour', 700, 1),
(17, 'Bubble Tea Blueberry', 'Milk tea with tapioca pearls, blueberry flavour', 700, 0),

-- Smoothies
(18, 'Mixed Fruit Salad', 'Fresh mixed fruit salad', 500, 0),
(18, 'Pineapple Smoothie', 'Fresh pineapple smoothie', 500, 0),
(18, 'Mango Smoothie', 'Fresh mango smoothie', 500, 1),
(18, 'Avocado Smoothie', 'Fresh avocado smoothie', 500, 0),

-- Chai & Tea
(19, 'Masala Chai', 'Signature Mr. Chai masala chai', 150, 1),
(19, 'Cardamom Chai', 'Chai brewed with cardamom', 150, 0),
(19, 'Cinnamon Chai', 'Chai brewed with cinnamon', 150, 0),
(19, 'Black Tea', 'Classic black tea', 50, 0),
(19, 'Mint Black Tea', 'Black tea with mint', 50, 0),
(19, 'Ginger Black Tea', 'Black tea with ginger', 50, 0),
(19, 'Lime Tea', 'Black tea with lime', 50, 0);
