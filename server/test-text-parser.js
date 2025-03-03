import fs from 'fs';
import { extractVerizonBillData } from './bill-parser.js';

// Path to a sample bill text file
const sampleBillPath = process.argv[2] || '../sample-bill.txt';

async function testTextParser() {
  console.log(`Testing bill parser with text file: ${sampleBillPath}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(sampleBillPath)) {
      console.error(`Error: File not found at ${sampleBillPath}`);
      console.log('Usage: node test-text-parser.js [path-to-bill.txt]');
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
    const mockBuffer = {
      toString: () => textContent
    };
    
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
    console.log(`\nAccount Number: ${result.accountNumber}`);
    console.log(`Billing Period: ${result.billingPeriod}`);
    console.log(`Total Amount: $${result.totalAmount}`);
    console.log(`Line Items: ${result.lineItems.length}`);
    console.log(`Other Charges: ${result.charges.length}`);
    
    // Print sample charges
    if (result.lineItems.length > 0) {
      console.log('\n--- SAMPLE LINE ITEMS ---');
      result.lineItems.slice(0, 5).forEach((item, i) => {
        console.log(`${i+1}. ${item.description}: $${item.amount} (${item.type})`);
      });
    }
    
    if (result.charges.length > 0) {
      console.log('\n--- SAMPLE OTHER CHARGES ---');
      result.charges.slice(0, 5).forEach((charge, i) => {
        console.log(`${i+1}. ${charge.description}: $${charge.amount} (${charge.type})`);
      });
    }
    
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
    
    // Write full result to file for inspection
    fs.writeFileSync('bill-analysis-result.json', JSON.stringify(result, null, 2));
    console.log('\nFull result written to bill-analysis-result.json');
    
  } catch (error) {
    console.error('Error testing parser:', error);
  }
}

testTextParser();
