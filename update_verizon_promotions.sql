-- Update Verizon promotions with latest deals from February 2025
CREATE TABLE IF NOT EXISTS verizon_promotions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[] NOT NULL,
    value DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delete existing promotions to avoid duplicates
DELETE FROM verizon_promotions;

-- Phone Promotions
INSERT INTO verizon_promotions (title, category, description, requirements, value, end_date) VALUES
-- iPhone Deals
('iPhone 16 Pro Bundle', 'phones', 
 'iPhone 16 Pro, iPad and Apple Watch Series 10, all on us', 
 ARRAY['Any phone trade-in required', 'New line on myPlan', 'Service plan required for iPad and Apple Watch'],
 2000.00, '2025-03-31'),

('iPhone 16 Pro Online Offer', 'phones',
 'Get iPhone 16 Pro on us',
 ARRAY['Online only', 'New line on Unlimited Ultimate required'],
 999.99, '2025-03-31'),

('iPhone 16 Online Offer', 'phones',
 'Get iPhone 16 on us',
 ARRAY['Online only', 'New line on select Unlimited plans', 'No trade-in required'],
 799.99, '2025-03-31'),

-- Samsung Deals
('Samsung Galaxy S25+ Offer', 'phones',
 'Samsung Galaxy S25+ on us',
 ARRAY['Phone trade-in required (any condition guaranteed)', 'New line on myPlan'],
 999.99, '2025-03-31'),

('Samsung Galaxy S25 Online Offer', 'phones',
 'Samsung Galaxy S25 on us',
 ARRAY['Online only', 'New line on select Unlimited plans'],
 899.99, '2025-03-31'),

('Samsung Galaxy S24 FE Offer', 'phones',
 'Samsung Galaxy S24 FE on us',
 ARRAY['New line on myPlan required'],
 699.99, '2025-03-31'),

-- Google Deals
('Google Pixel 9 Pro Offer', 'phones',
 'Google Pixel 9 Pro on us',
 ARRAY['Online only', 'New line on Unlimited Ultimate required'],
 899.99, '2025-03-31');

-- Tablet & Watch Promotions
INSERT INTO verizon_promotions (title, category, description, requirements, value, end_date) VALUES
('iPad Bundle Offer', 'tablets',
 'Get iPad on us',
 ARRAY['Purchase of select iPhone required', 'iPhone purchase with myPlan required first', 'Service plan required for iPad'],
 599.99, '2025-03-31'),

('Samsung Galaxy Tab S9 FE Bundle', 'tablets',
 'Get Samsung Galaxy Tab S9 FE on us',
 ARRAY['Purchase of select Android phone required', 'Phone purchase with myPlan required first', 'Service plan required for tablet'],
 499.99, '2025-03-31'),

('Apple Watch Series 10 Offer', 'watches',
 'Apple Watch Series 10 for as low as $9/mo',
 ARRAY['Select watch trade-in required', 'Service plan required for watch'],
 400.00, '2025-03-31'),

('Samsung Galaxy Watch Ultra', 'watches',
 'Get Samsung Galaxy Watch Ultra on us',
 ARRAY['Select watch trade-in required', 'Service plan required for watch'],
 449.99, '2025-03-31');

-- Accessory Promotions
INSERT INTO verizon_promotions (title, category, description, requirements, value, end_date) VALUES
('Accessory Essential Bundle', 'accessories',
 'Get an Accessory Essential Bundle for just $100',
 ARRAY['Limited time only'],
 100.00, '2025-03-31'),

('Samsung Galaxy Buds3 Pro Offer', 'accessories',
 'Save $100 on Samsung Galaxy Buds3 Pro',
 ARRAY['Purchase of new Galaxy S25 Series required'],
 100.00, '2025-03-31'),

('Google Pixel Buds Pro 2 Offer', 'accessories',
 'Get $100 off Google Pixel Buds Pro 2',
 ARRAY['Purchase of select Google Pixel phones required', 'Only at Verizon'],
 100.00, '2025-03-31');

-- Service Discounts
INSERT INTO verizon_promotions (title, category, description, requirements, value, end_date) VALUES
('Mobile + Home Bundle Savings', 'service_discounts',
 'Save up to $300 a year with mobile & home',
 ARRAY['Select home internet plans', 'Select 5G mobile plans'],
 300.00, '2025-12-31'),

('BYOD Credit or Free Watch', 'service_discounts',
 'Bring your phone, get up to $540 or get a smartwatch on us',
 ARRAY['New line on myPlan required', 'Service plan required for smartwatch'],
 540.00, '2025-03-31'),

('Military Discount', 'service_discounts',
 'Save up to $25/mo on myPlan plus exclusive Fios Home Internet savings',
 ARRAY['Military status verification required'],
 300.00, '2025-12-31'),

('Student Discount', 'service_discounts',
 'Save up to $25/mo on myPlan plus exclusive Fios Home Internet savings',
 ARRAY['Student status verification required'],
 300.00, '2025-12-31');

-- Update timestamps
UPDATE verizon_promotions SET updated_at = CURRENT_TIMESTAMP;

-- Verify the data
SELECT 
    title,
    category,
    value,
    array_to_string(requirements, ', ') as requirements,
    end_date
FROM verizon_promotions
ORDER BY category, value DESC;
