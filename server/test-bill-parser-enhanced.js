import fs from 'fs';
import { extractVerizonBillData } from './bill-parser.js';

// Path to a sample bill PDF file
const sampleBillPath = process.argv[2];

if (!sampleBillPath) {
  console.error('Error: No PDF file path provided');
  console.log('Usage: node test-bill-parser-enhanced.js path/to/bill.pdf');
  process.exit(1);
}

async function testEnhancedBillParser() {
  console.log(`Testing enhanced bill parser with file: ${sampleBillPath}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(sampleBillPath)) {
      console.error(`Error: File not found at ${sampleBillPath}`);
      process.exit(1);
    }
    
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(sampleBillPath);
    console.log(`Read ${pdfBuffer.length} bytes from file`);
    
    // Process the bill using the enhanced parser
    console.log('\nProcessing bill with enhanced parser...');
    const result = await extractVerizonBillData(pdfBuffer);
    
    // Print results
    console.log('\n=== BILL ANALYSIS RESULTS ===');
    console.log(`Account Number: ${result.accountNumber || 'Unknown'}`);
    console.log(`Billing Period: ${result.billingPeriod || 'Unknown'}`);
    console.log(`Total Amount: $${result.totalAmount || '0.00'}`);
    
    // Print line items
    console.log(`\nLine Items (${result.lineItems.length}):`);
    if (result.lineItems.length > 0) {
      result.lineItems.forEach((item, i) => {
        console.log(`${i+1}. ${item.description}: $${item.amount} (${item.type})`);
      });
    } else {
      console.log('No line items found');
    }
    
    // Print other charges
    console.log(`\nOther Charges (${result.charges.length}):`);
    if (result.charges.length > 0) {
      result.charges.forEach((charge, i) => {
        console.log(`${i+1}. ${charge.description}: $${charge.amount} (${charge.type})`);
      });
    } else {
      console.log('No other charges found');
    }
    
    // Print subtotals
    console.log('\n=== SUBTOTALS ===');
    console.log(`Line Items: $${result.subtotals.lineItems.toFixed(2)}`);
    console.log(`Other Charges: $${result.subtotals.otherCharges.toFixed(2)}`);
    console.log(`Total: $${(result.subtotals.lineItems + result.subtotals.otherCharges).toFixed(2)}`);
    console.log(`Expected Total: $${result.totalAmount || '0.00'}`);
    
    // Print table validations if any
    if (result.tableValidations && result.tableValidations.length > 0) {
      console.log('\n=== TABLE VALIDATIONS ===');
      result.tableValidations.forEach((validation, i) => {
        console.log(`Table ${i+1} (${validation.tableType}): ${validation.status}`);
        console.log(`  Calculated: $${validation.calculatedTotal.toFixed(2)}`);
        console.log(`  Declared: $${validation.declaredTotal.toFixed(2)}`);
        console.log(`  Difference: $${validation.difference.toFixed(2)}`);
      });
    }
    
    // Write full result to file for inspection
    fs.writeFileSync('enhanced-bill-analysis.json', JSON.stringify(result, null, 2));
    console.log('\nFull result written to enhanced-bill-analysis.json');
    
  } catch (error) {
    console.error('Error testing enhanced bill parser:', error);
  }
}

testEnhancedBillParser();
