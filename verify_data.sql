-- View to verify device contributions and spiffs
CREATE VIEW verify_device_contributions AS
SELECT 
    b.name as brand,
    d.model_name,
    d.storage_size,
    d.dpp_price,
    p.name as plan,
    c.type,
    c.amount as base_contribution,
    c.upgrade_amount,
    c.new_line_amount,
    c.spiff_amount,
    c.end_date,
    hd.discount_amount,
    hd.new_dpp_price as hot_deal_price
FROM devices d
LEFT JOIN brands b ON d.brand_id = b.brand_id
LEFT JOIN contributions c ON d.device_id = c.device_id
LEFT JOIN plans p ON c.plan_id = p.plan_id
LEFT JOIN hot_deals hd ON d.device_id = hd.device_id;

-- View to verify service contributions
CREATE VIEW verify_service_contributions AS
SELECT 
    name,
    category,
    base_price,
    contribution,
    spiff_amount,
    (contribution + COALESCE(spiff_amount, 0)) as total_contribution,
    end_date
FROM services
ORDER BY category, name;

-- View to verify business service contributions
CREATE VIEW verify_business_contributions AS
SELECT 
    name,
    contribution_per_line,
    contribution_spiff,
    total_contribution,
    end_date
FROM business_services
ORDER BY total_contribution DESC;

-- View to verify accessory margins
CREATE VIEW verify_accessory_margins AS
SELECT 
    category,
    brand,
    name,
    msrp,
    contribution,
    (msrp - contribution) as margin,
    ROUND((contribution / msrp * 100), 2) as margin_percentage
FROM accessories
ORDER BY category, brand, name;

-- View to verify secondary SIM pricing
CREATE VIEW verify_secondary_sim AS
SELECT 
    plan_type,
    base_amount,
    spiff_amount,
    price_plan_amount,
    total_amount,
    end_date
FROM secondary_sim_pricing
ORDER BY total_amount;

-- View to verify Redux pricing
CREATE VIEW verify_redux_pricing AS
SELECT *
FROM redux_pricing
ORDER BY price;

-- Verification queries

-- 1. Check for devices without contributions
SELECT b.name, d.model_name, d.storage_size
FROM devices d
JOIN brands b ON d.brand_id = b.brand_id
LEFT JOIN contributions c ON d.device_id = c.device_id
WHERE c.contribution_id IS NULL;

-- 2. Verify hot deal amounts match matrix
SELECT 
    b.name, 
    d.model_name,
    hd.discount_amount,
    hd.new_dpp_price,
    d.dpp_price - hd.discount_amount as calculated_price,
    CASE 
        WHEN hd.new_dpp_price = (d.dpp_price - hd.discount_amount) THEN 'OK'
        ELSE 'MISMATCH'
    END as price_check
FROM hot_deals hd
JOIN devices d ON hd.device_id = d.device_id
JOIN brands b ON d.brand_id = b.brand_id;

-- 3. Check service contribution totals
SELECT 
    name,
    contribution + COALESCE(spiff_amount, 0) as calculated_total,
    end_date,
    CASE 
        WHEN name LIKE '%Mobile Protect%' AND contribution + COALESCE(spiff_amount, 0) != 75.00 THEN 'CHECK'
        WHEN name LIKE '%Home Internet Plus%' AND contribution + COALESCE(spiff_amount, 0) != 220.00 THEN 'CHECK'
        ELSE 'OK'
    END as validation
FROM services
WHERE end_date IS NOT NULL;

-- Helper function to validate data
CREATE OR REPLACE FUNCTION validate_contribution_data()
RETURNS TABLE (
    category text,
    total_records bigint,
    missing_contributions bigint,
    invalid_amounts bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Devices' as category,
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE NOT EXISTS (
            SELECT 1 FROM contributions c WHERE c.device_id = d.device_id
        )) as missing_contributions,
        COUNT(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM contributions c 
            WHERE c.device_id = d.device_id 
            AND (c.amount < 0 OR c.upgrade_amount < 0 OR c.new_line_amount < 0)
        )) as invalid_amounts
    FROM devices d
    UNION ALL
    SELECT 
        'Services',
        COUNT(*),
        COUNT(*) FILTER (WHERE contribution IS NULL),
        COUNT(*) FILTER (WHERE contribution < 0 OR spiff_amount < 0)
    FROM services
    UNION ALL
    SELECT 
        'Business Services',
        COUNT(*),
        COUNT(*) FILTER (WHERE contribution_per_line IS NULL),
        COUNT(*) FILTER (WHERE contribution_per_line < 0 OR COALESCE(contribution_spiff, 0) < 0)
    FROM business_services;
END;
$$ LANGUAGE plpgsql;

-- Usage:
-- SELECT * FROM validate_contribution_data();