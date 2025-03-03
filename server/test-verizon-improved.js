import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractAccountInfo, extractDeviceInfo } from './verizon-bill-adapter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const billPath = path.join(__dirname, 'verizon-bill-sample.txt');

/**
 * Test the improved Verizon bill extraction functionality
 */
const testVerizonImproved = async () => {
  try {
    console.log('Starting improved Verizon bill extraction test...');

    // Read the bill sample
    const billText = fs.readFileSync(billPath, 'utf8');
    console.log('Bill loaded successfully');
    
    // Simple bill data object for testing
    const billData = {
      text: billText
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
    
    // Create an enhanced bill object
    const enhancedBill = {
      accountNumber: accountInfo.accountNumber,
      totalAmount: accountInfo.totalAmount,
      billingPeriod: accountInfo.billingPeriod,
      devices: deviceInfo,
      phoneLines: [],
      charges: []
    };
    
    // Convert devices to phone lines
    enhancedBill.phoneLines = deviceInfo.map(device => ({
      phoneNumber: device.phoneNumber,
      deviceName: device.device,
      planName: device.planType,
      monthlyTotal: 0, // We'd calculate this if we had charge data
      charges: []
    }));
    
    console.log('\n----- Phone Lines -----');
    console.log(`Created ${enhancedBill.phoneLines.length} phone lines from device info`);
    
    enhancedBill.phoneLines.forEach((line, index) => {
      console.log(`[${index + 1}] ${line.phoneNumber}: ${line.deviceName} - ${line.planName}`);
    });
    
    // Save enhanced data for inspection
    fs.writeFileSync(
      path.join(__dirname, 'verizon-improved-result.json'),
      JSON.stringify(enhancedBill, null, 2)
    );
    
    console.log('\nEnhanced bill data saved to: verizon-improved-result.json');
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testVerizonImproved();