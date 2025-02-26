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

-- Create Device Contributions table
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

-- Create Service Contributions table
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

-- Create Verizon Plans table
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

-- Create Verizon Promotions table
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
