import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractAccountInfo } from './verizon-bill-adapter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const billPath = path.join(__dirname, 'verizon-bill-sample.txt');

/**
 * Test the account extraction functionality
 */
const testAccountExtraction = () => {
  try {
    console.log('Starting account extraction test...');

    // Read the bill sample
    const billText = fs.readFileSync(billPath, 'utf8');
    console.log('Bill loaded successfully');
    
    // Extract account information
    const accountInfo = extractAccountInfo(billText);
    
    console.log('\n----- Account Information -----');
    console.log(`Account Number: ${accountInfo.accountNumber}`);
    console.log(`Total Amount: $${accountInfo.totalAmount}`);
    console.log(`Billing Period: ${accountInfo.billingPeriod}`);
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testAccountExtraction();