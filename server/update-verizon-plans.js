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

// Read the SQL file
const sqlFilePath = path.join(process.cwd(), 'update_verizon_plans.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Split SQL statements by semicolon
const sqlStatements = sqlContent
  .split(';')
  .map(statement => statement.trim())
  .filter(statement => statement.length > 0);

// Execute each SQL statement
async function executeSQL() {
  console.log('Updating Verizon plans in the database...');
  
  try {
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      console.log(`Executing statement ${i + 1} of ${sqlStatements.length}...`);
      
      // Execute the SQL statement
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
    
    console.log('Verizon plans updated successfully!');
  } catch (error) {
    console.error('Error updating Verizon plans:', error);
    process.exit(1);
  }
}

// Run the script
executeSQL();
