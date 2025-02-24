-- Update Verizon plans with latest pricing and features from February 2025
-- First, create the verizon_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS verizon_plans (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    price_1_line DECIMAL(10,2) NOT NULL,
    price_2_line DECIMAL(10,2) NOT NULL,
    price_3_line DECIMAL(10,2) NOT NULL,
    price_4_line DECIMAL(10,2) NOT NULL,
    price_5plus_line DECIMAL(10,2) NOT NULL,
    features JSONB NOT NULL,
    type VARCHAR(50) NOT NULL,
    data_allowance JSONB NOT NULL,
    streaming_quality VARCHAR(20) NOT NULL,
    autopay_discount DECIMAL(10,2),
    paperless_discount DECIMAL(10,2),
    plan_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delete existing Verizon plans to avoid duplicates
DELETE FROM verizon_plans 
WHERE external_id IN ('unlimited-ultimate', 'unlimited-plus', 'unlimited-welcome');

-- Insert updated Unlimited Ultimate plan
INSERT INTO verizon_plans (
    external_id, 
    name, 
    base_price, 
    price_1_line, 
    price_2_line, 
    price_3_line, 
    price_4_line, 
    price_5plus_line, 
    features, 
    type, 
    data_allowance, 
    streaming_quality, 
    autopay_discount, 
    paperless_discount, 
    plan_level
) VALUES (
    'unlimited-ultimate',
    'Unlimited Ultimate',
    100.00,
    100.00,
    90.00,
    75.00,
    65.00,
    65.00,
    '[
        "5G Ultra Wideband (5X faster than regular 5G)",
        "Unlimited premium data",
        "60 GB Mobile Hotspot data",
        "Up to 50% off 2 watch, tablet, hotspot or Hum plans",
        "International data, calling & texting in 210+ countries",
        "Global Choice (choose one country for 300 minutes of calling)",
        "Enhanced Video Calling",
        "Ultimate Phone Upgrade eligibility"
    ]',
    'consumer',
    '{"premium": "unlimited", "hotspot": 60}',
    '1080p',
    10.00,
    0.00,
    'unlimited'
);

-- Insert updated Unlimited Plus plan
INSERT INTO verizon_plans (
    external_id, 
    name, 
    base_price, 
    price_1_line, 
    price_2_line, 
    price_3_line, 
    price_4_line, 
    price_5plus_line, 
    features, 
    type, 
    data_allowance, 
    streaming_quality, 
    autopay_discount, 
    paperless_discount, 
    plan_level
) VALUES (
    'unlimited-plus',
    'Unlimited Plus',
    90.00,
    90.00,
    80.00,
    65.00,
    55.00,
    55.00,
    '[
        "5G Ultra Wideband (5X faster than regular 5G)",
        "Unlimited premium data",
        "30 GB Mobile Hotspot data",
        "Up to 50% off 1 watch, tablet, hotspot or Hum plan",
        "Mexico & Canada talk, text and data"
    ]',
    'consumer',
    '{"premium": "unlimited", "hotspot": 30}',
    '720p',
    10.00,
    0.00,
    'plus'
);

-- Insert updated Unlimited Welcome plan
INSERT INTO verizon_plans (
    external_id, 
    name, 
    base_price, 
    price_1_line, 
    price_2_line, 
    price_3_line, 
    price_4_line, 
    price_5plus_line, 
    features, 
    type, 
    data_allowance, 
    streaming_quality, 
    autopay_discount, 
    paperless_discount, 
    plan_level
) VALUES (
    'unlimited-welcome',
    'Unlimited Welcome',
    75.00,
    75.00,
    65.00,
    50.00,
    40.00,
    40.00,
    '[
        "5G network access",
        "Mexico & Canada talk, text and data"
    ]',
    'consumer',
    '{"premium": 0, "hotspot": 0}',
    '480p',
    10.00,
    0.00,
    'welcome'
);

-- Update the timestamp
UPDATE verizon_plans SET updated_at = CURRENT_TIMESTAMP;

-- Verify the data
SELECT 
    external_id, 
    name, 
    price_1_line, 
    price_2_line, 
    price_3_line, 
    price_4_line, 
    price_5plus_line, 
    plan_level
FROM verizon_plans
WHERE external_id IN ('unlimited-ultimate', 'unlimited-plus', 'unlimited-welcome')
ORDER BY base_price DESC;
