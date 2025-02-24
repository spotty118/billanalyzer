# Verizon Plans & Promotions Update Guide (February 2025)

This guide explains how to update the Verizon plans and promotions data in the database.

## Current Plan Details

### Unlimited Ultimate ($65/line with 4 lines)
- 5G Ultra Wideband
- 60GB Mobile Hotspot
- International features in 210+ countries
- 1080p streaming
- Enhanced video calling
- Up to 50% off 2 connected device plans

### Unlimited Plus ($55/line with 4 lines)
- 5G Ultra Wideband
- 30GB Mobile Hotspot
- Mexico & Canada features
- 720p streaming
- Up to 50% off 1 connected device plan

### Unlimited Welcome ($40/line with 4 lines)
- 5G network access
- Mexico & Canada features
- 480p streaming
- No mobile hotspot

## Current Promotions

### Phone Deals
- iPhone 16 Pro Bundle ($2,000 value)
  - iPhone 16 Pro, iPad, and Apple Watch Series 10
  - Requires trade-in and new line
- Samsung Galaxy S25+ ($999 value)
  - Free with any phone trade-in
  - New line on myPlan required
- Google Pixel 9 Pro ($899 value)
  - Free with new line on Unlimited Ultimate

### Tablet & Watch Deals
- iPad (up to $599 value)
  - Free with select iPhone purchase
- Samsung Galaxy Tab S9 FE ($499 value)
  - Free with select Android phone purchase
- Apple Watch Series 10 (from $9/mo)
  - With eligible watch trade-in

### Accessory Deals
- Accessory Essential Bundle ($100)
- $100 off Samsung Galaxy Buds3 Pro
- $100 off Google Pixel Buds Pro 2

### Service Discounts
- Mobile + Home Bundle: Save up to $300/year
- BYOD: Up to $540 credit or free smartwatch
- Military/Student: Save up to $25/mo on myPlan

## Available Perks ($10/month each)
- Disney Bundle (Disney+, Hulu, ESPN+) - Save $11.99/mo
- Netflix & Max with Ads - Save $6.98/mo
- Apple One - Save $9.95/mo
- Apple Music Family - Save $6.99/mo
- YouTube Premium - Save $3.99/mo
- 100 GB Mobile Hotspot - Save $35/mo
- 3 TravelPass Days - Save $26/mo
- Unlimited Cloud Storage - Save $3.99/mo
- Google One AI Premium - Save $9.99/mo

## Line Pricing (per line)

| Plan              | 1 Line | 2 Lines | 3 Lines | 4 Lines | 5+ Lines |
|-------------------|--------|---------|---------|---------|-----------|
| Ultimate          | $100   | $90     | $75     | $65     | $65      |
| Plus             | $90    | $80     | $65     | $55     | $55      |
| Welcome          | $75    | $65     | $50     | $40     | $40      |

*All prices shown include Auto Pay & Paper-free billing discount ($10/mo)

## Files

- `update_verizon_plans.sql`: SQL file containing the latest plan data
- `update_verizon_promotions.sql`: SQL file containing the latest promotions
- `server/update-verizon-data.js`: Node.js script to execute both SQL files

## Prerequisites

Before running the update script, make sure you have the following environment variables set:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key
```

## Running the Update Script

```bash
npm run update-verizon
```

This will:
1. Update the plans data
   - Create/update the verizon_plans table
   - Insert latest plan pricing and features
   
2. Update the promotions data
   - Create/update the verizon_promotions table
   - Insert latest deals and discounts

## Troubleshooting

If you encounter any issues:
1. Check environment variables are set correctly
2. Verify Supabase connection is working
3. Check SQL syntax for any errors
4. Verify exec_sql RPC function is enabled in Supabase

## Support

For questions or issues, please contact the development team or refer to the internal documentation.
