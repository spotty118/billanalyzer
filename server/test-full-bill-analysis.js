
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  enhanceVerizonBillData,
  analyzeBill
} from './verizon-bill-analyzer-improved.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const billPath = path.join(__dirname, 'verizon-bill-sample.txt');
const outputPath = path.join(__dirname, 'verizon-bill-final-analysis.json');

/**
 * Comprehensive test of the full Verizon bill analysis pipeline 
 * Demonstrates the complete workflow from raw bill to final analysis
 */
const testFullBillAnalysis = async () => {
  try {
    console.log('Starting full bill analysis pipeline test...');

    // Read the bill sample
    const billText = fs.readFileSync(billPath, 'utf8');
    console.log('Bill text loaded successfully');
    
    // Create initial bill data object 
    const billData = {
      text: billText,
      lineItems: [],
      charges: []
    };
    
    // Step 1: Enhance the bill data with detailed line information
    console.log('\nStep 1: Enhancing bill data...');
    const enhancedBill = enhanceVerizonBillData(billData);
    console.log(`Enhanced bill has ${enhancedBill.phoneLines.length} phone lines and ${enhancedBill.lineItems.length} line items`);
    
    // Step 2: Create the full analysis with proper formatting
    console.log('\nStep 2: Generating complete bill analysis...');
    const fullAnalysis = analyzeBill(enhancedBill);
    
    // Step 3: Display the key components of the analysis
    console.log('\n----- Analysis Results -----');
    console.log(`Account Number: ${fullAnalysis.accountNumber}`);
    console.log(`Billing Period: ${fullAnalysis.billingPeriod}`);
    console.log(`Total Amount: $${fullAnalysis.totalAmount.toFixed(2)}`);
    console.log(`Recommended Plan: ${fullAnalysis.planRecommendation.recommendedPlan}`);
    console.log(`Est. Monthly Savings: $${fullAnalysis.planRecommendation.estimatedMonthlySavings.toFixed(2)}`);
    console.log(`Confidence Score: ${fullAnalysis.planRecommendation.confidenceScore}`);
    
    // Step 4: Verify we have properly structured data
    if (Array.isArray(fullAnalysis.lineItems)) {
      console.log(`\nLine Items: ${fullAnalysis.lineItems.length}`);
    } else {
      console.error('Error: lineItems is not an array!');
    }
    
    if (Array.isArray(fullAnalysis.charges)) {
      console.log(`Charges: ${fullAnalysis.charges.length}`);
    } else {
      console.error('Error: charges is not an array!');
    }
    
    // Save the final analysis output
    fs.writeFileSync(outputPath, JSON.stringify(fullAnalysis, null, 2));
    console.log(`\nFull analysis results saved to: ${outputPath}`);
    console.log('Integration test completed successfully!');
    
    return fullAnalysis;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
};

// Run the test and export the result
const result = testFullBillAnalysis();
export default result;
