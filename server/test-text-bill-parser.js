import fs from 'fs';
import { extractVerizonBillData } from './bill-parser.js';

// Path to a sample bill text file
const sampleBillPath = process.argv[2];

if (!sampleBillPath) {
  console.error('Error: No text file path provided');
  console.log('Usage: node test-text-bill-parser.js path/to/bill.txt');
  process.exit(1);
}

async function testTextBillParser() {
  console.log(`Testing bill parser with text file: ${sampleBillPath}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(sampleBillPath)) {
      console.error(`Error: File not found at ${sampleBillPath}`);
      process.exit(1);
    }
    
    // Read the text file
    const textContent = fs.readFileSync(sampleBillPath, 'utf8');
    console.log(`Read ${textContent.length} characters from file`);
    
    // Create a mock PDF extraction result
    const mockPdfResult = {
      text: textContent,
      markdown: textContent
    };
    
    // Create a mock buffer for compatibility with the bill parser
    const mockBuffer = Buffer.from(textContent);
    
    // Override the PDF extraction function for testing
    const originalModule = await import('./pdf-parser.js');
    const originalExtractPdfText = originalModule.extractPdfText;
    
    // Create a mock version that returns our text content
    originalModule.extractPdfText = async () => mockPdfResult;
    
    // Process the bill using the enhanced parser
    console.log('\nProcessing bill with enhanced parser...');
    const result = await extractVerizonBillData(mockBuffer);
    
    // Restore the original function
    originalModule.extractPdfText = originalExtractPdfText;
    
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
    
    // Write full result to file for inspection
    fs.writeFileSync('text-bill-analysis.json', JSON.stringify(result, null, 2));
    console.log('\nFull result written to text-bill-analysis.json');
    
  } catch (error) {
    console.error('Error testing text bill parser:', error);
  }
}

testTextBillParser();
