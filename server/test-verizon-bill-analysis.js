
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  enhanceVerizonBillData,
  analyzeBill
} from './verizon-bill-analyzer-improved.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const billPath = path.join(__dirname, 'verizon-bill-sample.txt');

/**
 * Test the enhanced bill analysis with proper billing period formatting
 * and empty array handling
 */
const testVerizonBillAnalysis = async () => {
  try {
    console.log('Starting bill analysis test with enhanced functionality...');

    // Read the bill sample
    const billText = fs.readFileSync(billPath, 'utf8');
    console.log('Bill loaded successfully');
    
    // Simple bill data object for testing
    const billData = {
      text: billText,
      lineItems: [],
      charges: []
    };
    
    // Process the bill data
    const enhancedBill = enhanceVerizonBillData(billData);
    console.log(`Enhanced bill processed. Account: ${enhancedBill.accountNumber}`);
    
    // Generate the complete analysis with recommendations
    const completeAnalysis = analyzeBill(enhancedBill);
    
    console.log('\n----- Complete Bill Analysis -----');
    console.log(`Account Number: ${completeAnalysis.accountNumber}`);
    console.log(`Billing Period: ${completeAnalysis.billingPeriod}`);
    console.log(`Total Amount: $${completeAnalysis.totalAmount.toFixed(2)}`);
    console.log(`Recommended Plan: ${completeAnalysis.planRecommendation.recommendedPlan}`);
    console.log(`Estimated Monthly Savings: $${completeAnalysis.planRecommendation.estimatedMonthlySavings.toFixed(2)}`);
    
    // Save result for verification
    fs.writeFileSync(
      path.join(__dirname, 'verizon-analysis-result.json'),
      JSON.stringify(completeAnalysis, null, 2)
    );
    
    console.log('\nAnalysis results saved to: verizon-analysis-result.json');
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testVerizonBillAnalysis();
