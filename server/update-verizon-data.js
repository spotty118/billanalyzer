#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLFile(filePath, description) {
  console.log(`Processing ${description}...`);
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    // Split SQL statements by semicolon
    const sqlStatements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    // Execute each SQL statement
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      console.log(`Executing statement ${i + 1} of ${sqlStatements.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        // Continue with the next statement
      } else {
        console.log(`Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log(`${description} updated successfully!`);
  } catch (error) {
    console.error(`Error updating ${description}:`, error);
    throw error;
  }
}

// Execute all SQL files
async function updateVerizonData() {
  try {
    // Update plans
    await executeSQLFile(
      path.join(process.cwd(), 'update_verizon_plans.sql'),
      'Verizon plans'
    );

    // Update promotions
    await executeSQLFile(
      path.join(process.cwd(), 'update_verizon_promotions.sql'),
      'Verizon promotions'
    );

    // Update contributions
    await executeSQLFile(
      path.join(process.cwd(), 'update_verizon_contributions.sql'),
      'Verizon contributions'
    );

    console.log('All Verizon data updated successfully!');
  } catch (error) {
    console.error('Error updating Verizon data:', error);
    process.exit(1);
  }
}

// Run the update
updateVerizonData();
