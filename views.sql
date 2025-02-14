-- View for current device pricing and contributions
CREATE VIEW current_device_pricing AS
SELECT 
    b.name AS brand,
    d.model_name,
    d.storage_size,
    d.dpp_price,
    c.upgrade_amount,
    c.new_line_amount,
    c.spiff_amount,
    d.end_date
FROM devices d
JOIN brands b ON d.brand_id = b.brand_id
LEFT JOIN contributions c ON d.device_id = c.device_id
WHERE d.end_date >= CURRENT_DATE;

-- View for hot deals summary
CREATE VIEW hot_deals_summary AS
SELECT 
    b.name AS brand,
    d.model_name,
    d.storage_size,
    d.dpp_price AS original_price,
    h.new_dpp_price AS discounted_price,
    h.discount_amount,
    h.spiff_amount,
    h.end_date
FROM hot_deals h
JOIN devices d ON h.device_id = d.device_id
JOIN brands b ON d.brand_id = b.brand_id
WHERE h.end_date >= CURRENT_DATE;

-- View for accessories pricing
CREATE VIEW accessories_summary AS
SELECT 
    category,
    brand,
    name,
    msrp AS retail_price,
    contribution AS dealer_contribution,
    (msrp - contribution) AS margin,
    ROUND((contribution / msrp * 100), 2) AS margin_percentage
FROM accessories
ORDER BY category, brand, name;

-- View for business services and contributions
CREATE VIEW business_services_summary AS
SELECT 
    name,
    contribution_per_line,
    contribution_spiff,
    total_contribution,
    end_date
FROM business_services
WHERE end_date IS NULL OR end_date >= CURRENT_DATE;

-- View for preowned device inventory
CREATE VIEW preowned_devices AS
SELECT 
    b.name AS brand,
    d.model_name,
    d.storage_size,
    d.color,
    d.dpp_price,
    c.spiff_amount,
    d.end_date
FROM devices d
JOIN brands b ON d.brand_id = b.brand_id
LEFT JOIN contributions c ON d.device_id = c.device_id
WHERE d.is_preowned = true
AND (d.end_date IS NULL OR d.end_date >= CURRENT_DATE);

-- View for service contributions
CREATE VIEW service_contributions AS
SELECT 
    name,
    category,
    base_price,
    contribution,
    spiff_amount,
    (contribution + COALESCE(spiff_amount, 0)) AS total_contribution,
    end_date
FROM services
WHERE end_date IS NULL OR end_date >= CURRENT_DATE
ORDER BY category, name;

-- Add indexes to improve view performance
CREATE INDEX idx_devices_end_date ON devices(end_date);
CREATE INDEX idx_hot_deals_end_date ON hot_deals(end_date);
CREATE INDEX idx_services_end_date ON services(end_date);