import fs from 'fs';
import path from 'path';
import { extractVerizonBillData } from './bill-parser.js';

// Path to a sample bill text file
const sampleBillPath = process.argv[2] || '../sample-bill.txt';

// Mock the PDF extraction function for testing with text
const mockPdfExtraction = async (text) => {
  return {
    text: text.toString(),
    markdown: text.toString()
  };
};

async function testBillParser() {
  console.log(`Testing bill parser with file: ${sampleBillPath}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(sampleBillPath)) {
      console.error(`Error: File not found at ${sampleBillPath}`);
      console.log('Usage: node test-bill-parser.js [path-to-bill.txt]');
      process.exit(1);
    }
    
    // Read the text file
    const textContent = fs.readFileSync(sampleBillPath, 'utf8');
    console.log(`Read ${textContent.length} characters from file`);
    
    // Create a mock buffer for compatibility with the bill parser
    const mockBuffer = {
      toString: () => textContent
    };
    
    // Override the PDF extraction function for testing
    const originalExtractPdfText = await import('./pdf-parser.js').then(m => m.extractPdfText);
    const pdfParserModule = await import('./pdf-parser.js');
    pdfParserModule.extractPdfText = async (buffer) => mockPdfExtraction(buffer.toString());
    
    // Process the bill
    console.log('Processing bill...');
    const result = await extractVerizonBillData(mockBuffer);
    
    // Restore the original function
    pdfParserModule.extractPdfText = originalExtractPdfText;
    
    // Print summary
    console.log('\n--- BILL ANALYSIS SUMMARY ---');
    console.log(`Account: ${result.accountNumber}`);
    console.log(`Billing Period: ${result.billingPeriod}`);
    console.log(`Total Amount: $${result.totalAmount}`);
    console.log(`Line Items: ${result.lineItems.length}`);
    console.log(`Other Charges: ${result.charges.length}`);
    
    // Print subtotals
    console.log('\n--- SUBTOTALS ---');
    console.log(`Line Items: $${result.subtotals.lineItems}`);
    console.log(`Other Charges: $${result.subtotals.otherCharges}`);
    
    if (result.subtotals.bySource) {
      console.log('\n--- BY SOURCE ---');
      Object.entries(result.subtotals.bySource).forEach(([source, amount]) => {
        console.log(`${source}: $${amount}`);
      });
    }
    
    if (result.subtotals.byTableType) {
      console.log('\n--- BY TABLE TYPE ---');
      Object.entries(result.subtotals.byTableType).forEach(([type, amount]) => {
        console.log(`${type}: $${amount}`);
      });
    }
    
    // Print table validations
    if (result.tableValidations && result.tableValidations.length > 0) {
      console.log('\n--- TABLE VALIDATIONS ---');
      result.tableValidations.forEach(validation => {
        console.log(`Table Type: ${validation.tableType}`);
        console.log(`Status: ${validation.status}`);
        console.log(`Calculated: $${validation.calculatedTotal}`);
        console.log(`Declared: $${validation.declaredTotal}`);
        console.log(`Difference: $${validation.difference}`);
        console.log('---');
      });
    }
    
    // Print line items
    if (result.lineItems.length > 0) {
      console.log('\n--- LINE ITEMS ---');
      result.lineItems.forEach((item, i) => {
        console.log(`${i+1}. ${item.description}: $${item.amount}`);
      });
    } else {
      console.log('\nNo line items found');
    }
    
    // Print other charges
    if (result.charges.length > 0) {
      console.log('\n--- OTHER CHARGES ---');
      result.charges.forEach((charge, i) => {
        console.log(`${i+1}. ${charge.description}: $${charge.amount}`);
      });
    } else {
      console.log('\nNo other charges found');
    }
    
    // Write full result to file for inspection
    fs.writeFileSync('bill-analysis-result.json', JSON.stringify(result, null, 2));
    console.log('\nFull result written to bill-analysis-result.json');
    
  } catch (error) {
    console.error('Error testing bill parser:', error);
  }
}

testBillParser();
