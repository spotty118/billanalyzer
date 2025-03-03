-- [Previous brand, category, and base device inserts remain the same...]

-- Clear previous contribution data
TRUNCATE TABLE contributions;

-- Insert device contributions for smartphones
INSERT INTO contributions (device_id, plan_id, type, amount, upgrade_amount, new_line_amount, spiff_amount, end_date)
SELECT 
    d.device_id,
    p.plan_id,
    CASE 
        WHEN p.name = 'Welcome Unlimited' THEN 'Welcome'
        WHEN p.name = 'Unlimited Plus' THEN 'Plus'
        WHEN p.name = 'Unlimited Ultimate' THEN 'Ultimate'
    END,
    15.00, -- Base contribution
    CASE 
        WHEN p.name = 'Welcome Unlimited' THEN 15.00
        WHEN p.name = 'Unlimited Plus' THEN 35.00
        WHEN p.name = 'Unlimited Ultimate' THEN 35.00
    END,
    CASE 
        WHEN p.name = 'Welcome Unlimited' THEN 35.00
        WHEN p.name = 'Unlimited Plus' THEN 75.00
        WHEN p.name = 'Unlimited Ultimate' THEN 75.00
    END,
    CASE 
        WHEN b.name = 'Apple' THEN 100.00
        WHEN b.name IN ('Samsung', 'Google') THEN 100.00
        ELSE 50.00
    END,
    '2025-03-31'
FROM devices d
JOIN brands b ON d.brand_id = b.brand_id
CROSS JOIN plans p
WHERE d.category_id = 1 -- Smartphones
AND p.type = 'Consumer';

-- Insert tablet contributions
INSERT INTO contributions (device_id, plan_id, type, amount, upgrade_amount, new_line_amount, spiff_amount, end_date)
SELECT 
    d.device_id,
    p.plan_id,
    'Tablet',
    25.00, -- Base contribution
    25.00, -- Upgrade amount
    25.00, -- New line amount
    50.00, -- Spiff amount
    '2025-03-31'
FROM devices d
JOIN brands b ON d.brand_id = b.brand_id
CROSS JOIN plans p
WHERE d.category_id = 2 -- Tablets
AND p.type = 'Consumer';

-- Insert watch contributions
INSERT INTO contributions (device_id, plan_id, type, amount, upgrade_amount, new_line_amount, spiff_amount, end_date)
VALUES
-- Apple Watches
(SELECT d.device_id, p.plan_id, 'Watch', 25.00, 25.00, 25.00, 50.00, '2025-03-31'
FROM devices d
JOIN brands b ON d.brand_id = b.brand_id
CROSS JOIN plans p
WHERE b.name = 'Apple' AND d.model_name LIKE '%Watch%' AND p.type = 'Consumer'),

-- Samsung Watches
(SELECT d.device_id, p.plan_id, 'Watch', 25.00, 25.00, 25.00, 50.00, '2025-03-31'
FROM devices d
JOIN brands b ON d.brand_id = b.brand_id
CROSS JOIN plans p
WHERE b.name = 'Samsung' AND d.model_name LIKE '%Watch%' AND p.type = 'Consumer');

-- Update services contributions
UPDATE services 
SET contribution = 30.00, spiff_amount = 45.00 
WHERE name LIKE '%Mobile Protect%' AND end_date = '2025-02-28';

UPDATE services 
SET contribution = 50.00, spiff_amount = 100.00 
WHERE name LIKE '%Home Internet%' AND name NOT LIKE '%Plus%' AND end_date = '2025-03-31';

UPDATE services 
SET contribution = 100.00, spiff_amount = 120.00 
WHERE name LIKE '%Home Internet Plus%' AND end_date = '2025-03-31';

-- Insert specific hot deals from the matrix
INSERT INTO hot_deals (device_id, discount_amount, spiff_amount, new_dpp_price, 
                      welcome_unlimited_upgrade, unlimited_plus_upgrade, 
                      welcome_unlimited_new, unlimited_plus_new, end_date)
SELECT 
    d.device_id,
    CASE 
        WHEN d.model_name LIKE '%iPhone 12%' THEN 160.00
        WHEN d.model_name LIKE '%iPhone 14%' THEN 390.00
        WHEN d.model_name LIKE '%S23%' THEN 350.00
        WHEN d.model_name LIKE '%Pixel 7%' THEN 370.00
    END as discount_amount,
    100.00 as spiff_amount,
    CASE 
        WHEN d.model_name LIKE '%iPhone 12%' THEN 450.00
        WHEN d.model_name LIKE '%iPhone 14%' THEN 450.00
        WHEN d.model_name LIKE '%S23%' THEN 365.00
        WHEN d.model_name LIKE '%Pixel 7%' THEN 350.00
    END as new_dpp_price,
    15.00 as welcome_unlimited_upgrade,
    35.00 as unlimited_plus_upgrade,
    35.00 as welcome_unlimited_new,
    75.00 as unlimited_plus_new,
    '2025-03-31' as end_date
FROM devices d
JOIN brands b ON d.brand_id = b.brand_id
WHERE d.model_name IN (
    'iPhone 12 64GB', 'iPhone 14 Plus 128GB',
    'Galaxy S23 128GB', 'Pixel 7 128GB'
);

-- Business service contributions remain the same as they were correctly imported initially

-- Accessories contributions and margins are already correct from initial import

-- Add MTM Secondary Sim/ESIM contributions
CREATE TABLE IF NOT EXISTS secondary_sim_pricing (
    plan_type VARCHAR(50),
    base_amount DECIMAL(10,2),
    spiff_amount DECIMAL(10,2),
    price_plan_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    end_date DATE
);

INSERT INTO secondary_sim_pricing VALUES
('Welcome', 0.00, 0.00, 0.00, 0.00, '2025-03-31'),
('Plus', 0.00, 0.00, 40.00, 40.00, '2025-03-31'),
('Ultimate', 0.00, 0.00, 40.00, 40.00, '2025-03-31'),
('2nd Number', 40.00, 10.00, 0.00, 50.00, '2025-03-31');

-- Add Redux pricing
CREATE TABLE IF NOT EXISTS redux_pricing (
    service_type VARCHAR(100),
    price DECIMAL(10,2),
    end_date DATE
);

INSERT INTO redux_pricing VALUES
('Redux Family Membership', 35.99, '2025-03-31'),
('Redux Single Line Membership', 20.00, '2025-03-31'),
('Redux for Business Lines 1-24', 99.99, '2025-03-31'),
('Redux for Business Lines 25-40', 149.99, '2025-03-31'),
('Redux for Business Lines 51+', 199.99, '2025-03-31');