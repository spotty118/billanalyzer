-- Update Verizon device contributions with latest data from February 2025
CREATE TABLE IF NOT EXISTS device_contributions (
    id SERIAL PRIMARY KEY,
    device_name VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(50) NOT NULL,
    dpp_price DECIMAL(10,2),
    base_spiff DECIMAL(10,2),
    welcome_unlimited_upgrade DECIMAL(10,2),
    plus_ultimate_upgrade DECIMAL(10,2),
    welcome_unlimited_new DECIMAL(10,2),
    plus_ultimate_new DECIMAL(10,2),
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delete existing contributions
DELETE FROM device_contributions;

-- iPhone Contributions
INSERT INTO device_contributions (
    device_name, manufacturer, dpp_price,
    base_spiff, welcome_unlimited_upgrade, plus_ultimate_upgrade,
    welcome_unlimited_new, plus_ultimate_new, end_date
) VALUES
-- iPhone 16 Family
('iPhone 16 128GB', 'Apple', 840.00, 15.00, 15.00, 35.00, 35.00, 75.00, '2025-03-31'),
('iPhone 16 256GB', 'Apple', 940.00, 15.00, 15.00, 35.00, 35.00, 75.00, '2025-03-31'),
('iPhone 16 512GB', 'Apple', 1140.00, 15.00, 15.00, 35.00, 35.00, 75.00, '2025-03-31'),
('iPhone 16 Plus 128GB', 'Apple', 940.00, 15.00, 15.00, 35.00, 35.00, 75.00, '2025-03-31'),
('iPhone 16 Plus 256GB', 'Apple', 1040.00, 15.00, 15.00, 35.00, 35.00, 75.00, '2025-03-31'),
('iPhone 16 Plus 512GB', 'Apple', 1240.00, 15.00, 15.00, 35.00, 35.00, 75.00, '2025-03-31'),
('iPhone 16 Pro 128GB', 'Apple', 1010.00, 15.00, 15.00, 35.00, 35.00, 75.00, '2025-03-31'),
('iPhone 16 Pro 256GB', 'Apple', 1110.00, 15.00, 15.00, 35.00, 35.00, 75.00, '2025-03-31'),
('iPhone 16 Pro 512GB', 'Apple', 1310.00, 15.00, 15.00, 35.00, 35.00, 75.00, '2025-03-31'),
('iPhone 16 Pro 1TB', 'Apple', 1510.00, 15.00, 15.00, 35.00, 35.00, 75.00, '2025-03-31'),
('iPhone 16 Pro Max 256GB', 'Apple', 1110.00, 15.00, 15.00, 35.00, 35.00, 75.00, '2025-03-31'),
('iPhone 16 Pro Max 512GB', 'Apple', 1310.00, 15.00, 15.00, 35.00, 35.00, 75.00, '2025-03-31'),
('iPhone 16 Pro Max 1TB', 'Apple', 1610.00, 15.00, 15.00, 35.00, 35.00, 75.00, '2025-03-31'),

-- Google Pixel Family
('Pixel 9 128GB', 'Google', 806.00, 0.00, 45.00, 65.00, 100.00, 140.00, '2025-03-31'),
('Pixel 9 256GB', 'Google', 900.00, 0.00, 45.00, 65.00, 100.00, 140.00, '2025-03-31'),
('Pixel 9 Pro 128GB', 'Google', 999.99, 0.00, 45.00, 65.00, 100.00, 140.00, '2025-03-31'),
('Pixel 9 Pro 256GB', 'Google', 1099.99, 0.00, 45.00, 65.00, 100.00, 140.00, '2025-03-31'),
('Pixel 9 Pro 512GB', 'Google', 1219.99, 0.00, 45.00, 65.00, 100.00, 140.00, '2025-03-31'),
('Pixel 9 Pro XL 256GB', 'Google', 1199.99, 0.00, 45.00, 65.00, 100.00, 140.00, '2025-03-31'),
('Pixel 9 Pro XL 512GB', 'Google', 1319.99, 0.00, 45.00, 65.00, 100.00, 140.00, '2025-03-31'),
('Pixel 9 Pro Fold 256GB', 'Google', 1799.99, 0.00, 45.00, 65.00, 100.00, 140.00, '2025-03-31'),

-- Samsung Galaxy Family
('Galaxy S24 128GB', 'Samsung', 818.00, 0.00, 45.00, 65.00, 100.00, 140.00, '2025-03-31'),
('Galaxy S24 256GB', 'Samsung', 875.00, 0.00, 45.00, 65.00, 100.00, 140.00, '2025-03-31'),
('Galaxy S24 Plus 256GB', 'Samsung', 1010.00, 0.00, 45.00, 65.00, 100.00, 140.00, '2025-03-31'),
('Galaxy S24 Plus 512GB', 'Samsung', 1125.00, 0.00, 45.00, 65.00, 100.00, 140.00, '2025-03-31'),
('Galaxy S24 Ultra 256GB', 'Samsung', 1299.00, 0.00, 45.00, 65.00, 100.00, 140.00, '2025-03-31'),
('Galaxy S24 Ultra 512GB', 'Samsung', 1419.00, 0.00, 45.00, 65.00, 100.00, 140.00, '2025-03-31'),
('Galaxy S24 FE', 'Samsung', 667.00, 0.00, 45.00, 65.00, 100.00, 140.00, '2025-03-31'),
('Galaxy Z Flip6', 'Samsung', 1117.00, 0.00, 45.00, 65.00, 100.00, 140.00, '2025-03-31'),
('Galaxy Z Fold6', 'Samsung', 1899.99, 0.00, 45.00, 65.00, 100.00, 140.00, '2025-03-31'),
('Galaxy A14', 'Samsung', 240.00, 0.00, 45.00, 65.00, 100.00, 140.00, '2025-03-31');

-- Create Services and Features contributions table
CREATE TABLE IF NOT EXISTS service_contributions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    contribution DECIMAL(10,2),
    spiff DECIMAL(10,2),
    total_contribution DECIMAL(10,2),
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delete existing service contributions
DELETE FROM service_contributions;

-- Insert service contributions
INSERT INTO service_contributions (name, category, contribution, spiff, total_contribution, end_date) VALUES
-- Perks
('VZ Perks', 'Perks', 20.00, 15.00, 35.00, '2025-03-31'),
('3rd Party Perks', 'Perks', 10.00, 25.00, 35.00, '2025-03-31'),

-- Home Internet
('MTM LTE Home Internet', 'Home Internet', 50.00, 100.00, 150.00, '2025-03-31'),
('MTM LTE Home Internet Plus', 'Home Internet', 100.00, 120.00, 220.00, '2025-03-31'),
('MTM 5G Home Internet', 'Home Internet', 50.00, 100.00, 150.00, '2025-03-31'),
('MTM 5G Home Internet Plus', 'Home Internet', 100.00, 120.00, 220.00, '2025-03-31'),
('Backup Router', 'Home Internet', 60.00, 0.00, 60.00, '2025-03-31'),

-- Business Internet
('5G Business Internet 100M', 'Business Internet', 260.00, 0.00, 260.00, NULL),
('5G Business Internet 200M', 'Business Internet', 300.00, 0.00, 300.00, NULL),
('5G Business Internet 400M', 'Business Internet', 320.00, 0.00, 320.00, NULL),
('4G LTE Internet Backup 1GB', 'Business Internet', 60.00, 0.00, 60.00, NULL),
('5G LTE Internet Backup 250MB', 'Business Internet', 50.00, 0.00, 50.00, NULL),

-- Protection Services
('Verizon Home Device Protect', 'Protection', 15.00, 60.00, 75.00, '2025-03-31'),
('Verizon Home Advisor', 'Protection', 20.00, 0.00, 20.00, NULL),
('Verizon Mobile Protect SL & MD Open Enrollment', 'Protection', 45.00, 0.00, 45.00, NULL),
('Verizon Mobile Protect Multi-Device New', 'Protection', 30.00, 45.00, 75.00, '2025-02-28'),
('Verizon Mobile Protect Single New', 'Protection', 30.00, 45.00, 75.00, '2025-02-28'),
('Verizon Protect Single (New York)', 'Protection', 55.00, 0.00, 55.00, NULL),
('Verizon Protect Multi Device (New York)', 'Protection', 55.00, 0.00, 55.00, NULL),

-- Redux Services
('Redux Family Membership', 'Redux', 35.99, 0.00, 35.99, NULL),
('Redux Single Line Membership', 'Redux', 20.00, 0.00, 20.00, NULL),

-- Eargo Services
('Eargo 7 Sale (instore)', 'Eargo', 700.00, 0.00, 700.00, '2025-03-31'),
('Eargo 7 Sale (eargo website)', 'Eargo', 300.00, 0.00, 300.00, '2025-03-31'),
('Completed Eargo Welcome Call', 'Eargo', 300.00, 0.00, 300.00, '2025-03-31'),
('Eargo Link Sale', 'Eargo', 281.00, 0.00, 281.00, '2025-03-31');

-- Update timestamps
UPDATE device_contributions SET updated_at = CURRENT_TIMESTAMP;
UPDATE service_contributions SET updated_at = CURRENT_TIMESTAMP;

-- Verify the data
SELECT 
    device_name,
    manufacturer,
    dpp_price,
    base_spiff,
    welcome_unlimited_upgrade,
    plus_ultimate_upgrade,
    welcome_unlimited_new,
    plus_ultimate_new,
    end_date
FROM device_contributions
ORDER BY manufacturer, dpp_price DESC;

SELECT 
    name,
    category,
    contribution,
    spiff,
    total_contribution,
    end_date
FROM service_contributions
ORDER BY category, total_contribution DESC;
