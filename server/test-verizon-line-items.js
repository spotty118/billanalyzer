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
 * Test the Verizon bill analyzer's ability to extract detailed line items
 */
const testVerizonLineItemExtraction = async () => {
  try {
    console.log('Starting Verizon line item extraction test...');

    // Read the bill sample
    const billText = fs.readFileSync(billPath, 'utf8');
    console.log('Bill loaded successfully');
    
    // Simple bill data object for testing
    const billData = {
      text: billText,
      lineItems: [],
      charges: []
    };
    
    // Create some sample charges to simulate what the bill parser would provide
    // These will be supplemented with the detailed line item extraction
    const chargePatterns = [
      { regex: /Unlimited Plus.+?\$(\d+\.\d+)/g, type: 'plan' },
      { regex: /Wireless Phone Protection.+?\$(\d+\.\d+)/g, type: 'protection' },
      { regex: /Payment \d+ of \d+.+?\$(\d+\.\d+)/g, type: 'device_payment' },
      { regex: /Fed Universal Service.+?\$(\d+\.\d+)/g, type: 'surcharge' }
    ];
    
    chargePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(billText)) !== null) {
        const amount = parseFloat(match[1]);
        const surroundingText = billText.substring(
          Math.max(0, match.index - 100),
          Math.min(billText.length, match.index + match[0].length + 100)
        );
        
        // Look for phone number in the surrounding text
        const phoneMatch = surroundingText.match(/\(?\d{3}[.-]?\d{3}[.-]?\d{4}\)?/);
        
        billData.charges.push({
          id: `charge-${billData.charges.length}`,
          description: match[0] + (phoneMatch ? ` for ${phoneMatch[0]}` : ''),
          amount,
          type: pattern.type,
          category: 'bill',
          phoneNumber: phoneMatch ? phoneMatch[0].replace(/[().-]/g, '') : null
        });
      }
    });
    
    console.log(`Created ${billData.charges.length} sample charges for testing`);
    
    // Process the bill data with our improved analyzer
    const enhancedBill = enhanceVerizonBillData(billData);
    
    console.log('\n----- Enhanced Bill with Line Items -----');
    console.log(`Account Number: ${enhancedBill.accountNumber}`);
    console.log(`Total Amount: $${enhancedBill.totalAmount}`);
    console.log(`Billing Period: ${enhancedBill.billingPeriod}`);
    console.log(`Phone Lines: ${enhancedBill.phoneLines.length}`);
    
    // Display detailed line items for each phone
    console.log('\n----- Detailed Phone Line Breakdown -----');
    
    enhancedBill.lineDetails.forEach((line, index) => {
      console.log(`\n[${index + 1}] ${line.deviceName} (${line.phoneNumber})`);
      console.log(`   Plan: ${line.details.plan} - $${line.details.planCost.toFixed(2)}`);
      
      if (line.details.planDiscount > 0) {
        console.log(`   Plan Discount: -$${line.details.planDiscount.toFixed(2)}`);
      }
      
      if (line.details.devicePaymentAmount > 0) {
        console.log(`   Device Payment: $${line.details.devicePaymentAmount.toFixed(2)} (${line.details.devicePayment} remaining)`);
      }
      
      if (line.details.protection > 0) {
        console.log(`   Protection Plan: $${line.details.protection.toFixed(2)}`);
      }
      
      if (line.details.credits > 0) {
        console.log(`   Credits: -$${line.details.credits.toFixed(2)}`);
      }
      
      if (line.details.surcharges > 0) {
        console.log(`   Surcharges: $${line.details.surcharges.toFixed(2)}`);
      }
      
      if (line.details.taxes > 0) {
        console.log(`   Taxes & Fees: $${line.details.taxes.toFixed(2)}`);
      }
      
      console.log(`   Monthly Total: $${line.monthlyTotal.toFixed(2)}`);
    });
    
    // Generate a bill summary
    const billSummary = createVerizonBillSummary(enhancedBill);
    
    console.log('\n----- Bill Summary -----');
    console.log(`Account: ${billSummary.accountNumber}`);
    console.log(`Period: ${billSummary.billingPeriod}`);
    console.log(`Total Amount: $${billSummary.totalAmount.toFixed(2)}`);
    
    console.log('\nPhone Lines Summary:');
    billSummary.phoneLines.forEach((line, index) => {
      console.log(`  [${index + 1}] ${line.phoneNumber}: ${line.deviceName} - $${line.monthlyTotal.toFixed(2)}`);
      
      // Display line items if available
      if (Object.keys(line.lineItems).length > 0) {
        console.log('    Line Items:');
        for (const [key, value] of Object.entries(line.lineItems)) {
          if (typeof value === 'number' && value > 0) {
            console.log(`      ${key}: $${value.toFixed(2)}`);
          } else if (key === 'devicePayment' && value !== '0') {
            console.log(`      ${key}: ${value}`);
          }
        }
      }
    });
    
    // Save enhanced data for inspection
    fs.writeFileSync(
      path.join(__dirname, 'verizon-line-items-result.json'),
      JSON.stringify({
        enhancedBill,
        billSummary
      }, null, 2)
    );
    
    console.log('\nLine item analysis results saved to: verizon-line-items-result.json');
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testVerizonLineItemExtraction();