import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractAccountInfo, extractDeviceInfo, extractVerizonPhoneLines } from './verizon-bill-adapter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const billPath = path.join(__dirname, 'verizon-bill-sample.txt');

/**
 * Test the improved Verizon bill extraction functionality
 */
const testVerizonExtraction = async () => {
  try {
    console.log('Starting Verizon bill extraction test...');

    // Read the bill sample
    const billText = fs.readFileSync(billPath, 'utf8');
    console.log('Bill loaded successfully');
    
    // Simple bill data object for testing
    const billData = {
      text: billText,
      lineItems: [],
      charges: []
    };
    
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
    
    // Extract phone lines
    const phoneLines = extractVerizonPhoneLines(billData);
    console.log('\n----- Phone Lines -----');
    console.log(`Extracted ${phoneLines.size} phone lines`);
    
    let lineIndex = 1;
    phoneLines.forEach((line) => {
      console.log(`[${lineIndex++}] ${line.phoneNumber}: ${line.deviceName} - ${line.planName}`);
      console.log(`   Monthly Total: $${line.monthlyTotal.toFixed(2)}`);
      console.log(`   Charges: ${line.charges.length}`);
    });
    
    // Apply account info to the bill data
    const enhancedData = {
      ...billData,
      accountNumber: accountInfo.accountNumber,
      totalAmount: accountInfo.totalAmount,
      billingPeriod: accountInfo.billingPeriod,
      phoneLines: Array.from(phoneLines.values())
    };
    
    // Save enhanced data for inspection
    fs.writeFileSync(
      path.join(__dirname, 'verizon-extraction-result.json'),
      JSON.stringify(enhancedData, null, 2)
    );
    
    console.log('\nEnhanced bill data saved to: verizon-extraction-result.json');
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testVerizonExtraction();