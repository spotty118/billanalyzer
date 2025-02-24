# Verizon Plans Update Guide (February 2025)

This guide explains how to update the Verizon plans data in the database with the latest pricing and features.

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

- `update_verizon_plans.sql`: SQL file containing the latest Verizon plan data
- `server/update-verizon-plans.js`: Node.js script to execute the SQL file against the Supabase database

## Prerequisites

Before running the update script, make sure you have the following environment variables set:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key
```

## Running the Update Script

```bash
npm run update-verizon-plans
```

This will:
1. Create the verizon_plans table if it doesn't exist
2. Delete existing plan data to avoid duplicates
3. Insert the updated plan data
4. Verify the data was inserted correctly

## Troubleshooting

If you encounter any issues:
1. Check environment variables are set correctly
2. Verify Supabase connection is working
3. Check SQL syntax for any errors
4. Verify exec_sql RPC function is enabled in Supabase

## Support

For questions or issues, please contact the development team or refer to the internal documentation.
