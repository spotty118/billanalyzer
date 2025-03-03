-- Create Brands table
CREATE TABLE brands (
    brand_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Create Device Categories table
CREATE TABLE device_categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Create Devices table
CREATE TABLE devices (
    device_id SERIAL PRIMARY KEY,
    brand_id INTEGER REFERENCES brands(brand_id),
    category_id INTEGER REFERENCES device_categories(category_id),
    model_name VARCHAR(100) NOT NULL,
    storage_size VARCHAR(20),
    color VARCHAR(50),
    dpp_price DECIMAL(10,2),
    is_preowned BOOLEAN DEFAULT false,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Plans table
CREATE TABLE plans (
    plan_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    price DECIMAL(10,2),
    is_business BOOLEAN DEFAULT false,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Accessories table
CREATE TABLE accessories (
    accessory_id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    brand VARCHAR(50),
    name VARCHAR(100) NOT NULL,
    msrp DECIMAL(10,2),
    contribution DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Contributions table for spiffs/commissions
CREATE TABLE contributions (
    contribution_id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(device_id),
    plan_id INTEGER REFERENCES plans(plan_id),
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    upgrade_amount DECIMAL(10,2),
    new_line_amount DECIMAL(10,2),
    spiff_amount DECIMAL(10,2),
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Services table
CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    base_price DECIMAL(10,2),
    contribution DECIMAL(10,2),
    spiff_amount DECIMAL(10,2),
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Business Services table
CREATE TABLE business_services (
    service_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contribution_per_line DECIMAL(10,2),
    contribution_spiff DECIMAL(10,2),
    total_contribution DECIMAL(10,2),
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Hot Deals table
CREATE TABLE hot_deals (
    deal_id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(device_id),
    discount_amount DECIMAL(10,2),
    spiff_amount DECIMAL(10,2),
    new_dpp_price DECIMAL(10,2),
    welcome_unlimited_upgrade DECIMAL(10,2),
    unlimited_plus_upgrade DECIMAL(10,2),
    welcome_unlimited_new DECIMAL(10,2),
    unlimited_plus_new DECIMAL(10,2),
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for commonly queried fields
CREATE INDEX idx_devices_brand ON devices(brand_id);
CREATE INDEX idx_devices_category ON devices(category_id);
CREATE INDEX idx_devices_preowned ON devices(is_preowned);
CREATE INDEX idx_contributions_device ON contributions(device_id);
CREATE INDEX idx_contributions_plan ON contributions(plan_id);
CREATE INDEX idx_hot_deals_device ON hot_deals(device_id);

-- Insert sample data for brands
INSERT INTO brands (name) VALUES 
('Apple'),
('Samsung'),
('Google'),
('Motorola'),
('TCL');

-- Insert sample device categories
INSERT INTO device_categories (name) VALUES
('Smartphone'),
('Tablet'),
('Watch'),
('Basic Phone'),
('Mobile Hotspot');

-- Sample comment explaining the schema
COMMENT ON DATABASE veriplan IS 'Verizon product catalog and pricing database';