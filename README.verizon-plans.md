# Verizon Plans Update Guide

This guide explains how to update the Verizon plans data in the database with the latest pricing and features.

## Overview

The Verizon plans data is stored in the Supabase database in the `verizon_plans` table. The data includes:

- Plan names (Unlimited Ultimate, Unlimited Plus, Unlimited Welcome)
- Pricing for 1, 2, 3, 4, and 5+ lines
- Features for each plan
- Data allowances
- Streaming quality
- Autopay discounts

## Files

- `update_verizon_plans.sql`: SQL file containing the latest Verizon plan data
- `server/update-verizon-plans.js`: Node.js script to execute the SQL file against the Supabase database

## Prerequisites

Before running the update script, make sure you have the following environment variables set:

- `SUPABASE_URL`: The URL of your Supabase project
- `SUPABASE_KEY`: The service role key for your Supabase project

You can set these environment variables in a `.env` file in the root of the project:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key
```

## Running the Update Script

You can run the update script using npm:

```bash
npm run update-verizon-plans
```

This will:

1. Read the SQL file
2. Split it into individual SQL statements
3. Execute each statement against the Supabase database
4. Log the results

## Modifying the Plan Data

If you need to update the plan data in the future, you can modify the `update_verizon_plans.sql` file with the new pricing and features. The SQL file is structured as follows:

1. Create the `verizon_plans` table if it doesn't exist
2. Delete existing Verizon plans to avoid duplicates
3. Insert the updated Unlimited Ultimate plan
4. Insert the updated Unlimited Plus plan
5. Insert the updated Unlimited Welcome plan
6. Update the timestamp
7. Verify the data

## Troubleshooting

If you encounter any issues running the update script, check the following:

1. Make sure the environment variables are set correctly
2. Check that the SQL file is valid and doesn't contain any syntax errors
3. Verify that the Supabase project has the `exec_sql` RPC function enabled

If you need to debug the script, you can modify it to log more information or to execute only specific SQL statements.
