import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractVerizonBillData } from './bill-parser.js';
import { enhanceVerizonBillData, extractVerizonPhoneLines } from './verizon-bill-adapter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const billPath = path.join(__dirname, 'verizon-bill-sample.txt');

/**
 * Analyze the Verizon bill sample and extract structured data
 * This test demonstrates bill parsing and enhanced analysis
 */
const testVerizonBillAnalyzer = async () => {
  try {
    console.log('Starting Verizon bill analysis test...');

    // Read and parse the bill
    const billText = fs.readFileSync(billPath, 'utf8');
    console.log('Bill loaded successfully');
    
    // Extract structured data from bill text
    console.log('Extracting structured data from bill...');
    const billData = await extractVerizonBillData(Buffer.from(billText));
    if (!billData) {
      throw new Error('Failed to parse bill data');
    }
    
    // Enhance the bill data using our Verizon-specific adapter
    const enhancedBillData = enhanceVerizonBillData(billData);
    console.log(`Enhanced bill data: ${enhancedBillData.lineItems.length} line items, ${enhancedBillData.charges.length} other charges`);
    
    // Extract phone lines for better presentation
    const phoneLines = extractVerizonPhoneLines(enhancedBillData);
    
    console.log('\n----- Bill Data Summary -----');
    console.log(`Account: ${enhancedBillData.accountNumber || 'Unknown'}`);
    console.log(`Billing Period: ${enhancedBillData.billingPeriod || 'Unknown'}`);
    console.log(`Total Amount: $${enhancedBillData.totalAmount || '0.00'}`);
    console.log(`Phone Lines: ${phoneLines.length}`);
    console.log(`Line Items: ${enhancedBillData.lineItems.length}`);
    console.log(`Other Charges: ${enhancedBillData.charges.length}`);
    
    // Summarize phone lines
    console.log('\n----- Phone Lines -----');
    phoneLines.forEach((line, index) => {
      console.log(`[${index + 1}] ${line.phoneNumber}: ${line.deviceName || 'Unknown device'} - ${line.planName || 'Unknown plan'}`);
      console.log(`    Charges: ${line.charges.length}`);
    });
    
    // Summarize line items
    console.log('\n----- Line Items -----');
    enhancedBillData.lineItems.forEach((item, index) => {
      if (index < 15) { // Show only first few items to avoid cluttering the output
        console.log(`[${index + 1}] ${item.description} - $${item.amount}`);
      } else if (index === 15) {
        console.log(`... and ${enhancedBillData.lineItems.length - 15} more items`);
      }
    });
    
    // Summarize other charges
    console.log('\n----- Other Charges -----');
    enhancedBillData.charges.forEach((charge, index) => {
      if (index < 10) { // Show only first few items to avoid cluttering the output
        console.log(`[${index + 1}] ${charge.description} - $${charge.amount}`);
      } else if (index === 10) {
        console.log(`... and ${enhancedBillData.charges.length - 10} more charges`);
      }
    });

    // Try to connect to the enhanced analysis endpoint
    try {
      console.log('\n----- Enhanced Analysis -----');
      console.log('Attempting to call enhanced analysis endpoint...');
      
      const response = await fetch('http://localhost:3002/api/analyze-bill/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ billText: JSON.stringify(enhancedBillData) }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const result = await response.json();
      
      // Display key insights from enhanced analysis
      console.log('\n----- Enhanced Analysis Results -----');
      
      if (result.data.planRecommendations && result.data.planRecommendations.length > 0) {
        console.log('\nPlan Recommendations:');
        result.data.planRecommendations.forEach((rec, index) => {
          console.log(`[${index + 1}] ${rec.name} - ${rec.description}`);
        });
      }
      
      if (result.data.potentialSavings && result.data.potentialSavings.length > 0) {
        console.log('\nPotential Savings:');
        result.data.potentialSavings.forEach((saving, index) => {
          console.log(`[${index + 1}] ${saving.description} - $${saving.amount}`);
        });
      }
      
      if (result.data.unusedPerks && result.data.unusedPerks.length > 0) {
        console.log('\nUnused Perks:');
        result.data.unusedPerks.forEach((perk, index) => {
          console.log(`[${index + 1}] ${perk.name} - ${perk.description}`);
        });
      }
      
      // Save the full result to a file for review
      const resultPath = path.join(__dirname, 'verizon-bill-analysis-result.json');
      fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
      console.log(`\nFull analysis result saved to: ${resultPath}`);
    } catch (error) {
      console.warn('Note: Enhanced analysis server connection failed (this is OK)');
      console.warn('You can start the server with: node server/server.js');
      console.warn('Error details:', error.message);
      
      // Still save local analysis results
      const resultPath = path.join(__dirname, 'verizon-bill-local-analysis.json');
      fs.writeFileSync(resultPath, JSON.stringify({
        accountDetails: {
          accountNumber: enhancedBillData.accountNumber || 'Unknown',
          billingPeriod: enhancedBillData.billingPeriod || 'Unknown',
          totalAmount: enhancedBillData.totalAmount || 0,
          phoneLines: phoneLines
        }
      }, null, 2));
      console.log(`\nLocal analysis result saved to: ${resultPath}`);
    }

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

// Run the test
testVerizonBillAnalyzer();