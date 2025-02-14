-- Sample data for devices
INSERT INTO devices (brand_id, category_id, model_name, storage_size, dpp_price, is_preowned, end_date) VALUES
(1, 1, 'iPhone 16', '128GB', 840.00, false, '2025-03-31'),
(1, 1, 'iPhone 16', '256GB', 940.00, false, '2025-03-31'),
(1, 1, 'iPhone 16 Pro', '128GB', 1010.00, false, '2025-03-31'),
(2, 1, 'Galaxy S24', '128GB', 818.00, false, '2025-03-31'),
(2, 1, 'Galaxy S24 Ultra', '256GB', 1299.00, false, '2025-03-31'),
(3, 1, 'Pixel 9', '128GB', 806.00, false, '2025-03-31');

-- Sample data for plans
INSERT INTO plans (name, type, price, is_business) VALUES
('Welcome Unlimited', 'Consumer', NULL, false),
('Unlimited Plus', 'Consumer', NULL, false),
('Unlimited Ultimate', 'Consumer', NULL, false),
('Business Pro', 'Business', NULL, true);

-- Sample data for accessories
INSERT INTO accessories (category, brand, name, msrp, contribution) VALUES
('Screen Protection', 'PureGear', 'Liquid Glass', 66.99, 63.04),
('Cases', 'Case-Mate', 'Karat Magsafe', 56.99, 37.48),
('Power', 'PureGear', '42W Dual PD Car / Wall Charger', 46.99, 36.49),
('Audio', 'JLab', 'True Wireless JBuds Mini - Black', 41.99, 15.12);

-- Sample data for contributions/spiffs
INSERT INTO contributions (device_id, plan_id, type, amount, upgrade_amount, new_line_amount, spiff_amount, end_date) VALUES
(1, 1, 'Welcome_Unlimited', 15.00, 15.00, 35.00, 75.00, '2025-03-31'),
(1, 2, 'Unlimited_Plus', 15.00, 35.00, 35.00, 75.00, '2025-03-31'),
(2, 1, 'Welcome_Unlimited', 15.00, 15.00, 35.00, 75.00, '2025-03-31');

-- Sample data for services
INSERT INTO services (name, category, base_price, contribution, spiff_amount, end_date) VALUES
('Verizon Mobile Protect Single New', 'Protection', NULL, 30.00, 45.00, '2025-02-28'),
('Verizon Home Internet', 'Internet', NULL, 50.00, 100.00, '2025-03-31'),
('Set Up and Go- Smartphone', 'Setup', 39.99, 39.99, NULL, '2025-03-31');

-- Sample data for business services
INSERT INTO business_services (name, contribution_per_line, contribution_spiff, total_contribution) VALUES
('One Talk Auto Receptionist', 50.00, NULL, 50.00),
('Device Payment One Talk Activation', 50.00, 75.00, 125.00),
('Connect Reveal', 100.00, 25.00, 125.00);

-- Sample data for hot deals
INSERT INTO hot_deals (device_id, discount_amount, spiff_amount, new_dpp_price, welcome_unlimited_upgrade, 
                      unlimited_plus_upgrade, welcome_unlimited_new, unlimited_plus_new, end_date) VALUES
(1, 160.00, 100.00, 450.00, 15.00, 35.00, 35.00, 75.00, '2025-03-31');

-- Add example query to show device pricing with contributions
COMMENT ON DATABASE veriplan IS 'Example query to get device pricing with contributions:
SELECT d.model_name, d.storage_size, d.dpp_price, 
       c.upgrade_amount, c.new_line_amount, c.spiff_amount
FROM devices d
JOIN contributions c ON d.device_id = c.device_id
WHERE d.end_date >= CURRENT_DATE;';