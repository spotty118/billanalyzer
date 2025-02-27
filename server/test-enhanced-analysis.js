import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractVerizonBillData } from './bill-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sampleBillPath = path.join(__dirname, '..', 'sample-bill.txt');

const testEnhancedAnalysis = async () => {
  try {
    console.log('Starting enhanced bill analysis test...');

    // Read and parse the sample bill
    const billText = fs.readFileSync(sampleBillPath, 'utf8');
    console.log('Sample bill loaded');
    
    // Extract structured data from bill text
    const billData = await extractVerizonBillData(Buffer.from(billText));
    if (!billData) {
      throw new Error('Failed to parse bill data');
    }
    console.log('Bill data extracted');

    // Call the enhanced analysis endpoint
    const response = await fetch('http://localhost:4000/analyze-bill/enhanced', {
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
    console.log('\nUsage Analysis:', JSON.stringify(result.usageAnalysis, null, 2));
    console.log('\nCost Analysis:', JSON.stringify(result.costAnalysis, null, 2));
    console.log('\nPlan Recommendations:', JSON.stringify(result.planRecommendation, null, 2));

    // Validate the results
    const validationErrors = [];

    // Check usage analysis
    if (!result.usageAnalysis?.trend || !result.usageAnalysis?.percentageChange) {
      validationErrors.push('Missing usage analysis data');
    }

    // Check cost analysis
    if (!result.costAnalysis?.averageMonthlyBill || !result.costAnalysis?.projectedNextBill) {
      validationErrors.push('Missing cost analysis data');
    }

    // Check plan recommendations
    if (!result.planRecommendation?.recommendedPlan || !result.planRecommendation?.reasons) {
      validationErrors.push('Missing plan recommendations');
    }

    if (validationErrors.length > 0) {
      console.error('\nValidation Errors:', validationErrors);
      process.exit(1);
    }

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

// Run the test
testEnhancedAnalysis();
