# Verizon Product Database Setup

This database contains the complete Verizon product catalog including devices, plans, accessories, and contribution structures. Follow these steps to set up and populate the database.

## Setup Instructions

1. Create the database:
```sql
CREATE DATABASE verizon_products;
```

2. Connect to the database:
```sql
\c verizon_products
```

3. Execute the schema file to create tables:
```sql
\i schema.sql
```

4. Import the real product data:
```sql
\i import_data.sql
```

5. Create the views for easier querying:
```sql
\i views.sql
```

## Database Structure

The database is organized into several key tables:

- `devices`: All device products (phones, tablets, watches)
- `brands`: Device manufacturers
- `device_categories`: Product category classifications
- `plans`: Service plans (consumer and business)
- `accessories`: Cases, chargers, screen protectors, etc.
- `services`: Protection plans and additional services
- `business_services`: B2B specific offerings
- `contributions`: Commission and spiff structures
- `hot_deals`: Current promotions and discounts

## Useful Views

- `current_device_pricing`: Current devices with contributions
- `hot_deals_summary`: Active promotions and discounts
- `accessories_summary`: Accessories with margin calculations
- `business_services_summary`: B2B services and contributions
- `preowned_devices`: Pre-owned device inventory
- `service_contributions`: Service-related commissions

## Example Queries

1. Get all iPhone 16 models with pricing:
```sql
SELECT * FROM current_device_pricing 
WHERE brand = 'Apple' 
AND model_name LIKE 'iPhone 16%'
ORDER BY dpp_price;
```

2. Find accessories with highest margins:
```sql
SELECT * FROM accessories_summary
ORDER BY margin_percentage DESC
LIMIT 10;
```

3. View active hot deals:
```sql
SELECT * FROM hot_deals_summary
WHERE end_date >= CURRENT_DATE
ORDER BY discounted_price;
```

4. Check business service contributions:
```sql
SELECT * FROM business_services_summary
ORDER BY total_contribution DESC;
```

## Data Maintenance

The database includes end dates for promotional pricing and contributions. Regular maintenance should include:

1. Updating device prices
2. Managing promotion end dates
3. Adjusting contribution amounts
4. Adding new products

Use the provided views to validate data consistency and track changes over time.