import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  extractAccountInfo, 
  extractDeviceInfo, 
  enhanceVerizonBillData,
  createVerizonBillSummary
} from './verizon-bill-analyzer-improved.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const billPath = path.join(__dirname, 'verizon-bill-sample.txt');

/**
 * Test the complete Verizon bill analysis process
 */
const testVerizonBillAnalyzer = async () => {
  try {
    console.log('Starting comprehensive Verizon bill analysis test...');

    // Read the bill sample
    const billText = fs.readFileSync(billPath, 'utf8');
    console.log('Bill loaded successfully');
    
    // Simple bill data object for testing
    const billData = {
      text: billText,
      lineItems: [],
      charges: []
    };
    
    // Extract charges from the bill text to prepare initial bill data
    // (Normally this would be done by the bill parser, but for testing we'll create some sample charges)
    const chargeMatches = billText.match(/\$\s*(\d+\.\d+)/g) || [];
    
    // Create some sample charges for testing
    chargeMatches.slice(0, 10).forEach((match, index) => {
      const amount = parseFloat(match.replace('$', '').trim());
      const surroundingText = billText.substring(
        Math.max(0, billText.indexOf(match) - 50),
        Math.min(billText.length, billText.indexOf(match) + 50)
      );
      
      billData.charges.push({
        id: `charge-${index}`,
        description: surroundingText.replace(/\n/g, ' ').trim(),
        amount,
        type: surroundingText.includes('phone') ? 'phone' : 'other',
        category: 'bill'
      });
    });
    
    console.log(`Created ${billData.charges.length} sample charges for testing`);
    
    // Extract account information
    const accountInfo = extractAccountInfo(billText);
    console.log('\n----- Account Information -----');
    console.log(`Account Number: ${accountInfo.accountNumber}`);
    console.log(`Total Amount: $${accountInfo.totalAmount}`);
    console.log(`Billing Period: ${accountInfo.billingPeriod}`);
    
    // Extract device information
    const deviceInfo = extractDeviceInfo(billText);
    console.log('\n----- Device Information -----');
    console.log(`Found ${deviceInfo.length} devices`);
    deviceInfo.forEach((device, index) => {
      console.log(`[${index + 1}] ${device.device} (${device.phoneNumber}) - ${device.planType}`);
    });
    
    // Process the full bill data with our improved analyzer
    const enhancedBill = enhanceVerizonBillData(billData);
    
    console.log('\n----- Enhanced Bill Data -----');
    console.log(`Account Number: ${enhancedBill.accountNumber}`);
    console.log(`Total Amount: $${enhancedBill.totalAmount}`);
    console.log(`Billing Period: ${enhancedBill.billingPeriod}`);
    console.log(`Phone Lines: ${enhancedBill.phoneLines.length}`);
    console.log(`General Charges: ${enhancedBill.charges.length}`);
    
    // Generate a bill summary
    const billSummary = createVerizonBillSummary(enhancedBill);
    
    console.log('\n----- Bill Summary -----');
    console.log(`Account: ${billSummary.accountNumber}`);
    console.log(`Period: ${billSummary.billingPeriod}`);
    console.log(`Total Amount: $${billSummary.totalAmount.toFixed(2)}`);
    console.log('Phone Lines:');
    billSummary.phoneLines.forEach((line, index) => {
      console.log(`  [${index + 1}] ${line.phoneNumber}: ${line.deviceName} - $${line.monthlyTotal.toFixed(2)}`);
    });
    
    console.log('Device Types:');
    for (const [type, count] of Object.entries(billSummary.deviceTypes)) {
      console.log(`  ${type}: ${count}`);
    }
    
    // Save enhanced data and summary for inspection
    fs.writeFileSync(
      path.join(__dirname, 'verizon-analyzer-result.json'),
      JSON.stringify({
        enhancedBill,
        billSummary
      }, null, 2)
    );
    
    console.log('\nAnalysis results saved to: verizon-analyzer-result.json');
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testVerizonBillAnalyzer();