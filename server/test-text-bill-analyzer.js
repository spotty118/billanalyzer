import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractVerizonBillData } from './bill-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sampleBillPath = path.join(__dirname, 'sample-bill-text.txt');

const testTextBillAnalyzer = async () => {
  try {
    console.log('Starting text bill analysis test...');

    // Read and parse the sample bill
    const billText = fs.readFileSync(sampleBillPath, 'utf8');
    console.log('Sample bill loaded');
    
    // Extract structured data from bill text
    const billData = await extractVerizonBillData(Buffer.from(billText));
    if (!billData) {
      throw new Error('Failed to parse bill data');
    }
    console.log('Bill data extracted');
    console.log(JSON.stringify(billData, null, 2));

    // Call the enhanced analysis endpoint
    const response = await fetch('http://localhost:3002/api/analyze-bill/enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ billText: JSON.stringify(billData) }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const result = await response.json();
    console.log('\nEnhanced Analysis Results:');
    console.log(JSON.stringify(result, null, 2));

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

// Run the test
testTextBillAnalyzer();
