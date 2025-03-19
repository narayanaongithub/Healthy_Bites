USE subscription_db;

CREATE TABLE IF NOT EXISTS subscription (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    status VARCHAR(20) DEFAULT 'active',
    auto_renew BOOLEAN DEFAULT TRUE,
    price FLOAT DEFAULT 9.99,
    discount_percent FLOAT DEFAULT 15.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    card_last_four VARCHAR(4),
    card_type VARCHAR(20),
    expiry_month VARCHAR(2),
    expiry_year VARCHAR(4),
    card_name VARCHAR(100)
);

ALTER DATABASE subscription_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; 