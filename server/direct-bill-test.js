import fs from 'fs';
import { findChargesInText } from './bill-parser.js';

// Path to a sample bill text file
const sampleBillPath = process.argv[2];

if (!sampleBillPath) {
  console.error('Error: No text file path provided');
  console.log('Usage: node direct-bill-test.js path/to/bill.txt');
  process.exit(1);
}

async function testDirectBillParser() {
  console.log(`Testing direct bill parser with text file: ${sampleBillPath}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(sampleBillPath)) {
      console.error(`Error: File not found at ${sampleBillPath}`);
      process.exit(1);
    }
    
    // Read the text file
    const textContent = fs.readFileSync(sampleBillPath, 'utf8');
    console.log(`Read ${textContent.length} characters from file`);
    
    // Extract key information
    const accountMatch = textContent.match(/Account\s*(?:number|#)?[:.]?\s*(\d{3}[-.]?\d{3}[-.]?\d{4})/i);
    const accountNumber = accountMatch ? accountMatch[1] : 'Unknown';
    console.log('Account Number:', accountNumber);
    
    const periodMatch = textContent.match(/(?:Billing period|Bill cycle)[:.]?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s*-\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s*\d{4})/i);
    const billingPeriod = periodMatch ? periodMatch[1] : 'Unknown';
    console.log('Billing Period:', billingPeriod);
    
    const amountMatch = textContent.match(/Total\s+amount\s+due[:.]?\s*\$?\s*(\d+\.\d{2})/i);
    const totalAmount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    console.log('Total Amount:', totalAmount);
    
    // Process the bill using the direct parser
    console.log('\nProcessing bill with direct parser...');
    const charges = findChargesInText(textContent);
    
    // Filter out summary charges and duplicates
    const filteredCharges = charges.filter(charge => {
      // Skip summary totals and duplicates
      return !(charge.description.toLowerCase().includes('total') || 
          charge.description.toLowerCase().includes('account-wide') ||
          charge.description.toLowerCase().includes('one-time charges') ||
          charge.description.toLowerCase().includes('this month') ||
          charge.description.toLowerCase().includes('remaining') ||
          charge.description.toLowerCase().includes('total due') ||
          charge.description.toLowerCase().includes('unpaid balance') ||
          charge.description.toLowerCase().includes('the total amount due'));
    });
    
    // Remove duplicates
    const uniqueCharges = new Map();
    filteredCharges.forEach(charge => {
      // Use description as a unique key (ignore amount for deduplication)
      const key = charge.description;
      if (!uniqueCharges.has(key)) {
        uniqueCharges.set(key, charge);
      }
    });
    
    const uniqueChargesList = Array.from(uniqueCharges.values());
    console.log(`After cleaning and removing duplicates, found ${uniqueChargesList.length} unique charges`);
    
    // Categorize charges
    const lineItems = [];
    const otherCharges = [];
    
    uniqueChargesList.forEach(charge => {
      if (charge.lineNumber || 
          charge.type === 'lineAccess' || 
          charge.type === 'devicePayment' ||
          charge.description.toLowerCase().includes('line') ||
          charge.description.toLowerCase().includes('phone') ||
          charge.isDeviceCharge) {
        lineItems.push(charge);
      } else {
        otherCharges.push(charge);
      }
    });
    
    console.log(`\nFound ${lineItems.length} line items and ${otherCharges.length} other charges`);
    
    // Print line items
    if (lineItems.length > 0) {
      console.log('\n=== LINE ITEMS ===');
      lineItems.forEach((item, i) => {
        console.log(`${i+1}. ${item.description}: $${item.amount} (${item.type})`);
      });
    } else {
      console.log('No line items found');
    }
    
    // Print other charges
    if (otherCharges.length > 0) {
      console.log('\n=== OTHER CHARGES ===');
      otherCharges.forEach((charge, i) => {
        console.log(`${i+1}. ${charge.description}: $${charge.amount} (${charge.type})`);
      });
    } else {
      console.log('No other charges found');
    }
    
    // Calculate subtotals
    const lineItemsTotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const otherChargesTotal = otherCharges.reduce((sum, charge) => sum + charge.amount, 0);
    
    console.log('\n=== SUBTOTALS ===');
    console.log(`Line Items: $${lineItemsTotal.toFixed(2)}`);
    console.log(`Other Charges: $${otherChargesTotal.toFixed(2)}`);
    console.log(`Total: $${(lineItemsTotal + otherChargesTotal).toFixed(2)}`);
    console.log(`Expected Total: $${totalAmount}`);
    
    // Write results to file
    const result = {
      accountNumber,
      billingPeriod,
      totalAmount,
      lineItems,
      otherCharges,
      subtotals: {
        lineItems: lineItemsTotal,
        otherCharges: otherChargesTotal,
        total: lineItemsTotal + otherChargesTotal
      }
    };
    
    fs.writeFileSync('direct-bill-test-result.json', JSON.stringify(result, null, 2));
    console.log('\nFull result written to direct-bill-test-result.json');
    
  } catch (error) {
    console.error('Error testing direct bill parser:', error);
  }
}

testDirectBillParser();
